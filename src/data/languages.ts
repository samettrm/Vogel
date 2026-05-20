import type { Language, LanguageCode } from '../types';

// Vogel'in desteklediği diller.
// Yeni bir dil eklemek için:
// 1) types/index.ts'deki LanguageCode union'a kod ekle
// 2) Buraya Language nesnesi ekle
// 3) data/courses/ altında o dil için kurs dosyası oluştur

export const LANGUAGES: Record<LanguageCode, Language> = {
  tr: { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
  de: { code: 'de', name: 'Almanca', nativeName: 'Deutsch', flag: '🇩🇪' },
  en: { code: 'en', name: 'İngilizce', nativeName: 'English', flag: '🇬🇧' },
  fr: { code: 'fr', name: 'Fransızca', nativeName: 'Français', flag: '🇫🇷' },
  es: { code: 'es', name: 'İspanyolca', nativeName: 'Español', flag: '🇪🇸' },
  it: { code: 'it', name: 'İtalyanca', nativeName: 'Italiano', flag: '🇮🇹' },
};

export const LANGUAGE_LIST: Language[] = Object.values(LANGUAGES);

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES[code];
}
