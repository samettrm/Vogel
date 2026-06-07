// ════════════════════════════════════════════════════════════════
// ADMOB SERVİSİ — Google Mobile Ads + App Tracking Transparency
//
// LAZY REQUIRE pattern (CLAUDE.md §7) — Expo Go'da native modüller
// yok, top-level import crash eder. Tüm modül erişimleri try/catch
// ile sarılı, modül yoksa fonksiyonlar graceful no-op olur.
//
// API:
//   initMobileAds()              → App açılışında bir kez, SDK init
//   requestTrackingPermission()  → iOS 14.5+ ATT prompt göster
//   showInterstitialAd()         → Ders bitiminde çağır (probability'li)
//   showRewardedAd()             → Kullanıcı "Reklam İzle" butonuna
//                                  basınca; ödül kazanırsa true döner
// ════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import {
  AD_UNIT_INTERSTITIAL,
  AD_UNIT_REWARDED,
  INTERSTITIAL_MIN_INTERVAL_MS,
  INTERSTITIAL_PROBABILITY,
} from '../config/admob';

// ─── Lazy module loaders ─────────────────────────────────────────

let _adsModule: any = null;
let _adsLoadAttempted = false;

function getAdsModule(): any | null {
  if (_adsLoadAttempted) return _adsModule;
  _adsLoadAttempted = true;
  try {
    _adsModule = require('react-native-google-mobile-ads');
    return _adsModule;
  } catch {
    return null;
  }
}

let _attModule: any = null;
let _attLoadAttempted = false;

function getAttModule(): any | null {
  if (_attLoadAttempted) return _attModule;
  _attLoadAttempted = true;
  try {
    _attModule = require('expo-tracking-transparency');
    return _attModule;
  } catch {
    return null;
  }
}

// ─── SDK init ─────────────────────────────────────────────────────

let _initialized = false;
let _initPromise: Promise<void> | null = null;

export function initMobileAds(): Promise<void> {
  if (_initialized) return Promise.resolve();
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const ads = getAdsModule();
    if (!ads?.default) return;
    try {
      // Initialize() döner: Promise<AdapterStatus[]>
      await ads.default().initialize();
      _initialized = true;
      if (__DEV__) console.log('[Ads] Mobile Ads SDK initialized');
      // İlk interstitial'ı arka planda hazırla — ders bitince anında gösterilsin
      // (yoksa showInterstitialAd on-demand build edip 3sn'ye kadar bekler).
      // Her gösterimden sonra ads servisi otomatik yeni instance preload eder.
      preloadInterstitial();
    } catch (e) {
      if (__DEV__) console.warn('[Ads] init failed:', e);
    }
  })();

  return _initPromise;
}

// ─── App Tracking Transparency (iOS 14.5+) ───────────────────────

/**
 * ATT prompt'unu göster (iOS'ta). Android'de no-op.
 * Onboarding bitiminde veya app açılışında bir kez çağrılmalı.
 * Kullanıcı izin verirse personalized ads; vermezse contextual ads.
 */
export async function requestTrackingPermission(): Promise<'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable'> {
  if (Platform.OS !== 'ios') return 'unavailable';
  const att = getAttModule();
  if (!att?.requestTrackingPermissionsAsync) return 'unavailable';
  try {
    const { status } = await att.requestTrackingPermissionsAsync();
    if (__DEV__) console.log('[Ads] ATT status:', status);
    return status as any;
  } catch {
    return 'unavailable';
  }
}

// ─── Interstitial ────────────────────────────────────────────────

let _lastInterstitialShownAt = 0;
let _preloadedInterstitial: any = null;

function buildInterstitial(): any | null {
  const ads = getAdsModule();
  if (!ads?.InterstitialAd?.createForAdRequest) return null;
  try {
    const ad = ads.InterstitialAd.createForAdRequest(AD_UNIT_INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });
    ad.load();
    return ad;
  } catch {
    return null;
  }
}

/**
 * Bir sonraki gösterim için interstitial'ı arka planda preload et.
 * Init sırasında çağırılır — kullanıcı dersi bitirdiğinde reklam hazır.
 */
export function preloadInterstitial(): void {
  if (_preloadedInterstitial) return;
  _preloadedInterstitial = buildInterstitial();
}

/**
 * Interstitial göster.
 * - Probability'ye göre olasılıksal gösterim
 * - Min interval ile spam'i önle
 * - Premium kullanıcılarda no-op (caller premium check yapmalı, bu defansif)
 *
 * @param force true ise probability + interval kuralları atlanır (test için)
 */
export async function showInterstitialAd(force = false): Promise<void> {
  if (!force) {
    // Olasılık kontrolü
    if (Math.random() >= INTERSTITIAL_PROBABILITY) return;
    // Spam koruması
    const elapsed = Date.now() - _lastInterstitialShownAt;
    if (elapsed < INTERSTITIAL_MIN_INTERVAL_MS) return;
  }

  const ads = getAdsModule();
  if (!ads?.InterstitialAd) return;

  // Preloaded varsa onu kullan, yoksa hızlı build et
  let ad = _preloadedInterstitial;
  if (!ad) ad = buildInterstitial();
  if (!ad) return;

  // Eğer henüz load olmadıysa biraz bekle (max 3sn), sonra göster
  const isLoaded = ad.loaded ?? false;
  if (!isLoaded) {
    await new Promise<void>((resolve) => {
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        resolve();
      };
      try {
        ad.addAdEventListener?.(ads.AdEventType?.LOADED ?? 'loaded', finish);
        ad.addAdEventListener?.(ads.AdEventType?.ERROR ?? 'error', finish);
      } catch {
        finish();
      }
      // Timeout 3sn — load gelmezse vazgeç
      setTimeout(finish, 3000);
    });
  }

  try {
    if (ad.loaded === false) {
      // Hala yüklenmediyse vazgeç
      _preloadedInterstitial = null;
      return;
    }
    ad.show();
    _lastInterstitialShownAt = Date.now();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] interstitial show failed:', e);
  }

  // Bir sonraki gösterim için yeni instance preload et
  _preloadedInterstitial = buildInterstitial();
}

// ─── Rewarded Interstitial (ödüllü reklam — preload'lu, anında gösterim) ──────
//
// ⚠️ ÇOK ÖNEMLİ: AdMob'daki ödüllü birimler "Ödüllü geçiş reklamı" =
// RewardedInterstitialAd formatında. Bu yüzden RewardedAd DEĞİL,
// RewardedInterstitialAd kullanılır. Yanlış sınıf (RewardedAd) ile çağrılırsa
// gerçek reklamlar FORMAT UYUŞMAZLIĞINDAN no-fill verir — test reklamı düz
// rewarded formatına uyduğu için çalışır ama gerçek reklam çalışmaz. Lexora'da
// kanıtlı pattern (lib/ads.ts → RewardedInterstitialAd).
//
// GECIKME FIX'i: reklam tap anında değil, NoHeartsScreen açılınca arka planda
// preload edilir → tap anında hazır reklam ANINDA gösterilir.

let _preloadedRewarded: any = null;
let _rewardedReady = false;
let _rewardedLoading = false;

/**
 * Ödüllü reklamı arka planda önceden yükle, hazır tut. Idempotent —
 * zaten hazır/yükleniyorsa no-op. NoHeartsScreen açılınca çağrılır.
 */
export function preloadRewardedAd(): void {
  const ads = getAdsModule();
  if (!ads?.RewardedInterstitialAd?.createForAdRequest) return;
  if (_rewardedReady || _rewardedLoading) return;
  _rewardedLoading = true;
  try {
    const ad = ads.RewardedInterstitialAd.createForAdRequest(AD_UNIT_REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });
    const RewardedAdEventType = ads.RewardedAdEventType ?? {};
    const AdEventType = ads.AdEventType ?? {};
    ad.addAdEventListener?.(RewardedAdEventType.LOADED ?? 'rewarded_loaded', () => {
      _preloadedRewarded = ad;
      _rewardedReady = true;
      _rewardedLoading = false;
    });
    ad.addAdEventListener?.(AdEventType.ERROR ?? 'error', () => {
      _preloadedRewarded = null;
      _rewardedReady = false;
      _rewardedLoading = false;
    });
    ad.load();
  } catch {
    _rewardedLoading = false;
  }
}

/** Hazır (preload edilmiş) bir ödüllü reklam var mı? */
export function isRewardedReady(): boolean {
  return _rewardedReady && _preloadedRewarded != null;
}

/**
 * Rewarded ad göster (RewardedInterstitialAd).
 *
 * @returns true → kullanıcı reklamı izledi/ödül kazandı, false → reklam yok/hata
 *
 * Kullanım (NoHeartsScreen):
 *   const earned = await showRewardedAd();
 *   if (earned) useUserStore.getState().addHearts(1);
 */
export async function showRewardedAd(): Promise<boolean> {
  const ads = getAdsModule();
  if (!ads?.RewardedInterstitialAd?.createForAdRequest) return false;

  const RewardedAdEventType = ads.RewardedAdEventType ?? {};
  const AdEventType = ads.AdEventType ?? {};

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    const clearLoadTimer = () => { if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; } };
    const settle = (earned: boolean) => {
      if (settled) return;
      settled = true;
      clearLoadTimer();
      // Gösterilen instance tüketildi — temizle ve bir sonrakini preload et.
      _preloadedRewarded = null;
      _rewardedReady = false;
      preloadRewardedAd();
      resolve(earned);
    };

    const wireAndShow = (ad: any) => {
      // Reklam gösterilmeye başlandı → LOAD timeout'unu İPTAL et. Yoksa 15sn'den
      // uzun reklamlarda kullanıcı izlerken settle(false) tetiklenir ve ilk
      // reklam kalp vermez ("Reklam bulunamadı" çıkar) — o bug bundandı.
      clearLoadTimer();
      let earned = false;
      let opened = false;
      ad.addAdEventListener?.(AdEventType.OPENED ?? 'opened', () => { opened = true; });
      ad.addAdEventListener?.(RewardedAdEventType.EARNED_REWARD ?? 'rewarded_earned_reward', () => { earned = true; });
      ad.addAdEventListener?.(AdEventType.CLOSED ?? 'closed', () => {
        // EARNED_REWARD bazı cihazlarda/yeni birimlerde kaçabiliyor; reklam
        // gerçekten açıldıysa (opened) ödülü yine de ver (Lexora fix). Kalp
        // refill/limit mantığı suistimali zaten sınırlar.
        settle(earned || opened);
      });
      ad.addAdEventListener?.(AdEventType.ERROR ?? 'error', () => { settle(false); });
      try { ad.show(); } catch { settle(false); }
    };

    // Hazır preload varsa ANINDA göster
    if (_rewardedReady && _preloadedRewarded) {
      wireAndShow(_preloadedRewarded);
      return;
    }

    // Soğuk yol — preload yoksa yükle sonra göster (ilk açılış)
    try {
      const ad = ads.RewardedInterstitialAd.createForAdRequest(AD_UNIT_REWARDED, {
        requestNonPersonalizedAdsOnly: false,
      });
      ad.addAdEventListener?.(RewardedAdEventType.LOADED ?? 'rewarded_loaded', () => {
        wireAndShow(ad);
      });
      ad.addAdEventListener?.(AdEventType.ERROR ?? 'error', () => { settle(false); });
      ad.load();
      // Sadece YÜKLEME beklemesi için timeout: 15sn'de ad yüklenmezse vazgeç.
      // Reklam gösterilmeye başlayınca wireAndShow bu timer'ı iptal eder, böylece
      // uzun reklam izlenirken erken settle(false) OLMAZ.
      loadTimer = setTimeout(() => settle(false), 15000);
    } catch (e) {
      if (__DEV__) console.warn('[Ads] rewarded show failed:', e);
      settle(false);
    }
  });
}
