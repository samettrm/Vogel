/**
 * MAĞAZA DEĞERLENDİRME (YILDIZ) PENCERESİ — Emir Defteri A5 (Samet, 03-11 · 08-11-2026).
 * Standart: ~/.claude/standards/magaza-degerlendirme.md · referans: Hukuki Sözlük
 * `src/degerlendirme/magazaPuani.ts` (karar mantığı `puanDenetleyici.ts`, aynen).
 *
 * Yalnız mağazanın kendi penceresi (StoreKit / Play In-App Review). Kendi yıldız
 * kutumuz ya da "memnun musunuz?" ön sorusu YOK (review gating, Apple 5.6.1).
 * Tetik: alt menüde her 4. sekme değişimi ya da olumlu an; istek BEKLEYEN olur,
 * kullanıcı ana sekmeye dönünce 1,5 sn sonra yapılır. Olumsuz an bekleyeni siler.
 * Sıklığı mağaza belirler; bizim bekleme süremiz yok. İlk açılışta istenmez.
 *
 * Yerel modül önce denetlenir (ANTI-SİSTEM FAZ 0.5); `.catch(() => {})` yok.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { Linking, Platform } from 'react-native';

import { olay } from '../olay';
import { puanDenetleyici, type OlumluAn } from './puanDenetleyici';

export const MAGAZA_SAYFASI =
  Platform.select({
    ios: 'https://apps.apple.com/app/id6771534635?action=write-review',
    default: 'https://play.google.com/store/apps/details?id=com.busater.vogel',
  }) ?? 'https://play.google.com/store/apps/details?id=com.busater.vogel';

type MagazaModulu = typeof import('expo-store-review');
let magazaModulu: MagazaModulu | null = null;
let modulDenendi = false;

function magaza(): MagazaModulu | null {
  if (modulDenendi) return magazaModulu;
  modulDenendi = true;
  if (!requireOptionalNativeModule('ExpoStoreReview')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- ön denetimden SONRA, sabit adla (KAPI 131).
    magazaModulu = require('expo-store-review') as MagazaModulu;
  } catch (e) {
    console.debug('[puan] mağaza modülü yüklenemedi (istek yapılmaz):', String(e).slice(0, 120));
    magazaModulu = null;
  }
  return magazaModulu;
}

const ACILIS_ANAHTARI = 'vogel.puan.acilis';
let acilisSayisi = 0;

void (async () => {
  try {
    const n = (Number(await AsyncStorage.getItem(ACILIS_ANAHTARI)) || 0) + 1;
    await AsyncStorage.setItem(ACILIS_ANAHTARI, String(n));
    acilisSayisi = n;
  } catch (e) {
    console.debug('[puan] açılış sayılamadı (istek yapılmaz):', String(e).slice(0, 120));
  }
})();

const denetleyici = puanDenetleyici({
  simdi: () => Date.now(),
  kurulum: () => 'kurulum',
  acilisSayisi: () => acilisSayisi,
  pencereVar: async () => {
    const SR = magaza();
    return SR !== null && (await SR.isAvailableAsync());
  },
  pencereIste: async () => {
    const SR = magaza();
    if (SR) await SR.requestReview();
  },
  // Owner panelinde yalnız "istendi" sayılır; mağaza verilen yıldızı bildirmez.
  olay: (tip) => olay(tip),
});

const gunluk = (nerede: string) => (e: unknown) => {
  console.debug(`[puan] ${nerede} (ekran etkilenmez):`, String(e).slice(0, 120));
};

export function olumluAn(an: OlumluAn, anahtar: string): void {
  denetleyici.olumluAn(an, anahtar).catch(gunluk('olumlu an işlenemedi'));
}

export function gezinmeAni(): void {
  try {
    denetleyici.gezinmeAni();
  } catch (e) {
    gunluk('gezinme işlenemedi')(e);
  }
}

export function olumsuzAn(): void {
  denetleyici.olumsuzAn();
}

export function sakinAndaPuanIste(): void {
  denetleyici.sakinAn().catch(gunluk('istek yapılamadı'));
}

/** Menüdeki "Uygulamayı Değerlendir": mağazanın yorum sayfası (sistem penceresi düğmeye bağlanmaz). */
export function magazaSayfasiniAc(): void {
  Linking.openURL(MAGAZA_SAYFASI).catch((e) => console.warn('[puan] mağaza sayfası açılamadı:', String(e).slice(0, 120)));
}
