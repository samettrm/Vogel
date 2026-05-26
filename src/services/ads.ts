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

// ─── Rewarded ────────────────────────────────────────────────────

/**
 * Rewarded ad göster.
 *
 * @returns true → kullanıcı reklamı sonuna kadar izledi, ödül kazandı
 *          false → reklam yüklenmedi, kullanıcı atladı veya hata
 *
 * Kullanım örneği (NoHeartsScreen):
 *   const earned = await showRewardedAd();
 *   if (earned) {
 *     useUserStore.getState().addHearts(1);
 *   }
 */
export async function showRewardedAd(): Promise<boolean> {
  const ads = getAdsModule();
  if (!ads?.RewardedAd?.createForAdRequest) return false;

  return new Promise<boolean>((resolve) => {
    let earned = false;
    let resolved = false;
    const finish = (success: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(success);
    };

    try {
      const ad = ads.RewardedAd.createForAdRequest(AD_UNIT_REWARDED, {
        requestNonPersonalizedAdsOnly: false,
      });

      const RewardedAdEventType = ads.RewardedAdEventType ?? {};
      const AdEventType = ads.AdEventType ?? {};

      // Reklam yüklendiğinde göster
      ad.addAdEventListener?.(AdEventType.LOADED ?? 'loaded', () => {
        try { ad.show(); } catch { finish(false); }
      });

      // Ödül kazanıldı
      ad.addAdEventListener?.(RewardedAdEventType.EARNED_REWARD ?? 'rewarded_earned_reward', () => {
        earned = true;
      });

      // Reklam kapandı — ödül durumuna göre dön
      ad.addAdEventListener?.(AdEventType.CLOSED ?? 'closed', () => {
        finish(earned);
      });

      // Hata durumu
      ad.addAdEventListener?.(AdEventType.ERROR ?? 'error', () => {
        finish(false);
      });

      ad.load();

      // Timeout — 15 saniye içinde yüklenmezse iptal et
      setTimeout(() => finish(false), 15000);
    } catch (e) {
      if (__DEV__) console.warn('[Ads] rewarded show failed:', e);
      finish(false);
    }
  });
}
