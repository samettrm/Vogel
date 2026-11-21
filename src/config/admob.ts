import { Platform } from 'react-native';

import { birimSec } from './canli-reklam';

// ════════════════════════════════════════════════════════════════
// ADMOB YAPILANDIRMASI
//
// Production Ad Unit ID'leri (bsdigitalapp@gmail.com AdMob hesabından).
// Publisher ID: pub-2275998066828824 — BUSATER YAZILIM A.S. kurumsal AdMob.
// 22 Agu 2026: eski kisisel hesaptan tasindi.
//
// DEV modunda (__DEV__ true) Google'ın resmi test ad unit ID'leri
// kullanılır → gerçek impressions'a etki etmez, AdMob hesabı askıya
// alınmaz. Production build'inde gerçek ID'lere otomatik geçilir.
// ════════════════════════════════════════════════════════════════

// ─── PRODUCTION — gerçek gelir veren ID'ler ──────────────────────
const PROD_BANNER = Platform.select({
  ios:     'ca-app-pub-2275998066828824/8091742384',
  android: 'ca-app-pub-2275998066828824/7481263096',
}) ?? '';

const PROD_INTERSTITIAL = Platform.select({
  ios:     'ca-app-pub-2275998066828824/4719473586',
  android: 'ca-app-pub-2275998066828824/1602250459',
}) ?? '';

// ⚠️ Bu birimler AdMob'da "Ödüllü geçiş reklamı" = RewardedInterstitialAd
// formatında. Kod ads.ts'te RewardedInterstitialAd ile çağırır (RewardedAd ile
// DEĞİL) — yoksa gerçek reklam format uyuşmazlığından no-fill verir.
const PROD_REWARDED = Platform.select({
  ios:     'ca-app-pub-2275998066828824/9516504690',
  android: 'ca-app-pub-2275998066828824/9404824056',
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

// Rewarded INTERSTITIAL test ID'leri (düz rewarded değil — gerçek birimle
// aynı format olsun ki dev'de de doğru sınıfla test edilsin).
const TEST_REWARDED = Platform.select({
  ios:     'ca-app-pub-3940256099942544/6978759866',
  android: 'ca-app-pub-3940256099942544/5354046379',
}) ?? '';

// ─── EXPORT — A13 · 21-11-2026 ───────────────────────────────────
// Canlı birim YALNIZ App Store / Google Play kurulumunda. __DEV__ TestFlight'ı ve elle
// kurulan yayın derlemesini ayıramıyordu; canlı reklam alıyordu (yayıncı hesabı
// 21-11-2026'da kalıcı kapandı). Geliştirme / simülatör / elle kurulum → test birimi;
// TestFlight / App Review → '' (reklam oluşturulmaz). Karar: ./canli-reklam.ts
export const AD_UNIT_BANNER       = birimSec(TEST_BANNER, PROD_BANNER);
export const AD_UNIT_INTERSTITIAL = birimSec(TEST_INTERSTITIAL, PROD_INTERSTITIAL);
export const AD_UNIT_REWARDED     = birimSec(TEST_REWARDED, PROD_REWARDED);

// ─── Strateji ayarları ───────────────────────────────────────────

/**
 * Ders bittiğinde interstitial gösterme olasılığı (0..1).
 * 1.0 = her ders sonunda interstitial gösterilir (Duolingo modeli).
 * Spam'i INTERSTITIAL_MIN_INTERVAL_MS cooldown'u önler: art arda çok hızlı
 * biten derslerde (ör. tekrar oynanan tamamlanmış dersler) reklam tekrar
 * çıkmaz. Premium kullanıcılarda showInterstitialAd zaten no-op yapar.
 * Daha az agresif istenirse bu değer 0.5-0.7 aralığına çekilebilir.
 */
export const INTERSTITIAL_PROBABILITY = 1.0;

/**
 * Aynı kullanıcıya art arda interstitial gösterimi arasında
 * minimum süre (ms). Spam'i önler. 60sn: tipik bir ders ~1-3 dk sürdüğü
 * için normal akışta her dersin reklamını engellemez, sadece çok hızlı
 * art arda bitişlerde araya girer.
 */
export const INTERSTITIAL_MIN_INTERVAL_MS = 60 * 1000; // 60 saniye

/**
 * Rewarded ad ödülü: kaç can verilir?
 */
export const REWARDED_HEART_REWARD = 1;
