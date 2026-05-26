import { Platform } from 'react-native';

// ════════════════════════════════════════════════════════════════
// ADMOB YAPILANDIRMASI
//
// Production Ad Unit ID'leri (bsdigitalapp@gmail.com AdMob hesabından).
// Publisher ID: pub-7904978237837219
//
// DEV modunda (__DEV__ true) Google'ın resmi test ad unit ID'leri
// kullanılır → gerçek impressions'a etki etmez, AdMob hesabı askıya
// alınmaz. Production build'inde gerçek ID'lere otomatik geçilir.
// ════════════════════════════════════════════════════════════════

// ─── PRODUCTION — gerçek gelir veren ID'ler ──────────────────────
const PROD_BANNER = Platform.select({
  ios:     'ca-app-pub-7904978237837219/8931774315',
  android: 'ca-app-pub-7904978237837219/3858199581',
}) ?? '';

const PROD_INTERSTITIAL = Platform.select({
  ios:     'ca-app-pub-7904978237837219/1607818064',
  android: 'ca-app-pub-7904978237837219/7637358576',
}) ?? '';

const PROD_REWARDED = Platform.select({
  ios:     'ca-app-pub-7904978237837219/6428522603',
  android: 'ca-app-pub-7904978237837219/2557937657',
}) ?? '';

// ─── TEST — Google'ın resmi test ID'leri (her zaman fill verir) ──
// Kaynak: https://developers.google.com/admob/ios/test-ads
const TEST_BANNER = Platform.select({
  ios:     'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
}) ?? '';

const TEST_INTERSTITIAL = Platform.select({
  ios:     'ca-app-pub-3940256099942544/4411468910',
  android: 'ca-app-pub-3940256099942544/1033173712',
}) ?? '';

const TEST_REWARDED = Platform.select({
  ios:     'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
}) ?? '';

// ─── EXPORT — dev'de test, prod'da gerçek ID'ler ─────────────────
export const AD_UNIT_BANNER       = __DEV__ ? TEST_BANNER       : PROD_BANNER;
export const AD_UNIT_INTERSTITIAL = __DEV__ ? TEST_INTERSTITIAL : PROD_INTERSTITIAL;
export const AD_UNIT_REWARDED     = __DEV__ ? TEST_REWARDED     : PROD_REWARDED;

// ─── Strateji ayarları ───────────────────────────────────────────

/**
 * Ders bittiğinde interstitial gösterme olasılığı (0..1).
 * 0.33 = her 3 dersten 1'inde interstitial gösterilir.
 * Çok agresif olursa kullanıcı uninstall eder; çok az olursa gelir düşer.
 * Duolingo benzeri model: ~1/3 oranı dengeli.
 */
export const INTERSTITIAL_PROBABILITY = 0.33;

/**
 * Aynı kullanıcıya art arda interstitial gösterimi arasında
 * minimum süre (ms). Spam'i önler.
 */
export const INTERSTITIAL_MIN_INTERVAL_MS = 90 * 1000; // 90 saniye

/**
 * Rewarded ad ödülü: kaç can verilir?
 */
export const REWARDED_HEART_REWARD = 1;
