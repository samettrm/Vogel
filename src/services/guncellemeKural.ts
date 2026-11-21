/**
 * GÜNCELLEME ŞERİDİ — saf kurallar. Tevkil Merkezi `lib/surum.ts` + `lib/playGuncelleme.ts`
 * ile aynı. Bilinmeyen her durumda şerit AÇILMAZ: yanlış uyarı, uyarısızlıktan pahalıdır;
 * denetçinin yeni build'i mağazadakinden büyük olduğu için onu görmez.
 */
const DESEN = /^[0-9]{1,4}(\.[0-9]{1,4}){1,3}$/;

/** × denince aynı sürüm için bu süre görünmez. */
export const ERTELEME_MS = 24 * 60 * 60 * 1000;

export function surumKarsilastir(a: string | null | undefined, b: string | null | undefined): -1 | 0 | 1 | null {
  if (!a || !b || !DESEN.test(a) || !DESEN.test(b)) return null;
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function ertelendiMi(kayit: { surum?: string; zaman?: number } | null | undefined, anahtar: string, simdi: number): boolean {
  if (!kayit || kayit.surum !== anahtar || typeof kayit.zaman !== 'number') return false;
  return simdi - kayit.zaman < ERTELEME_MS && simdi >= kayit.zaman;
}

export type PlayDurumu = { musait: boolean; suruyor: boolean; hemenIzinli: boolean; surumKodu: number };
export type BaslatSonucu = 'basladi' | 'vazgecildi' | 'basarisiz' | 'yok';

export function playDurumuAyikla(ham: unknown): PlayDurumu | null {
  if (!ham || typeof ham !== 'object') return null;
  const h = ham as Record<string, unknown>;
  if (typeof h.musait !== 'boolean' || typeof h.suruyor !== 'boolean' || typeof h.hemenIzinli !== 'boolean') return null;
  const kod = typeof h.surumKodu === 'number' && Number.isFinite(h.surumKodu) ? Math.trunc(h.surumKodu) : 0;
  return { musait: h.musait, suruyor: h.suruyor, hemenIzinli: h.hemenIzinli, surumKodu: kod };
}

const SONUCLAR: readonly BaslatSonucu[] = ['basladi', 'vazgecildi', 'basarisiz', 'yok'];
export function baslatSonucuAyikla(ham: unknown): BaslatSonucu {
  return typeof ham === 'string' && (SONUCLAR as readonly string[]).includes(ham) ? (ham as BaslatSonucu) : 'basarisiz';
}

/** Play ekranı açılmadıysa mağaza sayfası açılır; kullanıcı vazgeçtiyse götürülmez. */
export function magazayaGitmeli(s: BaslatSonucu): boolean {
  return s === 'yok' || s === 'basarisiz';
}

/** `anahtar`, × kaydının anahtarıdır. App Store sürümü önceliklidir; yoksa Play sürüm kodu. */
export function seritKarari(
  kendi: { surum: string | null; build: string | null },
  appStoreSurumu: string | null,
  play: PlayDurumu | null,
): { gorunur: boolean; anahtar: string | null; surum: string | null } {
  if (surumKarsilastir(kendi.surum, appStoreSurumu) === -1) {
    return { gorunur: true, anahtar: appStoreSurumu, surum: appStoreSurumu };
  }
  const build = Number(kendi.build);
  if (play?.musait && play.surumKodu > 0 && (!Number.isFinite(build) || play.surumKodu > build)) {
    return { gorunur: true, anahtar: `vc${play.surumKodu}`, surum: null };
  }
  return { gorunur: false, anahtar: null, surum: null };
}
