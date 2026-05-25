// Locale-aware text helpers. Turkish has dotted/dotless i (i↔İ, ı↔I) so plain
// toUpperCase/toLowerCase corrupt Turkish text — always go through these.

// Capitalises the first letter, Turkish-aware (e.g. "istanbul" → "İstanbul").
export function capitalizeFirst(value: string, locale = 'tr'): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}

// Uppercase the whole string, Turkish-aware.
export function toUpper(value: string, locale = 'tr'): string {
  return value.toLocaleUpperCase(locale);
}

// Normalises a query for matching: trims and lowercases Turkish-aware.
export function normalizeQuery(value: string, locale = 'tr'): string {
  return value.trim().toLocaleLowerCase(locale);
}

// Strips a leading German article so "die Schwester" looks up as "Schwester".
const GERMAN_ARTICLE = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\s+/i;
export function stripGermanArticle(value: string): string {
  return value.replace(GERMAN_ARTICLE, '').trim();
}

// Converts a German word into a rough Turkish-readable respelling, so a learner
// sees "şvesta" instead of the IPA "/ˈʃvɛstɐ/". Approximate but readable.
export function germanReadingTr(word: string): string {
  let s = ` ${word.toLowerCase()} `;
  const rules: [RegExp, string][] = [
    [/tsch/g, 'ç'],
    [/sch/g, 'ş'],
    [/chs/g, 'ks'],
    [/ch/g, 'h'],
    [/ck/g, 'k'],
    [/c/g, 'k'],
    [/ph/g, 'f'],
    [/ /g, ' '],
    [/ st/g, ' şt'],
    [/ sp/g, ' şp'],
    [/ie/g, 'i'],
    [/ei/g, 'ay'],
    [/ai/g, 'ay'],
    [/eu/g, 'oy'],
    [/äu/g, 'oy'],
    [/ee/g, 'e'],
    [/aa/g, 'a'],
    [/oo/g, 'o'],
    [/qu/g, 'kv'],
    [/ß/g, 's'],
    [/ä/g, 'e'],
    [/v/g, 'f'],
    [/w/g, 'v'],
    [/z/g, 'ts'],
    [/y/g, 'ü'],
    [/j/g, 'y'],
    [/er /g, 'ar '],
    [/([bcdfghklmnprst])\1/g, '$1'],
  ];
  for (const [re, rep] of rules) s = s.replace(re, rep);
  return s.trim();
}

// Removes HTML tags and decodes common entities (Wiktionary returns HTML).
export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
