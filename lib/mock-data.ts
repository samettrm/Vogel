// Minimal stub — Vogel does not use the curated word bank (WORD_BANK).
// The German word list comes entirely from the offline bulk dictionary
// and the hand-edited German lib files (german-nouns.ts, etc.).
import type { VerbConjugation, WordExample } from '@/services/api/types';

export type WordLanguage = 'de' | 'en';
export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'article'
  | 'number';

export interface LocalizedText {
  tr: string;
  en: string;
}

export interface CuratedWord {
  id: string;
  word: string;
  language: WordLanguage;
  type: WordType;
  article?: string;
  pronunciation?: string;
  shortDef: LocalizedText;
  example?: WordExample;
  verb?: VerbConjugation;
}

// No curated bank in Vogel — level words come from the bulk dictionary.
export const WORD_BANK: Record<WordLanguage, CuratedWord[]> = { de: [], en: [] };
export const SEARCH_FALLBACK: CuratedWord[] = [];
