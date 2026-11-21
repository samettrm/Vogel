/**
 * ÜRÜN ANALİTİĞİ — Owner Control Center §7 (Emir Defteri A4 · BUILD AL 21-11-2026).
 * Canlı Döviz `lib/analytics/olay.ts` uyarlaması. Sunucu: server/analitik (Cloudflare Worker + D1).
 *
 * Tasarım kuralları:
 *   · ASENKRON ve TOPLU: hiçbir çağrı beklenmez; olaylar kuyruğa girer, 3 sn'de bir ya da 20 birikince tek istekte gider.
 *   · HATA SESSİZCE YUTULMAZ: gönderilemeyen olay sayılır (`kayipOlaySayisi`), panelin Veri Sağlığı bölümü gösterir.
 *   · TRAFİK SINIFINI ve OWNER olup olmadığını istemci SÖYLEMEZ; ikisi de sunucuda belirlenir.
 *   · PII YOK: ad, e-posta, kullanıcının yazdığı metin, ses kaydı gönderilmez. `ek` yalnız kategorik alan taşır.
 *   · Giriş yapılmışsa Firebase belirteci eklenir: kişi = UID (RevenueCat de UID kullanır → gelir doğru kişiye bağlanır).
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';

import { firebaseAuth } from '../config/firebase';
import { kurulumOrtami } from '../config/canli-reklam';

export const ANALITIK_SUNUCU = 'https://vogel-analitik.eczapharm-busater.workers.dev';

export type Olay =
  | 'app.first_open'
  | 'session.started'
  | 'auth.signup_completed'
  | 'auth.login_completed'
  | 'onboarding.completed'
  | 'lesson.started'
  | 'lesson.completed'
  | 'value.activated'
  | 'feature.review.used'
  | 'feature.flashcards.used'
  | 'feature.exam.started'
  | 'feature.speaking.used'
  | 'feature.leaderboard.viewed'
  | 'feature.family.opened'
  | 'paywall.viewed'
  | 'paywall.plan_selected'
  | 'purchase.started'
  | 'purchase.cancelled'
  | 'purchase.failed'
  | 'purchase.completed'
  | 'purchase.restored'
  | 'review.eligible'
  | 'review.request_attempted'
  | 'app.crash';

const INSTALL_ID_KEY = 'vogel.installationId'; // presence.ts ile AYNI anahtar: tek kurulum kimliği
const OTURUM = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const GONDERIM_ARALIGI_MS = 3000;
const KUYRUK_ESIGI = 20;
const KUYRUK_TAVANI = 200;

let kuyruk: Record<string, unknown>[] = [];
let zamanlayici: ReturnType<typeof setTimeout> | null = null;
let kayipOlay = 0;
let kurulumOnbellek: string | null = null;

/** Gönderilemeyen olay sayısı — panelin Veri Sağlığı bölümü bunu okur. */
export function kayipOlaySayisi(): number {
  return kayipOlay;
}

/** Sunucunun anladığı çalışma ortamı. TestFlight, simülatör ve geliştirme gerçek kullanıcı sayılmaz. */
export function calismaOrtami(): string {
  const o = kurulumOrtami();
  if (o === 'appstore' || o === 'play') return 'production';
  if (o === 'testflight') return 'testflight';
  if (o === 'simulator' || o === 'emulator') return 'simulator';
  if (o === 'gelistirme' || o === 'xcode' || o === 'diger') return 'development';
  return 'unknown';
}

async function kurulumKimligi(): Promise<string | null> {
  if (kurulumOnbellek) return kurulumOnbellek;
  try {
    const kayitli = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (kayitli) {
      kurulumOnbellek = kayitli;
      return kayitli;
    }
    const yeni = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(INSTALL_ID_KEY, yeni);
    kurulumOnbellek = yeni;
    return yeni;
  } catch (e) {
    console.debug('[olay] kurulum kimliği okunamadı:', String(e).slice(0, 120));
    return null;
  }
}

async function oturumBelirteci(): Promise<string | null> {
  try {
    const u = firebaseAuth?.currentUser;
    if (!u || u.isAnonymous) return null;
    return await u.getIdToken();
  } catch (e) {
    console.debug('[olay] oturum belirteci alınamadı:', String(e).slice(0, 120));
    return null;
  }
}

async function bosalt(): Promise<void> {
  if (kuyruk.length === 0) return;
  const gonderilecek = kuyruk;
  kuyruk = [];
  try {
    const belirtec = await oturumBelirteci();
    const res = await fetch(`${ANALITIK_SUNUCU}/olay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(belirtec ? { Authorization: `Bearer ${belirtec}` } : {}) },
      body: JSON.stringify({ olaylar: gonderilecek }),
    });
    if (!res.ok) kayipOlay += gonderilecek.length;
  } catch {
    // Analitik düşerse uygulama çalışmaya devam eder; kayıp sayılır (Veri Sağlığı), gizlenmez.
    kayipOlay += gonderilecek.length;
  }
}

function planla(): void {
  if (zamanlayici) return;
  zamanlayici = setTimeout(() => {
    zamanlayici = null;
    void bosalt();
  }, GONDERIM_ARALIGI_MS);
}

/**
 * Olay kuyruğa alınır. **Beklenmez.**
 * @param tekil Kişi başına bir kez sayılacak olaylarda benzersiz anahtar; ikinci yazımı sunucu düşürür.
 */
export function olay(ad: Olay, ek?: Record<string, string | number | boolean | null>, tekil?: string): void {
  void (async () => {
    try {
      const inst = await kurulumKimligi();
      if (!inst) return;
      if (kuyruk.length >= KUYRUK_TAVANI) {
        kayipOlay += 1;
        return;
      }
      kuyruk.push({
        ad,
        installation_id: inst,
        session_id: OTURUM,
        calisma_ortami: calismaOrtami(),
        platform: Platform.OS,
        // Ülke CİHAZIN BÖLGE AYARINDAN gelir; konum değildir.
        ulke: Localization.getLocales()[0]?.regionCode ?? null,
        uygulama_surumu: Constants.expoConfig?.version ?? null,
        os_surumu: String(Platform.Version),
        cihaz_ailesi: Platform.OS === 'ios' ? (Platform.isPad ? 'iPad' : 'iPhone') : 'Android',
        idempotency_key: tekil ?? null,
        ek: ek ?? null,
      });
      if (kuyruk.length >= KUYRUK_ESIGI) void bosalt();
      else planla();
    } catch {
      kayipOlay += 1;
    }
  })();
}

/** İlk açılış — kurulum başına bir kez (tekilliği sunucu uygular). Oturum başlangıcı — açılış başına bir kez. */
export async function acilisOlaylari(): Promise<void> {
  const inst = await kurulumKimligi();
  if (!inst) return;
  olay('app.first_open', undefined, `first_open:${inst}`);
  olay('session.started', undefined, `session:${OTURUM}`);
}

/** Uygulama arka plana giderken kuyruğu boşalt. */
export function analitikBosalt(): void {
  void bosalt();
}

/** Özellik ekranı açıldığında bir kez (owner paneli "Özellikler" bölümü). */
export function useOzellikOlayi(ad: Olay, ek?: Record<string, string>): void {
  const anahtar = ek ? JSON.stringify(ek) : '';
  useEffect(() => {
    olay(ad, ek);
    // ek nesnesi her render'da yeni olabilir; içerik anahtarı yeterli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad, anahtar]);
}
