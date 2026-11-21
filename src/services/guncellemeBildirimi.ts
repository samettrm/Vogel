/**
 * GÜNCELLEME BİLDİRİMİ — istemci (Emir Defteri A2 · ~/.claude/standards/guncelleme-bildirimi.md · 21-11-2026).
 * Canlı Döviz lib/guncelleme-bildirimi.ts uyarlaması. Sunucu: server/analitik (/guncelleme/kayit · /guncelleme/tetik).
 *
 * Açılışta ve öne gelişte (en çok 6 saatte bir), bildirim izni ZATEN verilmişse bu cihazın Expo push jetonu
 * sürümüyle birlikte sunucuya yazılır. İzin bu özellik için İSTENMEZ (uygulamanın kendi hatırlatma akışı izni ister).
 * Yeni sürüm mağazada göründüğünde sunucu eski sürümdeki her cihaza TEK bildirim gönderir:
 *   "Yeni bir güncelleme var. Güncellemek için tıklayınız." → dokununca mağaza sayfası.
 *
 * Yalnız App Store / Google Play kurulumları kaydolur (TestFlight ve elle kurulan derleme mağaza sürümüyle
 * karşılaştırılamaz). expo-notifications yalnız bu durumda yüklenir: modül yüklendiği an jeton kaydı denediği için
 * Vogel onu tembel yükler (src/utils/notifications.ts).
 */
import { AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { kurulumOrtami } from '../config/canli-reklam';
import { ANALITIK_SUNUCU } from './olay';

const KANAL = 'guncelleme';
const KAYIT_ARALIGI_MS = 6 * 60 * 60_000;
const JETON_ZAMAN_ASIMI_MS = 10_000;
const INSTALL_ID_KEY = 'vogel.installationId'; // presence.ts / olay.ts ile aynı kurulum kimliği
let sonKayit = 0;

function magazaKurulumuMu(): boolean {
  const o = kurulumOrtami();
  return Platform.OS === 'ios' ? o === 'appstore' : o === 'play';
}

function bildirimModulu(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch (e) {
    console.warn('[guncelleme-bildirimi] bildirim modülü yüklenemedi:', String(e).slice(0, 120));
    return null;
  }
}

/** Bildirim verisi bizim güncelleme bildirimimiz mi; öyleyse açılacak mağaza adresi. */
export function guncellemeAdresi(veri: unknown): string | null {
  if (!veri || typeof veri !== 'object') return null;
  const v = veri as { type?: unknown; url?: unknown };
  if (v.type !== 'app_update' || typeof v.url !== 'string') return null;
  return /^(itms-apps|market|https):\/\//.test(v.url) ? v.url : null;
}

function ac(veri: unknown): void {
  const url = guncellemeAdresi(veri);
  if (!url) return;
  Linking.openURL(url).catch((e) => console.warn('[guncelleme-bildirimi] mağaza açılamadı:', String(e).slice(0, 120)));
}

async function kaydet(N: any): Promise<void> {
  if (Date.now() - sonKayit < KAYIT_ARALIGI_MS) return;
  try {
    const izin = await N.getPermissionsAsync();
    if (izin?.status !== 'granted') return;
    const kurulum = await AsyncStorage.getItem(INSTALL_ID_KEY);
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!kurulum || !projectId) return;
    const sonuc: any = await Promise.race([
      N.getExpoPushTokenAsync({ projectId }),
      new Promise((_, ret) => setTimeout(() => ret(new Error('zaman_asimi')), JETON_ZAMAN_ASIMI_MS)),
    ]);
    if (typeof sonuc?.data !== 'string') return;
    const r = await fetch(`${ANALITIK_SUNUCU}/guncelleme/kayit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kurulum,
        token: sonuc.data,
        platform: Platform.OS,
        surum: Application.nativeApplicationVersion,
        derleme: Application.nativeBuildVersion,
        dil: Localization.getLocales()[0]?.languageTag ?? null,
      }),
    });
    if (r.ok) sonKayit = Date.now();
    else console.warn('[guncelleme-bildirimi] sunucu reddetti:', r.status);
  } catch (e) {
    console.warn('[guncelleme-bildirimi] kayıt yapılamadı:', String(e).slice(0, 120));
  }
}

/** Kök düzenden BİR KEZ çağrılır. Geri dönen işlev dinleyicileri kaldırır. */
export function guncellemeBildirimiBaslat(): () => void {
  if (!magazaKurulumuMu()) return () => undefined;
  const N = bildirimModulu();
  if (!N) return () => undefined;

  if (Platform.OS === 'android') {
    N.setNotificationChannelAsync?.(KANAL, { name: 'Güncellemeler', importance: N.AndroidImportance?.DEFAULT })
      .catch((e: unknown) => console.debug('[guncelleme-bildirimi] kanal:', String(e).slice(0, 120)));
  }
  // Uygulama KAPALIYKEN dokunulan bildirim: açılışta son yanıt okunur.
  N.getLastNotificationResponseAsync?.()
    .then((y: any) => ac(y?.notification?.request?.content?.data))
    .catch((e: unknown) => console.debug('[guncelleme-bildirimi] son yanıt:', String(e).slice(0, 120)));
  const dokunus = N.addNotificationResponseReceivedListener?.((y: any) => ac(y?.notification?.request?.content?.data));

  void kaydet(N);
  const on = AppState.addEventListener('change', (s) => {
    if (s === 'active') void kaydet(N);
  });
  return () => {
    dokunus?.remove?.();
    on.remove();
  };
}
