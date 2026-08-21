import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Constants from 'expo-constants';
import { firebaseDb, isFirebaseConfigured } from '../config/firebase';
import { useUserStore } from '../store/useUserStore';

// ════════════════════════════════════════════════════════════════
// PRESENCE / CİHAZ SERVİSİ — yönetim paneli beslemesi
//
// Şema: /users/{uid}/devices/{installationId}
//
// ⭐ NEDEN KURULUM BAŞINA DOKÜMAN (kullanıcı başına değil):
//   Panelde "90 kişi / 100 cihaz kurulumu" ayrımı isteniyor. Kullanıcı
//   başına tek satır tutulsaydı bu ayrım imkânsız olurdu. Her kurulum
//   kendi kimliğiyle bir satır açar:
//     • Uygulamayı tekrar tekrar açmak sayıyı ARTIRMAZ — aynı satırın
//       lastSeenAt'i tazelenir.
//     • Silip yeniden kurmak YENİ kurulum sayılır (kimlik AsyncStorage'da
//       tutulur, kaldırınca silinir). Kalorimetre panelindeki davranışın
//       aynısı.
//     • Aynı kişi iki cihazda kullanırsa iki satır olur — istenen budur.
//
// ⚠️ TOPLANAN VERİ (gizlilik politikasında beyan edilmeli):
//   country/language — cihazın BÖLGE ve DİL AYARI (IP veya konum DEĞİL)
//   marka, model, cihaz türü, işletim sistemi sürümü, uygulama sürümü
//   premium durumu, ilk/son görülme zamanı
// Konum izni, IP geolokasyon, reklam kimliği KULLANILMAZ.
//
// Native modüller lazy require (CLAUDE.md §7) — Expo Go'da no-op.
// ════════════════════════════════════════════════════════════════

const INSTALL_ID_KEY = 'vogel.installationId';

let _device: any = null;
let _deviceTried = false;
function getDevice(): any | null {
  if (_deviceTried) return _device;
  _deviceTried = true;
  try { _device = require('expo-device'); } catch { _device = null; }
  return _device;
}

let _loc: any = null;
let _locTried = false;
function getLocalization(): any | null {
  if (_locTried) return _loc;
  _locTried = true;
  try { _loc = require('expo-localization'); } catch { _loc = null; }
  return _loc;
}

/** Kurulum kimliği — ilk açılışta üretilir, kaldırılana kadar sabit kalır. */
let _installIdCache: string | null = null;
async function getInstallationId(): Promise<string> {
  if (_installIdCache) return _installIdCache;
  try {
    const saved = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (saved) {
      _installIdCache = saved;
      return saved;
    }
  } catch {
    // okunamadıysa yenisini üret — kayıt kaybı panelde fazladan bir
    // "kurulum" olarak görünür, uygulamayı bozmaz
  }
  const fresh =
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  _installIdCache = fresh;
  try { await AsyncStorage.setItem(INSTALL_ID_KEY, fresh); } catch { /* yut */ }
  return fresh;
}

/** expo-device DeviceType enum → okunabilir etiket. */
function deviceTypeLabel(t: unknown): string {
  switch (t) {
    case 1: return 'phone';
    case 2: return 'tablet';
    case 3: return 'desktop';
    case 4: return 'tv';
    default: return 'unknown';
  }
}

function readDeviceMeta() {
  const Device = getDevice();
  const Localization = getLocalization();

  let country: string | null = null;
  let language: string | null = null;
  try {
    // getLocales() cihazın dil/bölge AYARINI verir — konum izni gerektirmez.
    const locales = Localization?.getLocales?.();
    if (Array.isArray(locales) && locales.length > 0) {
      country = locales[0]?.regionCode ?? null;
      language = locales[0]?.languageCode ?? null;
    }
  } catch { /* bölge okunamazsa null kalır */ }

  const s = useUserStore.getState();

  return {
    country: country ? String(country).toUpperCase() : null,
    language: language ? String(language).toLowerCase() : null,
    brand: Device?.brand ?? null,
    deviceModel: Device?.modelName ?? null,
    deviceType: deviceTypeLabel(Device?.deviceType),
    os: Platform.OS,
    osVersion: Device?.osVersion ? String(Device.osVersion) : null,
    appVersion: Constants.expoConfig?.version ?? null,
    platform: Platform.OS,
    isPremium: !!s.isPremium,
    activePlanId: s.activePlanId ?? null,
    lastSeenAt: Date.now(),
  };
}

/**
 * Bu kurulumun kaydını yazar / tazeler.
 *
 * firstSeenAt SADECE doküman ilk oluşturulurken yazılır. merge:true
 * gönderilen alanları yine de üzerine yazdığı için her seferinde
 * göndermek "ilk görülme" tarihini bozardı — bu yüzden önce varlık
 * kontrolü yapılıyor. Kontrol oturum başına bir kez sonuçlanır
 * (sonrası önbellekten), maliyeti ihmal edilebilir.
 *
 * Sessizce başarısız olur: panel beslemesi kullanıcı deneyimini bozmamalı.
 */
let _knownExisting = new Set<string>();

export async function recordPresence(uid: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb || !uid) return;
  try {
    const installId = await getInstallationId();
    const key = `${uid}/${installId}`;
    const ref = doc(firebaseDb, 'users', uid, 'devices', installId);
    const meta = readDeviceMeta();

    let isNew = false;
    if (!_knownExisting.has(key)) {
      const snap = await getDoc(ref);
      isNew = !snap.exists();
      _knownExisting.add(key);
    }

    await setDoc(ref, isNew ? { ...meta, firstSeenAt: meta.lastSeenAt } : meta, {
      merge: true,
    });
  } catch (e) {
    if (__DEV__) console.warn('[presence] yazılamadı:', e);
  }
}
