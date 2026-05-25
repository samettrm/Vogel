// Turkish-side fuzzy matching helpers.
//
// Users typing without Turkish-only characters (gunaydin instead of günaydın,
// uzun instead of üzun, tesekkurler instead of teşekkürler) used to get
// either nonsense results or no suggestions. This module:
//
//   1. Normalises Turkish strings so ASCII fallbacks match diacritics —
//      ı→i, ü→u, ö→o, ş→s, ç→c, ğ→g, â→a.
//   2. Builds a Turkish lemma pool from the curated bank's tr-glosses and
//      the bulk dictionary's translations, with the normalised key for
//      fast lookup.
//   3. Provides a Damerau-Levenshtein fuzzy correction over that pool.
//
// Everything is offline, no translation API involved.

const TR_MAP: Record<string, string> = {
  ı: 'i',
  İ: 'i',
  ü: 'u',
  Ü: 'u',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  â: 'a',
  Â: 'a',
  î: 'i',
  Î: 'i',
  û: 'u',
  Û: 'u',
};

// Strip diacritics for matching purposes. Always lowercases too — every
// comparison in this module is case-insensitive.
export function normalizeTurkish(input: string): string {
  let out = '';
  for (const ch of input) {
    out += TR_MAP[ch] ?? ch.toLowerCase();
  }
  return out;
}

// Damerau-Levenshtein with early termination, identical to the German one
// but kept here so this file is self-contained.
function dlDistance(a: string, b: string, max: number): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prev2: number[] = new Array(lb + 1).fill(0);
  let prev: number[] = new Array(lb + 1);
  let curr: number[] = new Array(lb + 1).fill(0);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = i;
    const ai = a.charCodeAt(i - 1);
    const aim1 = i > 1 ? a.charCodeAt(i - 2) : -1;
    for (let j = 1; j <= lb; j++) {
      const bj = b.charCodeAt(j - 1);
      const cost = ai === bj ? 0 : 1;
      let v = prev[j - 1] + cost;
      if (prev[j] + 1 < v) v = prev[j] + 1;
      if (curr[j - 1] + 1 < v) v = curr[j - 1] + 1;
      if (i > 1 && j > 1 && ai === b.charCodeAt(j - 2) && aim1 === bj) {
        const t = prev2[j - 2] + 1;
        if (t < v) v = t;
      }
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    const recycled = prev2;
    prev2 = prev;
    prev = curr;
    curr = recycled;
  }
  return prev[lb];
}

// Each Turkish lemma is stored with its display form + the normalised key.
// The normalised key feeds the DL distance check, the display form is what
// we show back to the user (so "günaydın" comes out properly accented).
interface TurkishLemma {
  word: string; // display form
  norm: string; // normalised key
  rank: number; // earlier = more common (used as tie-break)
}

let TR_POOL: TurkishLemma[] | null = null;
let TR_NORM_SET: Set<string> | null = null;

// Builder is lazy — runs only when first call needs the pool. Callers pass
// their own seed lists (curated tr-glosses, bulk dict t-fields) so this
// module doesn't have to import from word-service / data files itself.
export function seedTurkishPool(turkishStrings: readonly string[]): void {
  if (TR_POOL) return;
  const seenNorms = new Set<string>();
  const pool: TurkishLemma[] = [];

  for (let rank = 0; rank < turkishStrings.length; rank++) {
    const phrase = turkishStrings[rank];
    if (!phrase) continue;
    // Split on whitespace and common punctuation; treat each token as its own
    // lemma so multi-word glosses ("iyi akşamlar") still surface "akşamlar"
    // for a typed "aksamlar".
    const tokens = phrase.split(/[\s,;:/().,!?’'"-]+/).filter(Boolean);
    for (const tok of tokens) {
      if (tok.length < 3) continue;
      const norm = normalizeTurkish(tok);
      if (!/[a-z]/.test(norm)) continue; // skip pure numerics / symbols
      if (seenNorms.has(norm)) continue;
      seenNorms.add(norm);
      pool.push({ word: tok, norm, rank });
    }
  }
  TR_POOL = pool;
  TR_NORM_SET = seenNorms;
}

// Best-effort known check — true when the input (normalised) maps to a
// Turkish lemma we've seen. Callers use this to decide whether to bother
// with a fuzzy lookup at all.
export function isKnownTurkish(input: string): boolean {
  if (!TR_NORM_SET) return false;
  return TR_NORM_SET.has(normalizeTurkish(input.trim()));
}

// Suggest Turkish lemmas close to a typed/typo'd query. Returns the top
// `limit` matches by edit distance, with pool order as the tie breaker.
// Empty when the query (normalised) is already in the pool exactly.
export function suggestTurkishCorrections(query: string, limit = 3): string[] {
  if (!TR_POOL) return [];
  const q = query.trim();
  if (q.length < 3) return [];
  if (/\s/.test(q)) return []; // single-word only — sentences handled elsewhere
  const lower = normalizeTurkish(q);
  // Scale tolerance with length, like the German fuzzy.
  const maxDist = lower.length <= 4 ? 1 : lower.length <= 7 ? 2 : 3;

  const matches: { word: string; d: number; rank: number }[] = [];
  for (const item of TR_POOL) {
    if (item.norm === lower) return []; // already a hit
    if (Math.abs(item.norm.length - lower.length) > maxDist) continue;
    const d = dlDistance(lower, item.norm, maxDist);
    if (d > maxDist) continue;
    matches.push({ word: item.word, d, rank: item.rank });
  }
  matches.sort((a, b) => a.d - b.d || a.rank - b.rank);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const key = m.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m.word);
    if (out.length >= limit) break;
  }
  return out;
}
