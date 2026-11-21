import { Platform } from 'react-native';
import { baslatSonucuAyikla, playDurumuAyikla, type BaslatSonucu, type PlayDurumu } from './guncellemeKural';

/**
 * GOOGLE PLAY UYGULAMA İÇİ GÜNCELLEME (23-10-2026) — yerel modül: modules/uygulama-ici-guncelleme (yalnız Android).
 * Yerel modül TEMBEL ve İSTEĞE BAĞLI yüklenir (proje kuralı): iPhone'da, Expo Go'da ya da bu modülden önceki bir
 * derlemede yoktur → null; hiçbir çağrı uygulamayı çökertmez, her hata kayda yazılır ve mağaza sayfası yedeğine düşülür.
 */

type Yerel = { durum(): Promise<unknown>; baslat(): Promise<unknown> };

const ZAMAN_ASIMI_MS = 6000;

function yerel(): Yerel | null {
  if (Platform.OS !== 'android') return null;
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    return (requireOptionalNativeModule('UygulamaIciGuncelleme') as Yerel | null) ?? null;
  } catch (e) {
    console.warn('[play-guncelleme] modül yüklenemedi:', String(e).slice(0, 120));
    return null;
  }
}

function zamanAsimi<T>(is: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((coz, reddet) => {
    const saat = setTimeout(() => reddet(new Error('timeout')), ms);
    is.then((d) => { clearTimeout(saat); coz(d); }, (e) => { clearTimeout(saat); reddet(e); });
  });
}

/** Play'in bu cihaz için bildiği güncelleme durumu; Android dışı / modülsüz / hata → null. */
export async function playGuncellemeDurumu(): Promise<PlayDurumu | null> {
  const m = yerel();
  if (!m) return null;
  try {
    return playDurumuAyikla(await zamanAsimi(m.durum(), ZAMAN_ASIMI_MS));
  } catch (e) {
    // Kabloyla kurulmuş derlemede Play "uygulama sizin değil" der — beklenen durum, uyarı yeterli.
    console.warn('[play-guncelleme] durum alınamadı:', String(e).slice(0, 160));
    return null;
  }
}

/** Play'in tam ekran güncellemesini uygulamanın içinde başlatır (yarıda kalmışsa sürdürür). */
export async function playIleGuncelle(): Promise<BaslatSonucu> {
  const m = yerel();
  if (!m) return 'yok';
  try {
    // Zaman aşımı YOK: Play ekranı açıkken avukat istediği kadar bekleyebilir; sonuç ekran kapanınca gelir.
    return baslatSonucuAyikla(await m.baslat());
  } catch (e) {
    console.warn('[play-guncelleme] başlatılamadı:', String(e).slice(0, 160));
    return 'basarisiz';
  }
}
