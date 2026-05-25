#!/usr/bin/env bash
# scripts/patch-android-signing.sh
# Adds release signing config to android/app/build.gradle after `expo prebuild --platform android`.
#
# What this does:
#   1. Inserts a `signingConfigs.release` block (next to the existing debug block)
#      that reads creds from gradle.properties (VOGEL_RELEASE_* vars).
#   2. Swaps the release buildType's `signingConfig signingConfigs.debug` →
#      `signingConfig signingConfigs.release`. (Leaves debug buildType alone.)
#
# Requires (from gradle.properties):
#   VOGEL_RELEASE_STORE_FILE       (e.g. vogel-release.keystore)
#   VOGEL_RELEASE_STORE_PASSWORD
#   VOGEL_RELEASE_KEY_ALIAS
#   VOGEL_RELEASE_KEY_PASSWORD
#
# Safe to re-run: detects if already patched and exits early.

set -euo pipefail

GRADLE_FILE="android/app/build.gradle"

if [ ! -f "$GRADLE_FILE" ]; then
  echo "[patch-android-signing] ERROR: $GRADLE_FILE not found. Did you run 'expo prebuild --platform android'?"
  exit 1
fi

if grep -q "VOGEL_RELEASE_STORE_FILE" "$GRADLE_FILE"; then
  echo "[patch-android-signing] Already patched — skipping."
  exit 0
fi

echo "[patch-android-signing] Patching $GRADLE_FILE..."

python3 - <<'PYEOF'
import re, sys, pathlib

path = pathlib.Path("android/app/build.gradle")
src = path.read_text(encoding="utf-8")
original = src

# --- 1) Inject release signing block right after the debug { } sub-block in signingConfigs ---
release_signing_block = """
        release {
            if (project.hasProperty('VOGEL_RELEASE_STORE_FILE')) {
                storeFile file(VOGEL_RELEASE_STORE_FILE)
                storePassword VOGEL_RELEASE_STORE_PASSWORD
                keyAlias VOGEL_RELEASE_KEY_ALIAS
                keyPassword VOGEL_RELEASE_KEY_PASSWORD
            }
        }
"""

# Match `signingConfigs { ... debug { ... } }` and capture the closing `}` of `debug { ... }`.
# We insert the release block right after that inner `}`, BEFORE the outer signingConfigs `}`.
pattern_signing = re.compile(
    r"(signingConfigs\s*\{[^}]*?debug\s*\{[^}]*?\})",
    re.DOTALL
)
m = pattern_signing.search(src)
if not m:
    sys.exit("[patch-android-signing] Could not locate signingConfigs.debug block")
src = src[:m.end()] + "\n" + release_signing_block.rstrip() + "\n" + src[m.end():]

# --- 2) In buildTypes.release { ... }, swap `signingConfig signingConfigs.debug` → `signingConfigs.release` ---
# Strategy: find the `release {` opener inside `buildTypes {`, then within that block (until next sibling `}`) swap the line.
# Simpler: do a targeted swap on the release-block-only signingConfig line by anchoring on the preceding comment line.

# The expo-prebuild template puts a specific comment before the release block's signingConfig line:
#   // see https://reactnative.dev/docs/signed-apk-android.
#   signingConfig signingConfigs.debug
# We anchor on that comment to disambiguate from the debug block's identical line.

pattern_release_swap = re.compile(
    r"(// see https://reactnative\.dev/docs/signed-apk-android\.\s*\n\s*)signingConfig\s+signingConfigs\.debug",
)
new_src, n = pattern_release_swap.subn(r"\1signingConfig signingConfigs.release", src)

if n == 0:
    # Fallback: locate buildTypes { ... release { ... } and rewrite the *second* occurrence of
    # `signingConfig signingConfigs.debug` (the first is the debug buildType, the second is release).
    occurrences = [m for m in re.finditer(r"signingConfig\s+signingConfigs\.debug", src)]
    if len(occurrences) < 2:
        sys.exit("[patch-android-signing] Could not find buildTypes.release.signingConfig line to swap (no anchor comment, no second occurrence)")
    second = occurrences[1]
    new_src = src[:second.start()] + "signingConfig signingConfigs.release" + src[second.end():]
    n = 1

if n == 0:
    sys.exit("[patch-android-signing] Swap failed unexpectedly")

path.write_text(new_src, encoding="utf-8")
print(f"[patch-android-signing] OK — patched {path} (swapped {n} buildType signingConfig line)")
PYEOF

echo "[patch-android-signing] Done."
