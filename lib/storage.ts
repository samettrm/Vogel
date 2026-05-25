// Vogel offline storage — AsyncStorage helpers for exam prep + flashcard data.
// Keys use `vogel:` prefix to avoid collisions with the Zustand persist store.
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  FAVORITES:          'vogel:favorites',
  SEARCH_HISTORY:     'vogel:search_history',
  FLASHCARD_HISTORY:  'vogel:flashcard_history',
  LEARNED_WORDS:      'vogel:learned_words',
  EXAM_SCORES:        'vogel:exam_scores',
  DAILY_LOG:          'vogel:daily_log',
} as const;

type Key = typeof K[keyof typeof K];

async function read<T>(key: Key, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function write<T>(key: Key, value: T): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Favorites ────────────────────────────────────────────────────────────────
export interface FavoriteWord {
  id: string;
  word: string;
  language: 'de' | 'en';
  type: string;
  article?: string;
  shortDef?: string;
  savedAt: number;
}

export async function getFavorites(): Promise<FavoriteWord[]> {
  const list = await read<FavoriteWord[]>(K.FAVORITES, []);
  const seen = new Set<string>();
  return list.filter((x) => {
    if (x == null || typeof x.id !== 'string' || typeof x.language !== 'string') return false;
    const key = `${x.language}:${x.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export async function addFavorite(word: FavoriteWord): Promise<void> {
  const list = await getFavorites();
  if (list.some((x) => x.id === word.id && x.language === word.language)) return;
  await write(K.FAVORITES, [{ ...word, savedAt: Date.now() }, ...list]);
}
export async function removeFavorite(id: string, language: string): Promise<void> {
  const list = await getFavorites();
  await write(K.FAVORITES, list.filter((x) => !(x.id === id && x.language === language)));
}
export async function isFavorite(id: string, language: string): Promise<boolean> {
  return (await getFavorites()).some((x) => x.id === id && x.language === language);
}

// ── Learned Words ─────────────────────────────────────────────────────────────
export interface LearnedWord {
  id: string;
  word: string;
  language: 'de' | 'en';
  type: string;
  article?: string;
  shortDef?: string;
  learnedAt: number;
}

export async function getLearnedWords(): Promise<LearnedWord[]> {
  const list = await read<LearnedWord[]>(K.LEARNED_WORDS, []);
  const seen = new Set<string>();
  return list.filter((x) => {
    if (x == null || typeof x.id !== 'string' || typeof x.language !== 'string') return false;
    const key = `${x.language}:${x.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function addLearnedWord(word: Omit<LearnedWord, 'learnedAt'>): Promise<void> {
  const list = await getLearnedWords();
  const rest = list.filter((x) => !(x.id === word.id && x.language === word.language));
  await write(K.LEARNED_WORDS, [{ ...word, learnedAt: Date.now() }, ...rest]);
}

export async function getWordsLearned(): Promise<number> {
  return (await getLearnedWords()).length;
}

export async function getLearnedTodayCount(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const list = await getLearnedWords();
  return list.filter((x) => x.learnedAt >= start.getTime()).length;
}

// ── Exam Scores (best % per CEFR level) ──────────────────────────────────────
export async function getExamScores(): Promise<Record<string, number>> {
  return read<Record<string, number>>(K.EXAM_SCORES, {});
}

export async function recordExamScore(level: string, percent: number): Promise<void> {
  const scores = await getExamScores();
  if (percent > (scores[level] ?? 0)) {
    scores[level] = percent;
    await write(K.EXAM_SCORES, scores);
  }
}

/** Öğrenilen kelimeleri toplu yaz (sync için) */
export async function setLearnedWords(words: LearnedWord[]): Promise<void> {
  await write(K.LEARNED_WORDS, words);
}

/** Sınav skorlarını toplu yaz (sync için) */
export async function setExamScores(scores: Record<string, number>): Promise<void> {
  await write(K.EXAM_SCORES, scores);
}

// ── Flashcard History ─────────────────────────────────────────────────────────
export interface FlashSession {
  date: string;
  know: number;
  hard: number;
  again: number;
  total: number;
}

export async function saveFlashSession(s: Omit<FlashSession, 'date'>): Promise<void> {
  const all = await read<FlashSession[]>(K.FLASHCARD_HISTORY, []);
  await write(K.FLASHCARD_HISTORY, [{ ...s, date: new Date().toISOString() }, ...all].slice(0, 60));
}

export async function getFlashHistory(): Promise<FlashSession[]> {
  return read<FlashSession[]>(K.FLASHCARD_HISTORY, []);
}

export async function getFlashSessionsToday(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const all = await getFlashHistory();
  return all.filter((s) => typeof s.date === 'string' && s.date.slice(0, 10) === today).length;
}

// ── Daily Activity Log (heatmap) ──────────────────────────────────────────────
export async function logActivity(n = 1): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const log = await read<Record<string, number>>(K.DAILY_LOG, {});
  log[today] = (log[today] ?? 0) + n;
  await write(K.DAILY_LOG, log);
}

export async function getDailyLog(): Promise<Record<string, number>> {
  return read<Record<string, number>>(K.DAILY_LOG, {});
}

// ── Streak (lightweight — updates activity log) ──────────────────────────────
// Vogel's main streak lives in useUserStore. This is a thin wrapper that
// just logs activity so the daily heatmap stays accurate.
export async function touchStreak(): Promise<void> {
  await logActivity(1);
}
