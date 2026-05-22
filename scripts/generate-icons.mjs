/**
 * Vogel — Uygulama ikonları üretici
 * Çalıştır: node scripts/generate-icons.mjs
 *
 * Üretilen dosyalar:
 *   assets/images/icon.png              (1024×1024, App Store + iOS)
 *   assets/images/splash-icon.png       (1024×1024, şeffaf, splash ekranı)
 *   assets/images/android-icon-foreground.png  (1024×1024, şeffaf, Android adaptive)
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';

// ─── RENKLER ─────────────────────────────────────────────────────
const BG_DARK    = '#0F172A';
const BG_CARD    = '#1E293B';
const NEON       = '#4ADE80';
const NEON_DIM   = '#22C55E';
const GOLD       = '#FBBF24';
const WHITE      = '#FFFFFF';

// ─── KUŞUN SVG TANIMI ────────────────────────────────────────────
// Kuş: havadan (üstten) bakış açısı. Baş yukarıda, kuyruk aşağıda.
// Koordinat sistemi: 1024×1024, kuş merkezi (512, 500)
//
//         ●  ← baş
//        /|\
//    ←←← | →→→   ← kanatlar
//        \|/
//         ↓  ← kuyruk

// Kuş merkezi orijinal koordinatlarda: (512, 502)
// SVG transform ile istenilen boyut + merkeze getirme
function birdGroup(scale = 1, withGlow = true) {
  // translate(512,512) scale(s) translate(-512,-502)
  // = kuşu (512,502)'den alıp (512,512)'ye taşır, istenilen ölçekte
  const tx = 512 - 512 * scale;
  const ty = 512 - 502 * scale;
  return `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale})">
    ${withGlow ? `
    <!-- Parlama halkası -->
    <circle cx="512" cy="490" r="200" fill="${NEON}" opacity="0.06"/>
    <circle cx="512" cy="490" r="130" fill="${NEON}" opacity="0.04"/>
    ` : ''}

    <!-- === SOL KANAT === -->
    <path d="
      M 490 488
      C 450 468, 355 432, 215 435
      C 178 437, 158 452, 163 472
      C 184 456, 248 453, 372 480
      C 428 494, 480 507, 492 518 Z
    " fill="${NEON}"/>

    <!-- === SAĞ KANAT (ayna) === -->
    <path d="
      M 534 488
      C 574 468, 669 432, 809 435
      C 846 437, 866 452, 861 472
      C 840 456, 776 453, 652 480
      C 596 494, 544 507, 532 518 Z
    " fill="${NEON}"/>

    <!-- === GÖVDE === -->
    <ellipse cx="512" cy="515" rx="38" ry="88" fill="${NEON}"/>

    <!-- === BAŞ === -->
    <circle cx="512" cy="400" r="46" fill="${NEON}"/>

    <!-- === GÖZ === -->
    <circle cx="526" cy="393" r="10" fill="${BG_DARK}" opacity="0.8"/>
    <circle cx="529" cy="390" r="3.5" fill="${WHITE}" opacity="0.5"/>

    <!-- === GAGA === -->
    <path d="M 502 358 L 512 330 L 522 358 Z" fill="${GOLD}" opacity="0.95"/>

    <!-- === KUYRUK TÜYLERİ === -->
    <path d="
      M 493 598
      C 477 620, 460 645, 444 668
      L 476 650 L 512 674 L 548 650 L 580 668
      C 564 645, 547 620, 531 598 Z
    " fill="${NEON}" opacity="0.88"/>

    <!-- === KANAT İÇ ÇİZGİLERİ === -->
    <path d="M 490 488 C 430 472, 320 460, 215 435"
          stroke="${NEON_DIM}" stroke-width="2" fill="none" opacity="0.35"/>
    <path d="M 534 488 C 594 472, 704 460, 809 435"
          stroke="${NEON_DIM}" stroke-width="2" fill="none" opacity="0.35"/>
  </g>`;
}

// ─── APP STORE İKONU (arka plan dahil, alfa YOK) ─────────────────
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="42%" r="65%"
                    gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="${BG_CARD}"/>
      <stop offset="100%" stop-color="${BG_DARK}"/>
    </radialGradient>
  </defs>

  <!-- Arka plan (köşesiz kare — App Store kendisi yuvarlaklaştırır) -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>

  ${birdGroup(1)}
</svg>`;

// ─── SPLASH İKONU (şeffaf arka plan — renk app.json'dan gelir) ───
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024" width="1024" height="1024">
  ${birdGroup(0.55, false)}
</svg>`;

// ─── ANDROID ADAPTIVE ICON FOREGROUND (şeffaf) ───────────────────
// Android yalnızca ortadaki %66'lık alanı gösterir (güvenli bölge)
const androidFgSvg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024" width="1024" height="1024">
  ${birdGroup(0.7, false)}
</svg>`;

// ─── WEB FAVİCON (32×32, arka plan dahil) ────────────────────────
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bgGrad2" cx="50%" cy="42%" r="65%" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="${BG_CARD}"/>
      <stop offset="100%" stop-color="${BG_DARK}"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGrad2)"/>
  ${birdGroup(0.8, false)}
</svg>`;

// ─── ANDROID ADAPTIVE ICON BACKGROUND (düz renk) ─────────────────
// app.json'daki backgroundColor ile eşleşmeli: #E6F4FE (açık mavi)
const ANDROID_BG_COLOR = '#E6F4FE';
const androidBgSvg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${ANDROID_BG_COLOR}"/>
</svg>`;

// ─── ANDROID MONOCHROME (Android 13+ theming) ────────────────────
// Sistem kendi rengini uygular — sadece şekil/alfa önemli (beyaz siluet)
function birdGroupMono(scale = 0.7) {
  const tx = 512 - 512 * scale;
  const ty = 512 - 502 * scale;
  return `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale})">
    <path d="M 490 488 C 450 468, 355 432, 215 435 C 178 437, 158 452, 163 472
             C 184 456, 248 453, 372 480 C 428 494, 480 507, 492 518 Z" fill="white"/>
    <path d="M 534 488 C 574 468, 669 432, 809 435 C 846 437, 866 452, 861 472
             C 840 456, 776 453, 652 480 C 596 494, 544 507, 532 518 Z" fill="white"/>
    <ellipse cx="512" cy="515" rx="38" ry="88" fill="white"/>
    <circle cx="512" cy="400" r="46" fill="white"/>
    <path d="M 502 358 L 512 330 L 522 358 Z" fill="white"/>
    <path d="M 493 598 C 477 620, 460 645, 444 668
             L 476 650 L 512 674 L 548 650 L 580 668
             C 564 645, 547 620, 531 598 Z" fill="white"/>
  </g>`;
}
const androidMonoSvg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024" width="1024" height="1024">
  ${birdGroupMono(0.7)}
</svg>`;

// ─── ÜRETİM ──────────────────────────────────────────────────────
async function generate() {
  mkdirSync('assets/images', { recursive: true });

  console.log('🎨 İkonlar üretiliyor...\n');

  // 1. App Store ikonu — alfa OLMADAN (App Store zorunluluğu)
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .flatten({ background: BG_DARK })   // alfa kanalını kaldır
    .png({ compressionLevel: 9 })
    .toFile('assets/images/icon.png');
  console.log('✓ assets/images/icon.png          (1024×1024, App Store)');

  // 2. Splash ikonu — şeffaf arka plan
  await sharp(Buffer.from(splashSvg))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile('assets/images/splash-icon.png');
  console.log('✓ assets/images/splash-icon.png   (1024×1024, şeffaf)');

  // 3. Android adaptive foreground — şeffaf
  await sharp(Buffer.from(androidFgSvg))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile('assets/images/android-icon-foreground.png');
  console.log('✓ assets/images/android-icon-foreground.png (Android fg)');

  // 4. Android adaptive background — düz renk (#E6F4FE)
  await sharp(Buffer.from(androidBgSvg))
    .resize(1024, 1024)
    .flatten({ background: ANDROID_BG_COLOR })
    .png({ compressionLevel: 9 })
    .toFile('assets/images/android-icon-background.png');
  console.log('✓ assets/images/android-icon-background.png (Android bg)');

  // 5. Android monochrome — Android 13+ theming için beyaz siluet
  await sharp(Buffer.from(androidMonoSvg))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile('assets/images/android-icon-monochrome.png');
  console.log('✓ assets/images/android-icon-monochrome.png (Android mono)');

  // 6. Web favicon — 32×32 PNG
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .flatten({ background: BG_DARK })
    .png({ compressionLevel: 9 })
    .toFile('assets/images/favicon.png');
  console.log('✓ assets/images/favicon.png              (32×32, web)');

  console.log('\n✅ Tüm ikonlar güncellendi!');
  console.log('   Uygulamayı yeniden başlatarak değişiklikleri gör.\n');
}

generate().catch((err) => {
  console.error('❌ İkon üretimi başarısız:', err.message);
  process.exit(1);
});
