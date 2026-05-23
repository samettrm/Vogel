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

// ─── KUŞUN SVG TANIMI — YAN PROFİL ───────────────────────────────
// Kuş: yandan profil, sola bakıyor. Modern flat songbird silueti.
// Koordinat sistemi: 1024×1024 viewBox
//
//   ◀── gaga    ┌──── baş ────┐
//                │   • göz     │
//                │             └──── gövde ───┐
//                                              └── kuyruk ◢
//
// Kuş ortalanmış, viewport'un ~%75'ini kaplar.
// Halkalar/glow KALDIRILDI — kuş tek başına büyük ve net dursun.

function birdGroup(scale = 1, _withGlow = false) {
  // SERÇE/SONGBIRD silueti — narın gövde, kuyruk yukarı kalkık.
  // Görsel merkez: yaklaşık (515, 430)
  const tx = 512 - 515 * scale;
  const ty = 512 - 430 * scale;
  return `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale})">

    <!-- === GÖVDE + KUYRUK (tek silüet, narın, kuyruk yukarı kalkık) === -->
    <path d="
      M 290 510
      C 250 460, 260 380, 340 360
      C 430 340, 540 350, 620 400
      C 680 415, 740 395, 800 360
      L 855 410
      L 815 425
      L 845 475
      L 770 460
      C 710 480, 620 520, 530 535
      C 430 555, 340 555, 290 510 Z
    " fill="${NEON}"/>

    <!-- === BAŞ (gövdenin sol-üstüne overlap, dengeli boyut) === -->
    <circle cx="350" cy="345" r="100" fill="${NEON}"/>

    <!-- === GAGA (sola çıkan ince altın üçgen) === -->
    <path d="M 250 338 L 165 355 L 250 372 Z" fill="${GOLD}"/>

    <!-- === GÖZ (kontrast koyu + parlama) === -->
    <circle cx="325" cy="320" r="22" fill="${BG_DARK}"/>
    <circle cx="334" cy="312" r="8" fill="${WHITE}"/>

    <!-- === KANAT DETAYI (yan yüzeyde katlanmış kanat) === -->
    <path d="
      M 410 440
      C 490 415, 600 425, 690 460
      C 620 485, 530 490, 450 475
      C 425 466, 410 455, 410 440 Z
    " fill="${NEON_DIM}" opacity="0.7"/>

    <!-- === KANAT İÇ TÜY ÇİZGİSİ === -->
    <path d="M 440 460 C 520 445, 600 455, 670 475"
          stroke="${NEON_DIM}" stroke-width="3" fill="none" opacity="0.5"/>
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
  const tx = 512 - 515 * scale;
  const ty = 512 - 430 * scale;
  return `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale})">
    <!-- Gövde + kuyruk + baş + gaga — hepsi beyaz silüet -->
    <path d="
      M 290 510
      C 250 460, 260 380, 340 360
      C 430 340, 540 350, 620 400
      C 680 415, 740 395, 800 360
      L 855 410 L 815 425 L 845 475 L 770 460
      C 710 480, 620 520, 530 535
      C 430 555, 340 555, 290 510 Z
    " fill="white"/>
    <circle cx="350" cy="345" r="100" fill="white"/>
    <path d="M 250 338 L 165 355 L 250 372 Z" fill="white"/>
    <!-- Monochrome'da göz detayı atlanır, sistem tek-renk uygular -->
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
