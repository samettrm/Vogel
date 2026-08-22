#!/usr/bin/env bash
# ━━━ Vogel — LOCAL iOS release build + TestFlight (macOS) ━━━
# Codemagic'in yerini alir. Arsiv + imzalama + IPA export, istege bagli upload.
#
# Kullanim:
#   scripts/build-ios-local.sh            # sadece IPA uret
#   scripts/build-ios-local.sh --upload   # IPA uret + App Store Connect'e yukle
#
# NEDEN YEREL: build'ler bu makineden aliniyor (Samet'in 23 Agu 2026 talimati).
# codemagic.yaml duruyor ama main'e push CI'yi de tetikliyor — yerel build
# alirken push edilirse CIFTE build olur. Once yerel build + upload, sonra push.
#
# Lexora'nin ayni isi yapan betiginden uyarlandi. Iki fark:
#   1) Vogel'de .env YOK — EXPO_PUBLIC_* degiskenleri eas.json'un production
#      profilinde duruyor. Bundle'a gomulmeleri icin buradan okunup export
#      ediliyor; tek dogruluk kaynagi eas.json kalsin diye kopyalanmadi.
#   2) Vogel'de patch-ios-podfile.mjs yok, o adim atlaniyor.
set -euo pipefail

UPLOAD=0
[ "${1:-}" = "--upload" ] && UPLOAD=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCHEME="VogelLanguageLessons"
WORKSPACE="ios/VogelLanguageLessons.xcworkspace"
BUNDLE_ID="com.yenipc002.Vogel"
TEAM_ID="NJA9MF2TQK"                     # BUSATER YAZILIM A.S.
ASC_APP_ID="6771534635"                  # Vogel: Language Lessons

# ASC API anahtari Lexora ile ORTAK (ayni Apple takimi, ayni dagitim sertifikasi
# — bkz. CLAUDE.md "Lexora ile ortak distribution cert"). Anahtar hesap
# duzeyindedir, uygulamaya ozel degildir; yalnizca ASC_APP_ID farklidir.
ASC_ENV_FILE="${VOGEL_ASC_ENV:-$HOME/GittekiRepolar/Lexora/credentials/asc-busater.env}"
ASC_CLI="$HOME/.lexora-ios-venv/bin/app-store-connect"

# CocoaPods UTF-8 locale ister; LANG tanimsizsa ASCII-8BIT'e duser ve
# "Unicode Normalization not appropriate for ASCII-8BIT" ile patlar.
export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

# ---- KAPI 1: eas.json'daki EXPO_PUBLIC_* degiskenleri ----
# Bunlar bundle'a INLINE gomuluyor; eksikse uygulama sessizce anahtarsiz cikar.
echo "▶ [0/6] eas.json production env okunuyor…"
eval "$(node -e '
  const e = require("./eas.json").build.production.env || {};
  for (const [k, v] of Object.entries(e)) {
    if (!k.startsWith("EXPO_PUBLIC_") && !k.startsWith("SENTRY_")) continue;
    console.log(`export ${k}=${JSON.stringify(String(v))}`);
  }
')"
REQUIRED=(
  EXPO_PUBLIC_FIREBASE_API_KEY
  EXPO_PUBLIC_FIREBASE_APP_ID
  EXPO_PUBLIC_FIREBASE_PROJECT_ID
  EXPO_PUBLIC_RC_API_KEY_IOS
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
)
MISSING=()
for v in "${REQUIRED[@]}"; do [ -n "${!v:-}" ] || MISSING+=("$v"); done
if [ ${#MISSING[@]} -gt 0 ]; then
  echo "FATAL: eas.json production env eksik:" >&2; printf '  - %s\n' "${MISSING[@]}" >&2; exit 1
fi

# ---- App Store Connect kimligi ----
[ -f "$ASC_ENV_FILE" ] || { echo "FATAL: ASC env yok: $ASC_ENV_FILE" >&2; exit 1; }
set -a; source "$ASC_ENV_FILE"; set +a
[ -f "$ASC_PRIVATE_KEY_PATH" ] || { echo "FATAL: ASC .p8 yok: $ASC_PRIVATE_KEY_PATH" >&2; exit 1; }
echo "✓ env + ASC kimligi hazir (takim: $TEAM_ID, proje: $EXPO_PUBLIC_FIREBASE_PROJECT_ID)"

# ---- Build numarasi: ASC'deki son + 1 ----
# Tek dogruluk kaynagi App Store Connect. app.json'daki buildNumber remote
# appVersionSource yuzunden zaten yok sayiliyordu ve geride kalmisti.
echo "▶ [1/6] build numarasi hesaplaniyor…"
LATEST=$("$ASC_CLI" get-latest-build-number "$ASC_APP_ID" \
  --issuer-id "$ASC_ISSUER_ID" --key-id "$ASC_KEY_ID" \
  --private-key "@file:$ASC_PRIVATE_KEY_PATH" 2>/dev/null | tail -1 | tr -dc '0-9')
[ -n "$LATEST" ] || { echo "FATAL: ASC'den build numarasi okunamadi." >&2; exit 1; }
NEXT=$((LATEST + 1))
node - "$NEXT" <<'NODE'
const fs = require("fs");
const next = process.argv[2];
let s = fs.readFileSync("app.json", "utf8");
s = s.replace(/("buildNumber":\s*)"[^"]*"/, `$1"${next}"`);
fs.writeFileSync("app.json", s);
console.log("   app.json buildNumber ->", next);
NODE
VER=$(node -p 'const a=require("./app.json");(a.expo||a).version')
echo "   surum: $VER ($NEXT)   [ASC son: $LATEST]"

echo "▶ [2/6] prebuild (ios, clean)…"
npx expo prebuild --platform ios --clean --no-install

echo "▶ [3/6] pod install…"
( cd ios && pod install )

echo "▶ [4/6] archive (otomatik imzalama, ASC API anahtariyla)…"
rm -rf build/ios
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "build/ios/$SCHEME.xcarchive" \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_PRIVATE_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE=Automatic \
  | tail -30

cat > build/ios/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>destination</key><string>export</string>
</dict></plist>
PLIST

echo "▶ [5/6] IPA export…"
xcodebuild -exportArchive \
  -archivePath "build/ios/$SCHEME.xcarchive" \
  -exportOptionsPlist build/ios/ExportOptions.plist \
  -exportPath build/ios/ipa \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_PRIVATE_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  | tail -20

IPA=$(ls build/ios/ipa/*.ipa 2>/dev/null | head -1)
[ -n "$IPA" ] || { echo "FATAL: IPA uretilmedi." >&2; exit 1; }

# ---- KAPI 2: anahtarlar ve REKLAM KIMLIKLERI pakete girdi mi? ----
# Reklam kontrolu 23 Agu 2026'da eklendi: kurumsal AdMob'a tasinirken asil
# risk, eski (silinmis) birim kimliklerinin pakete kacmasiydi. Eski yayinci
# pakette gorunuyorsa yukleme YAPILMAZ — o build reklamsiz cikardi.
echo "▶ [6/6] gomulu anahtar + reklam kimligi dogrulamasi…"
set +o pipefail
BUNDLE_ENTRY=$(unzip -Z1 "$IPA" | grep -m1 'main.jsbundle' || true)
set -o pipefail
if [ -n "$BUNDLE_ENTRY" ]; then
  unzip -p "$IPA" "$BUNDLE_ENTRY" > /tmp/vogel-ios-verify.bundle 2>/dev/null || true
  PID_HITS=$(grep -ao "$EXPO_PUBLIC_FIREBASE_PROJECT_ID" /tmp/vogel-ios-verify.bundle 2>/dev/null | wc -l | tr -d ' ')
  RC_HITS=$(grep -aoE "appl_[A-Za-z0-9]+" /tmp/vogel-ios-verify.bundle 2>/dev/null | wc -l | tr -d ' ')
  YENI=$(grep -aoE "ca-app-pub-2275998066828824[~/][0-9]+" /tmp/vogel-ios-verify.bundle 2>/dev/null | sort -u | wc -l | tr -d ' ')
  ESKI=$(grep -aoE "ca-app-pub-7904978237837219[~/][0-9]+" /tmp/vogel-ios-verify.bundle 2>/dev/null | sort -u | wc -l | tr -d ' ')
  rm -f /tmp/vogel-ios-verify.bundle
  echo "   Firebase proje kimligi : $PID_HITS"
  echo "   RevenueCat (appl_) key : $RC_HITS"
  echo "   AdMob kurumsal kimlik  : $YENI"
  echo "   AdMob ESKI kimlik      : $ESKI  (0 olmali)"
  if [ "$PID_HITS" -eq 0 ] || [ "$RC_HITS" -eq 0 ]; then
    echo "FATAL: anahtarlar IPA'ya gomulmemis — YUKLEME YAPILMAZ." >&2; exit 1
  fi
  if [ "$ESKI" -ne 0 ]; then
    echo "FATAL: pakette ESKI (silinmis) AdMob kimligi var — YUKLEME YAPILMAZ." >&2; exit 1
  fi
  if [ "$YENI" -eq 0 ]; then
    echo "FATAL: pakette kurumsal AdMob kimligi YOK — YUKLEME YAPILMAZ." >&2; exit 1
  fi
else
  echo "UYARI: main.jsbundle bulunamadi, dogrulama atlandi." >&2
fi

mkdir -p build-output
OUT="build-output/Vogel-${VER}-b${NEXT}.ipa"
cp "$IPA" "$OUT"
echo ""
echo "✅ HAZIR: $OUT"
ls -lh "$OUT"

if [ "$UPLOAD" = "1" ]; then
  echo ""
  echo "▶ App Store Connect'e yukleniyor…"
  xcrun altool --upload-app -f "$OUT" -t ios \
    --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
  echo "✅ Yuklendi — Apple isleme aldiktan sonra TestFlight'ta gorunur."
else
  echo ""
  echo "Yuklemek icin: scripts/build-ios-local.sh --upload"
fi
