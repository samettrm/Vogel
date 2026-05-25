// Word service — offline German dictionary + CEFR level exam prep.
// Vogel adaptation: removes curated WORD_BANK (not used), keeps bulk
// dictionary + German lib files for level words and word lookup.
import { ApiError } from '../api/http';
import type {
  DictionaryWord,
  ServiceResult,
  WordSummary,
} from '../api/types';
import {
  WORD_BANK,
  SEARCH_FALLBACK,
  type CuratedWord,
  type LocalizedText,
} from '@/lib/mock-data';
import { GERMAN_NOUNS } from '@/lib/german-nouns';
import { GERMAN_NOUNS_EXTRA } from '@/lib/german-nouns-extra';
import { getGermanConjugation, GERMAN_VERBS } from '@/lib/german-verbs';
import { GERMAN_VERBS_EXTRA } from '@/lib/german-verbs-extra';
import { getVerbCase } from '@/lib/german-verb-cases';
import { GERMAN_ADJECTIVES, GERMAN_ADVERBS, GERMAN_PHRASES } from '@/lib/german-words-extra';
import { GERMAN_ADJECTIVES_EXTRA } from '@/lib/german-adjectives-extra';
import { GERMAN_ADVERBS_EXTRA, GERMAN_PHRASES_EXTRA } from '@/lib/german-adverbs-extra';
import { GERMAN_FUNCTION_WORDS } from '@/lib/german-function-words';
import GERMAN_DICTIONARY from '@/lib/data/german-dictionary.json';
import GERMAN_RELATIONS from '@/lib/data/german-relations.json';
import GOETHE_LEVELS from '@/lib/data/goethe-levels.json';
import { stripGermanArticle } from '@/lib/text';
import {
  normalizeTurkish,
  seedTurkishPool,
  suggestTurkishCorrections,
  isKnownTurkish,
} from '@/lib/turkish-fuzzy';
import { useUserStore } from '@/src/store/useUserStore';

// Deduplicates curated words by language + id.
function dedupeById(words: CuratedWord[]): CuratedWord[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    const key = `${w.language}:${w.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Every curated German word from the hand-edited lib files.
const GERMAN_EXTRA: CuratedWord[] = [
  ...GERMAN_NOUNS,
  ...GERMAN_NOUNS_EXTRA,
  ...GERMAN_VERBS,
  ...GERMAN_VERBS_EXTRA,
  ...GERMAN_ADJECTIVES,
  ...GERMAN_ADJECTIVES_EXTRA,
  ...GERMAN_ADVERBS,
  ...GERMAN_ADVERBS_EXTRA,
  ...GERMAN_PHRASES,
  ...GERMAN_PHRASES_EXTRA,
  ...GERMAN_FUNCTION_WORDS,
];

const CURATED_POOL: CuratedWord[] = dedupeById([...SEARCH_FALLBACK, ...GERMAN_EXTRA]);
const GERMAN_BANK: CuratedWord[] = dedupeById([...(WORD_BANK.de ?? []), ...GERMAN_EXTRA]);
// Keep GERMAN_BANK reference to avoid lint unused warning
void GERMAN_BANK;

// ─── Offline bulk dictionary (German → Turkish) ──────────────────────────────
interface BulkEntry {
  w: string;  // German word
  t: string;  // Turkish meaning
  a?: string; // article (der/die/das)
  p?: string; // part of speech
}

const CURATED_DE_WORDS = new Set(
  CURATED_POOL.filter((w) => w.language === 'de').map((w) => w.word.toLowerCase()),
);
const GERMAN_BULK: BulkEntry[] = (GERMAN_DICTIONARY as BulkEntry[]).filter(
  (e) => !CURATED_DE_WORDS.has(e.w.toLowerCase()),
);
const GERMAN_BULK_MAP = new Map<string, BulkEntry>(
  GERMAN_BULK.map((e) => [e.w.toLowerCase(), e]),
);

function bulkType(e: BulkEntry): string {
  if (e.p) return e.p;
  return /^[A-ZÄÖÜ]/.test(e.w) ? 'noun' : 'word';
}

function bulkToSummary(e: BulkEntry): WordSummary {
  return {
    id: e.w,
    word: e.w,
    language: 'de',
    type: bulkType(e),
    article: e.a,
    shortDef: e.t,
    verbCase: getVerbCase(e.w),
  };
}

// ─── Fuzzy typo correction ────────────────────────────────────────────────────
let DE_LEMMA_POOL: string[] | null = null;
function getGermanLemmas(): string[] {
  if (DE_LEMMA_POOL) return DE_LEMMA_POOL;
  const seen = new Set<string>();
  const pool: string[] = [];
  for (const w of CURATED_POOL) {
    if (w.language !== 'de') continue;
    const key = w.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(w.word);
  }
  for (const e of GERMAN_BULK) {
    const key = e.w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(e.w);
  }
  DE_LEMMA_POOL = pool;
  return pool;
}

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

export interface GermanTypo {
  word: string;
  suggestion: string;
}

export function detectGermanTypos(text: string, limit = 5): GermanTypo[] {
  const tokens = text
    .split(/[\s.,;:!?"„""()«»…\-–—]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && /[A-Za-zÄÖÜäöüß]/.test(t));

  const lemmaPool = getGermanLemmas();
  const knownSet = new Set<string>(lemmaPool.map((w) => w.toLowerCase()));

  const out: GermanTypo[] = [];
  const seen = new Set<string>();
  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    if (knownSet.has(lower)) continue;
    const sug = suggestGermanCorrectionsWithLimit(tok, 1, 1);
    if (sug.length > 0) {
      out.push({ word: tok, suggestion: sug[0] });
      if (out.length >= limit) break;
    }
  }
  return out;
}

function suggestGermanCorrectionsWithLimit(query: string, maxDist: number, limit: number): string[] {
  const q = query.trim();
  if (q.length < 3) return [];
  const stripped = stripGermanArticle(q);
  const lower = stripped.toLowerCase();

  const pool = getGermanLemmas();
  const matches: { w: string; d: number; rank: number }[] = [];
  for (let i = 0; i < pool.length; i++) {
    const word = pool[i];
    const wl = word.toLowerCase();
    if (wl === lower) return [];
    if (Math.abs(wl.length - lower.length) > maxDist) continue;
    const d = dlDistance(lower, wl, maxDist);
    if (d > maxDist) continue;
    matches.push({ w: word, d, rank: i });
  }
  matches.sort((a, b) => a.d - b.d || a.rank - b.rank);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const key = m.w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(m.w);
    if (result.length >= limit) break;
  }
  return result;
}

let _trSeeded = false;
function ensureTurkishPoolSeeded(): void {
  if (_trSeeded) return;
  _trSeeded = true;
  const strings: string[] = [];
  for (const w of CURATED_POOL) {
    if (w.shortDef?.tr) strings.push(w.shortDef.tr);
  }
  for (const e of GERMAN_BULK) {
    if (e.t) strings.push(e.t);
  }
  seedTurkishPool(strings);
}

export { suggestTurkishCorrections, normalizeTurkish, isKnownTurkish };

export function suggestTurkishCorrectionsLazy(query: string, limit = 3): string[] {
  ensureTurkishPoolSeeded();
  return suggestTurkishCorrections(query, limit);
}

export function suggestGermanCorrections(query: string, limit = 3): string[] {
  const q = query.trim();
  if (q.length < 3) return [];
  const stripped = stripGermanArticle(q);
  const lower = stripped.toLowerCase();
  const maxDist = lower.length <= 4 ? 1 : lower.length <= 7 ? 2 : 3;

  const pool = getGermanLemmas();
  const matches: { w: string; d: number; rank: number }[] = [];
  for (let i = 0; i < pool.length; i++) {
    const word = pool[i];
    const wl = word.toLowerCase();
    if (wl === lower) return [];
    if (Math.abs(wl.length - lower.length) > maxDist) continue;
    const d = dlDistance(lower, wl, maxDist);
    if (d > maxDist) continue;
    matches.push({ w: word, d, rank: i });
  }
  matches.sort((a, b) => a.d - b.d || a.rank - b.rank);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    const key = m.w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m.w);
    if (out.length >= limit) break;
  }
  return out;
}

// ─── Word relations ───────────────────────────────────────────────────────────
interface WordRelation {
  o?: string[];
  s?: string[];
}
const GERMAN_RELATIONS_MAP: Record<string, WordRelation> =
  GERMAN_RELATIONS as Record<string, WordRelation>;

function relationsFor(word: string): { synonyms: string[]; antonyms: string[] } {
  const r = GERMAN_RELATIONS_MAP[word.trim().toLowerCase()];
  return { synonyms: r?.s ?? [], antonyms: r?.o ?? [] };
}

// ─── CEFR levels ─────────────────────────────────────────────────────────────
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const LEVEL_BANDS: Record<CefrLevel, [number, number]> = {
  A1: [0, 500],
  A2: [500, 1300],
  B1: [1300, 2800],
  B2: [2800, 4400],
  C1: [4400, 6297],
};
const LEVEL_CONTENT_POS = new Set(['noun', 'verb', 'adjective', 'adverb']);
const LEVEL_POOL: BulkEntry[] = (GERMAN_DICTIONARY as BulkEntry[]).filter(
  (e) => e.p !== undefined && LEVEL_CONTENT_POS.has(e.p),
);

function bulkToDictionaryWord(e: BulkEntry): DictionaryWord {
  return {
    id: e.w,
    word: e.w,
    language: 'de',
    article: e.a,
    pronunciation: '',
    type: e.p ?? 'word',
    shortDef: e.t,
    definitions: e.t ? [{ id: '1', meaning: e.t }] : [],
    examples: [],
    synonyms: [],
    antonyms: [],
  };
}

const OFFICIAL_LEVELS = GOETHE_LEVELS as Record<CefrLevel, string[]>;

function hasOfficialList(level: CefrLevel): boolean {
  return Array.isArray(OFFICIAL_LEVELS[level]) && OFFICIAL_LEVELS[level].length > 0;
}

function splitArticle(raw: string): { article?: string; word: string } {
  const m = raw.trim().match(/^(der|die|das)\s+(.+)$/i);
  if (m) return { article: m[1].toLowerCase(), word: m[2].trim() };
  return { word: raw.trim() };
}

// ─── Localisation ─────────────────────────────────────────────────────────────
function resolveText(text: LocalizedText): string {
  const lang = useUserStore.getState().language;
  return lang === 'tr' ? text.tr : text.en;
}

function curatedToSummary(c: CuratedWord): WordSummary {
  return {
    id: c.id,
    word: c.word,
    language: c.language,
    type: c.type,
    article: c.article,
    pronunciation: c.pronunciation,
    shortDef: resolveText(c.shortDef),
    verbCase: c.language === 'de' ? getVerbCase(c.word) : undefined,
  };
}

function curatedToDictionaryWord(c: CuratedWord): DictionaryWord {
  const meaning = resolveText(c.shortDef);
  return {
    id: c.id,
    word: c.word,
    language: c.language,
    article: c.article,
    pronunciation: c.pronunciation ?? '',
    type: c.type,
    shortDef: meaning,
    definitions: [{ id: '1', meaning }],
    examples: c.example ? [c.example] : [],
    verb:
      c.verb ??
      (c.language === 'de' && c.type === 'verb'
        ? getGermanConjugation(c.word)
        : undefined),
    verbCase: c.language === 'de' ? getVerbCase(c.word) : undefined,
    ...relationsFor(c.word),
    synonyms: relationsFor(c.word).synonyms,
    antonyms: relationsFor(c.word).antonyms,
  };
}

function findCurated(idOrWord: string): CuratedWord | undefined {
  const term = idOrWord.trim();
  const exact = CURATED_POOL.find(
    (w) => w.language === 'de' && (w.id === term || w.word === term),
  );
  if (exact) return exact;
  const key = term.toLowerCase();
  return CURATED_POOL.find(
    (w) =>
      w.language === 'de' &&
      (w.id.toLowerCase() === key || w.word.toLowerCase() === key),
  );
}

function dedupeSummaries(words: WordSummary[]): WordSummary[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    const key = `${w.language}:${w.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveOfficialWord(raw: string): WordSummary {
  const { article, word } = splitArticle(raw);
  const curated = findCurated(word);
  if (curated) return curatedToSummary(curated);
  const bulk = GERMAN_BULK_MAP.get(word.toLowerCase());
  if (bulk) return bulkToSummary(bulk);
  return { id: word, word, language: 'de', type: 'word', article, shortDef: '' };
}

function resolveOfficialDict(raw: string): DictionaryWord {
  const { article, word } = splitArticle(raw);
  const curated = findCurated(word);
  if (curated) return curatedToDictionaryWord(curated);
  const bulk = GERMAN_BULK_MAP.get(word.toLowerCase());
  if (bulk) return bulkToDictionaryWord(bulk);
  return {
    id: word, word, language: 'de', article, pronunciation: '', type: 'word',
    shortDef: '', definitions: [], examples: [], synonyms: [], antonyms: [],
  };
}

export function getLevelWords(level: CefrLevel): WordSummary[] {
  if (hasOfficialList(level)) {
    return dedupeSummaries(OFFICIAL_LEVELS[level].map(resolveOfficialWord));
  }
  const [start, end] = LEVEL_BANDS[level];
  return LEVEL_POOL.slice(start, end).map(bulkToSummary);
}

export function getLevelWordCount(level: CefrLevel): number {
  if (hasOfficialList(level)) return OFFICIAL_LEVELS[level].length;
  const [start, end] = LEVEL_BANDS[level];
  return Math.max(0, Math.min(end, LEVEL_POOL.length) - start);
}

export function getLevelDeck(level: CefrLevel, size = 12): DictionaryWord[] {
  let pool: DictionaryWord[];
  if (hasOfficialList(level)) {
    pool = OFFICIAL_LEVELS[level].map(resolveOfficialDict);
  } else {
    const [start, end] = LEVEL_BANDS[level];
    pool = LEVEL_POOL.slice(start, end).map((e) => {
      const curated = findCurated(e.w);
      return curated ? curatedToDictionaryWord(curated) : bulkToDictionaryWord(e);
    });
  }
  if (pool.length === 0) return [];
  const day = Math.floor(Date.now() / 86_400_000);
  const offset = (day * size) % pool.length;
  const count = Math.min(size, pool.length);
  return Array.from({ length: count }, (_, i) => pool[(offset + i) % pool.length]);
}

// ─── Word detail lookup ───────────────────────────────────────────────────────
export async function lookupWord(
  idOrWord: string,
  _signal?: AbortSignal,
): Promise<ServiceResult<DictionaryWord>> {
  const curated = findCurated(idOrWord);
  if (curated) {
    return { ok: true, data: curatedToDictionaryWord(curated), source: 'mock' };
  }

  // Non-curated words: try the offline bulk dictionary.
  const bulk = GERMAN_BULK_MAP.get(idOrWord.trim().toLowerCase());
  if (bulk) {
    const isVerb = bulk.p === 'verb';
    const data: DictionaryWord = {
      id: idOrWord,
      word: idOrWord,
      language: 'de',
      article: bulk.a,
      pronunciation: '',
      type: bulk.p ?? bulkType(bulk),
      shortDef: bulk.t,
      definitions: bulk.t ? [{ id: '1', meaning: bulk.t }] : [],
      examples: [],
      verb: isVerb ? getGermanConjugation(idOrWord) : undefined,
      verbCase: getVerbCase(idOrWord),
      ...relationsFor(idOrWord),
      synonyms: relationsFor(idOrWord).synonyms,
      antonyms: relationsFor(idOrWord).antonyms,
    };
    return { ok: true, data, source: 'mock' };
  }

  return { ok: false, kind: 'notFound', message: `Word not found: ${idOrWord}` };
}

// ─── Error helper ─────────────────────────────────────────────────────────────
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
