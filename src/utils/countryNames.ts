// ════════════════════════════════════════════════════════════════
// Ülke kodu → bayrak + tam ad (owner paneli standardı §9 · Samet 04-11-2026)
//
// Panelde ülke her yerde "🇹🇷 Türkiye" biçiminde görünür; çıplak "TR" kodu gösterilmez.
// Hermes'te Intl.DisplayNames olmadığı için ad gömülü CLDR tablosundan gelir (src/data/ulke-adlari.ts,
// 279 bölge kodu). Bayrak koddan deterministik üretilir; tabloda OLMAYAN kodda bayrak UYDURULMAZ.
// ════════════════════════════════════════════════════════════════
import { ULKE_ADLARI } from '../data/ulke-adlari';

function normalize(code: string | null | undefined): string | null {
  const c = (code ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}

/** "TR" → "Türkiye". Geçersiz/boş kodda "Bilinmiyor"; tabloda olmayan geçerli kodda kodun kendisi. */
export function countryName(code: string): string {
  const c = normalize(code);
  if (!c || c === 'ZZ') return 'Bilinmiyor';
  return ULKE_ADLARI.tr[c] ?? ULKE_ADLARI.en[c] ?? c;
}

/** "TR" → 🇹🇷. Tabloda olmayan ya da geçersiz kodda boş döner (bayrak uydurulmaz). */
export function countryFlag(code: string): string {
  const c = normalize(code);
  if (!c || c === 'ZZ' || !(ULKE_ADLARI.en[c] || ULKE_ADLARI.tr[c])) return '';
  return String.fromCodePoint(...c.split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** Tek satır gösterim: "🇹🇷 Türkiye" (bilinmeyen kodda yalnız ad). */
export function countryLabel(code: string): string {
  const b = countryFlag(code);
  return b ? `${b} ${countryName(code)}` : countryName(code);
}
