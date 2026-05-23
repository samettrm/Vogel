// ════════════════════════════════════════════════════════════════
// Vogel: Language Lessons — Production Icon Generator
// ════════════════════════════════════════════════════════════════
// Requires: pngjs (already in node_modules)
// Usage:    node scripts/generate-icons.js
// Output:   assets/images/{icon,splash-icon,android-icon-*,favicon}.png

'use strict';
const { PNG } = require('pngjs');
const fs   = require('fs');
const path = require('path');

// ─── Palette ────────────────────────────────────────────────────
const BG    = [11,  16,  32 ];   // #0B1020
const BG2   = [18,  26,  46 ];   // #121A2E
const NEON  = [0,   255, 136];   // #00FF88
const NDIM  = [0,   160, 85 ];   // dim neon (inner shadow)
const WHITE = [255, 255, 255];

// ─── Math helpers ───────────────────────────────────────────────
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * clamp(t, 0, 1);

function mix(base, over, a) {
  return [lerp(base[0], over[0], a), lerp(base[1], over[1], a), lerp(base[2], over[2], a)];
}

function ss(e0, e1, x) {           // smoothstep
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function dist(px, py, cx, cy) { return Math.sqrt((px-cx)**2 + (py-cy)**2); }
function sdfCircle(px, py, cx, cy, r) { return dist(px, py, cx, cy) - r; }

// Smooth minimum (for combining SDFs)
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// Is point inside beak triangle (pointing right)?
// base at x=baseX (left side), tip at x=tipX (right)
function inBeak(px, py, baseX, tipX, midY, halfH) {
  if (px < baseX || px > tipX) return false;
  const t = (px - baseX) / (tipX - baseX);
  const half = lerp(halfH, 0, t);
  return py >= midY - half && py <= midY + half;
}

// ─── Core drawing function ────────────────────────────────────────
// Returns [r,g,b,a] for each pixel. All coords normalised to 1024 space.
function drawPixel(nx, ny, foregroundMode = false) {
  const CX = 512, CY = 512;
  const dc = dist(nx, ny, CX, CY);

  // ── Background ──
  let col = foregroundMode
    ? [0, 0, 0]
    : mix(BG, BG2, ss(0, 900, dc) * 0.55);
  let alpha = foregroundMode ? 0 : 255;

  // ── Platform glow circle ──
  const platR   = 310;
  const platSDF = sdfCircle(nx, ny, CX, CY, platR);

  if (foregroundMode) {
    // For Android foreground, draw within platform circle only
    if (platSDF > 20) return [0, 0, 0, 0];
    alpha = Math.round(255 * ss(20, 0, platSDF));
    col = [...BG];
  }

  // Ambient inner glow (fills platform interior)
  const ambientGlow = ss(platR * 0.9, 0, dc) * 0.18;
  col = mix(col, NEON, ambientGlow);

  // ── Outer neon ring ──
  const ringR   = platR;
  const ringW   = 16;
  const ringDist = Math.abs(dc - ringR);

  // Soft outer halo (wider, dimmer)
  const halo = ss(ringW * 4, 0, ringDist) * 0.5;
  col = mix(col, NEON, halo * 0.4);

  // Bright ring core
  const ringCore = ss(ringW, 0, ringDist);
  col = mix(col, [200, 255, 228], ringCore * 0.9);

  // Extra inner glow bloom
  const bloom = ss(ringW * 2.5, 0, ringDist) * 0.65;
  col = mix(col, NEON, bloom * 0.45);

  // ── Bird head (SDF circle) ──
  // Offset slightly left so beak stays centred
  const HX = 488, HY = 492, HR = 158;
  const headSDF = sdfCircle(nx, ny, HX, HY, HR);

  // ── Bird beak (pointing right) ──
  // base at x=HX+HR-14 (overlaps head by 14px), tip at x=HX+HR+76
  const beakBaseX = HX + HR - 14;   // 632
  const beakTipX  = HX + HR + 76;   // 722
  const inBeakPx  = inBeak(nx, ny, beakBaseX, beakTipX, HY, 48);

  // ── Eye (negative space inside head) ──
  const EX = HX + 62, EY = HY - 44, ER = 27;
  const eyeSDF  = sdfCircle(nx, ny, EX, EY, ER);
  const inEyePx = eyeSDF < 0;

  // ── Combined bird SDF ──
  const birdInside = (headSDF < 0 || inBeakPx) && !inEyePx;

  if (birdInside) {
    // Dark bird body — slight blue-navy tint, not pure black
    const darkBody = [8, 13, 26];

    // Inner rim illumination (edge near ring glows subtly)
    const rimGlow = ss(-HR * 0.5, 0, headSDF); // 0 at centre, 1 near edge
    let birdCol = mix(darkBody, NDIM, rimGlow * 0.35);

    // Specular highlight (upper-left arc — 3D effect)
    const specDist = dist(nx, ny, HX - HR * 0.32, HY - HR * 0.35);
    const spec = ss(HR * 0.52, HR * 0.22, specDist) * 0.22;
    birdCol = mix(birdCol, [180, 255, 215], spec);

    col   = birdCol;
    alpha = 255;
  } else if (inEyePx) {
    // Eye — neon green iris
    const iris = ss(0, -ER, eyeSDF);
    let eyeCol = mix([5, 20, 15], NEON, iris * 0.9);

    // White catchlight (top-left of eye)
    if (dist(nx, ny, EX - 9, EY - 9, ) < 8) {
      eyeCol = mix(eyeCol, WHITE, 0.88);
    }

    col   = eyeCol;
    alpha = 255;
  } else if (!birdInside) {
    // Neon aura immediately outside the bird (tight glow)
    if (headSDF > 0 && headSDF < 52 && platSDF < 0) {
      const aura = ss(52, 4, headSDF) * 0.55;
      col = mix(col, NEON, aura);
      if (!foregroundMode) alpha = 255;
    }
  }

  return [
    Math.round(clamp(col[0], 0, 255)),
    Math.round(clamp(col[1], 0, 255)),
    Math.round(clamp(col[2], 0, 255)),
    foregroundMode ? Math.round(clamp(alpha, 0, 255)) : 255,
  ];
}

// ─── Renderers ───────────────────────────────────────────────────
function renderImage(size, pixelFn) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  const S = size / 1024;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const [r, g, b, a] = pixelFn(x / S, y / S);
      png.data[idx]     = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

// Favicon: simpler design at small sizes
function renderFavicon(size) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  const S = size / 1024;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / S, ny = y / S;
      const CX = 512, CY = 512;
      const dc = dist(nx, ny, CX, CY);

      let col = mix(BG, BG2, ss(0, 800, dc) * 0.4);

      // Glow ring
      const ringDist = Math.abs(dc - 310);
      col = mix(col, NEON, ss(90, 0, ringDist) * 0.6);
      col = mix(col, WHITE, ss(22, 0, ringDist) * 0.85);

      // Simplified bird head (just dark circle inside ring)
      const headSDF = sdfCircle(nx, ny, 488, 492, 158);
      if (headSDF < 0) col = [8, 13, 26];

      // Eye dot
      if (sdfCircle(nx, ny, 550, 448, 27) < 0) {
        col = mix([5, 20, 15], NEON, 0.85);
      }

      png.data[idx]     = Math.round(clamp(col[0], 0, 255));
      png.data[idx + 1] = Math.round(clamp(col[1], 0, 255));
      png.data[idx + 2] = Math.round(clamp(col[2], 0, 255));
      png.data[idx + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

// Android monochrome: white bird on transparent background
function renderMonochrome(size) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  const S = size / 1024;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / S, ny = y / S;

      const HX = 488, HY = 492, HR = 158;
      const headSDF = sdfCircle(nx, ny, HX, HY, HR);
      const inH = headSDF < 0;
      const inB = inBeak(nx, ny, HX + HR - 14, HX + HR + 76, HY, 48);
      const inE = sdfCircle(nx, ny, HX + 62, HY - 44, 27) < 0;
      const isBird = (inH || inB) && !inE;

      if (isBird) {
        png.data[idx] = 255; png.data[idx+1] = 255;
        png.data[idx+2] = 255; png.data[idx+3] = 255;
      } else if (inE) {
        png.data[idx] = 0; png.data[idx+1] = 0;
        png.data[idx+2] = 0; png.data[idx+3] = 255;
      } else {
        png.data[idx] = 0; png.data[idx+1] = 0;
        png.data[idx+2] = 0; png.data[idx+3] = 0;
      }
    }
  }

  return PNG.sync.write(png);
}

// Android background: solid #0B1020
function renderSolidBg(size) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  for (let i = 0; i < size * size * 4; i += 4) {
    png.data[i]   = BG[0];
    png.data[i+1] = BG[1];
    png.data[i+2] = BG[2];
    png.data[i+3] = 255;
  }
  return PNG.sync.write(png);
}

// ─── Run ─────────────────────────────────────────────────────────
const OUT = path.join(__dirname, '..', 'assets', 'images');
const t0  = Date.now();
console.log('🎨  Generating Vogel icons...\n');

function save(name, buf) {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, buf);
  const kb = Math.round(buf.length / 1024);
  console.log(`  ✅  ${name.padEnd(40)} ${kb} KB`);
}

// iOS icon — full design, opaque
save('icon.png',
  renderImage(1024, (nx, ny) => drawPixel(nx, ny, false)));

// Splash — same design, centered on dark bg (will be shown with contain)
save('splash-icon.png',
  renderImage(1024, (nx, ny) => drawPixel(nx, ny, false)));

// Android adaptive foreground — transparent background
save('android-icon-foreground.png',
  renderImage(1024, (nx, ny) => drawPixel(nx, ny, true)));

// Android adaptive background — solid dark
save('android-icon-background.png', renderSolidBg(1024));

// Android monochrome — white bird on transparent
save('android-icon-monochrome.png', renderMonochrome(1024));

// Favicon — 48×48, simplified
save('favicon.png', renderFavicon(48));

console.log(`\n🚀  Done in ${Date.now() - t0}ms`);
console.log('\n   Next: eas build --platform ios --profile production');
