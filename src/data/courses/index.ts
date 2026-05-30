import type { Course, CEFRLevel, LanguageCode } from '../../types';

// TR → DE (Almanca) — TAM MÜFREDAT
import { TR_DE_A1 } from './tr-de-a1';
import { TR_DE_A2 } from './tr-de-a2';
import { TR_DE_B1 } from './tr-de-b1';
import { TR_DE_B2 } from './tr-de-b2';
import { TR_DE_C1 } from './tr-de-c1';

// TR → EN (İngilizce) — TAM MÜFREDAT
import { TR_EN_A1 } from './tr-en-a1';
import { TR_EN_A2 } from './tr-en-a2';
import { TR_EN_B1 } from './tr-en-b1';
import { TR_EN_B2 } from './tr-en-b2';
import { TR_EN_C1 } from './tr-en-c1';

// TR → ES (İspanyolca) — TAM MÜFREDAT
import { TR_ES_A1 } from './tr-es-a1';
import { TR_ES_A2 } from './tr-es-a2';
import { TR_ES_B1 } from './tr-es-b1';
import { TR_ES_B2 } from './tr-es-b2';
import { TR_ES_C1 } from './tr-es-c1';

// TR → FR (Fransızca) — TAM MÜFREDAT
import { TR_FR_A1 } from './tr-fr-a1';
import { TR_FR_A2 } from './tr-fr-a2';
import { TR_FR_B1 } from './tr-fr-b1';
import { TR_FR_B2 } from './tr-fr-b2';
import { TR_FR_C1 } from './tr-fr-c1';

// TR → IT (İtalyanca) — TAM MÜFREDAT
import { TR_IT_A1 } from './tr-it-a1';
import { TR_IT_A2 } from './tr-it-a2';
import { TR_IT_B1 } from './tr-it-b1';
import { TR_IT_B2 } from './tr-it-b2';
import { TR_IT_C1 } from './tr-it-c1';

// TR → AR (Arapça) — TAM MÜFREDAT
import { TR_AR_A1 } from './tr-ar-a1';
import { TR_AR_A2 } from './tr-ar-a2';
import { TR_AR_B1 } from './tr-ar-b1';
import { TR_AR_B2 } from './tr-ar-b2';
import { TR_AR_C1 } from './tr-ar-c1';

// EN → DE (Yabancılar için Almanca) — PLACEHOLDER
import { EN_DE_A1 } from './en-de-a1';
import { EN_DE_A2 } from './en-de-a2';
import { EN_DE_B1 } from './en-de-b1';
import { EN_DE_B2 } from './en-de-b2';
import { EN_DE_C1 } from './en-de-c1';

// ════════════════════════════════════════════════════════════════
// TÜM KURSLAR — Multi-language support
//
// Dil çifti seçimi için pair-aware fonksiyonlar:
//   - getCoursesByPair(source, target) → o dil çiftine ait 5 seviye
//   - getCourseByPairAndLevel(source, target, level) → tek course
//
// Eski API (getCourseByLevel) backward compatibility için kalır,
// TR-DE varsayar.
// ════════════════════════════════════════════════════════════════

export const ALL_COURSES: Course[] = [
  // TR → DE (active müfredat)
  TR_DE_A1, TR_DE_A2, TR_DE_B1, TR_DE_B2, TR_DE_C1,
  // TR → EN (placeholder)
  TR_EN_A1, TR_EN_A2, TR_EN_B1, TR_EN_B2, TR_EN_C1,
  // TR → ES
  TR_ES_A1, TR_ES_A2, TR_ES_B1, TR_ES_B2, TR_ES_C1,
  // TR → FR
  TR_FR_A1, TR_FR_A2, TR_FR_B1, TR_FR_B2, TR_FR_C1,
  // TR → IT
  TR_IT_A1, TR_IT_A2, TR_IT_B1, TR_IT_B2, TR_IT_C1,
  // TR → AR
  TR_AR_A1, TR_AR_A2, TR_AR_B1, TR_AR_B2, TR_AR_C1,
  // EN → DE (yabancılar için)
  EN_DE_A1, EN_DE_A2, EN_DE_B1, EN_DE_B2, EN_DE_C1,
];

export function getCourseById(id: string): Course | undefined {
  return ALL_COURSES.find((c) => c.id === id);
}

// 🎯 Pair-aware: belirli source-target çifti için tüm seviyeler
export function getCoursesByPair(
  source: LanguageCode,
  target: LanguageCode,
): Course[] {
  return ALL_COURSES.filter(
    (c) => c.sourceLanguage === source && c.targetLanguage === target,
  );
}

// 🎯 Pair-aware: belirli source-target-level için tek course
export function getCourseByPairAndLevel(
  source: LanguageCode,
  target: LanguageCode,
  level: CEFRLevel,
): Course | undefined {
  return ALL_COURSES.find(
    (c) =>
      c.sourceLanguage === source &&
      c.targetLanguage === target &&
      c.level === level,
  );
}

// 🔙 LEGACY: Eski API — sadece level ile arar (TR-DE varsayar)
//   Bu fonksiyon eski kodun kırılmaması için kalır.
//   YENİ kod getCourseByPairAndLevel kullanmalı.
export function getCourseByLevel(level: CEFRLevel): Course | undefined {
  return ALL_COURSES.find(
    (c) =>
      c.level === level &&
      c.sourceLanguage === 'tr' &&
      c.targetLanguage === 'de',
  );
}

// Mevcut tüm seviyeler (UI sekmelerinde gösterilir)
export const AVAILABLE_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
