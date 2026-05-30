import type { LanguageCode } from '../types';

// ════════════════════════════════════════════════════════════════
// LANGUAGE PAIRS — Multi-language support config
//
// Vogel'in desteklediği dil çiftleri. Her çift bir source → target
// kombinasyonunu temsil eder.
//
// available=false olan çiftler "Yakında" badge gösterir, course
// içeriği henüz hazır değildir (placeholder).
// ════════════════════════════════════════════════════════════════

export interface LanguagePairInfo {
  source: LanguageCode;
  target: LanguageCode;
  /** UI'da gösterilen başlık (Türkçe) */
  title: string;
  /** UI'da gösterilen başlık (İngilizce) */
  titleEn: string;
  /** Hedef dilin bayrak emoji'si */
  flag: string;
  /** Hedef dilin adı (Türkçe) */
  targetName: string;
  /** Hedef dilin adı (İngilizce) */
  targetNameEn: string;
  /** Hedef dilin kendi dilinde adı (örn. Deutsch) */
  targetNativeName: string;
  /** Ders içeriği hazır mı? false ise "Yakında" gösterilir */
  available: boolean;
  /** Subtitle/description (opsiyonel) */
  subtitle?: string;
}

export const LANGUAGE_PAIRS: LanguagePairInfo[] = [
  {
    source: 'tr',
    target: 'de',
    title: 'Almanca',
    titleEn: 'German',
    flag: '🇩🇪',
    targetName: 'Almanca',
    targetNameEn: 'German',
    targetNativeName: 'Deutsch',
    available: true, // ✅ Mevcut TR-DE müfredat
    subtitle: 'A1 → C1 tam müfredat',
  },
  {
    source: 'tr',
    target: 'en',
    title: 'İngilizce',
    titleEn: 'English',
    flag: '🇬🇧',
    targetName: 'İngilizce',
    targetNameEn: 'English',
    targetNativeName: 'English',
    available: true,
    subtitle: 'A1 → C1 tam müfredat',
  },
  {
    source: 'tr',
    target: 'es',
    title: 'İspanyolca',
    titleEn: 'Spanish',
    flag: '🇪🇸',
    targetName: 'İspanyolca',
    targetNameEn: 'Spanish',
    targetNativeName: 'Español',
    available: true,
    subtitle: 'A1 → C1 tam müfredat',
  },
  {
    source: 'tr',
    target: 'fr',
    title: 'Fransızca',
    titleEn: 'French',
    flag: '🇫🇷',
    targetName: 'Fransızca',
    targetNameEn: 'French',
    targetNativeName: 'Français',
    available: true,
    subtitle: 'A1 → C1 tam müfredat',
  },
  {
    source: 'tr',
    target: 'it',
    title: 'İtalyanca',
    titleEn: 'Italian',
    flag: '🇮🇹',
    targetName: 'İtalyanca',
    targetNameEn: 'Italian',
    targetNativeName: 'Italiano',
    available: true,
    subtitle: 'A1 → C1 tam müfredat',
  },
  {
    source: 'tr',
    target: 'ar',
    title: 'Arapça',
    titleEn: 'Arabic',
    flag: '🇸🇦',
    targetName: 'Arapça',
    targetNameEn: 'Arabic',
    targetNativeName: 'العربية',
    available: true,
    subtitle: 'A1 → C1 tam müfredat',
  },
  // EN → DE (yabancılar için Almanca) listede gösterilmez —
  // sadece İngilizce UI desteklendiğinde anlamlı olur.
  // Course dosyaları korunur (gelecek için), sadece dropdown'da gizlenir.
];

// Default pair — kullanıcı henüz seçmediyse veya eski persist'te yoksa
export const DEFAULT_LANG_PAIR: LanguagePairInfo = LANGUAGE_PAIRS[0]; // TR-DE

// Yardımcı: pair'i source+target ile bul
export function findLanguagePair(
  source: LanguageCode,
  target: LanguageCode,
): LanguagePairInfo | undefined {
  return LANGUAGE_PAIRS.find((p) => p.source === source && p.target === target);
}

// Yardımcı: pair ID (source-target)
export function getPairId(source: LanguageCode, target: LanguageCode): string {
  return `${source}-${target}`;
}
