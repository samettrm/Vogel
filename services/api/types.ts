// ─── Languages ──────────────────────────────────────────────────────────────
export type WordLanguage = 'de' | 'en';

// ─── Normalised domain models — screens consume these, never wire types ─────

// Lightweight model for lists, search results and feeds.
export interface WordSummary {
  id: string;
  word: string;
  language: WordLanguage;
  type: string;
  article?: string;
  pronunciation?: string;
  shortDef: string;
  verbCase?: string;
}

// An example sentence, optionally with a Turkish translation.
export interface WordExample {
  text: string;
  translation?: string;
}

// A single conjugated form within a tense.
export interface ConjugationForm {
  pronoun: string;
  form: string;
}

// One tense of a verb conjugation (e.g. Präsens, Präteritum, Perfekt).
export interface ConjugationTense {
  nameTr: string;
  nameDe: string;
  forms: ConjugationForm[];
}

// Verb conjugation — regular/irregular flag plus tense tables.
export interface VerbConjugation {
  regular: boolean;
  conjugations: ConjugationTense[];
}

// Full model for the word detail screen.
export interface DictionaryWord {
  id: string;
  word: string;
  language: WordLanguage;
  article?: string;
  pronunciation: string;
  audioUrl?: string;
  type: string;
  shortDef: string;
  definitions: Array<{ id: string; meaning: string }>;
  examples: WordExample[];
  verb?: VerbConjugation;
  verbCase?: string;
  synonyms: string[];
  antonyms: string[];
  etymology?: string;
}

// Discriminated result returned by the word service.
export type DataSource = 'api' | 'mock';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'notFound'
  | 'server'
  | 'parse';

export type ServiceResult<T> =
  | { ok: true; data: T; source: DataSource }
  | { ok: false; kind: ApiErrorKind; message: string };
