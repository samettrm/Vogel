export type LanguageCode = 'tr' | 'de' | 'en' | 'fr' | 'es' | 'it';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type Language = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
};

export type LanguagePair = {
  source: LanguageCode;
  target: LanguageCode;
};

export type Course = {
  id: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  level: CEFRLevel;
  title: string;
  description: string;
  units: Unit[];
};

export type Unit = {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: Lesson[];
  // 🏷️ Kişiselleştirme tag'leri — kullanıcı motivasyonuyla eşleşenler
  // önerilen ders algoritmasında öncelik kazanır.
  // Örnek: ['travel', 'food'] (Seyahat motivasyonu olanlara öne çıkar)
  tags?: PersonalizationTag[];
};

// Kişiselleştirme tag'leri — hem ünitelerde hem motivasyon-tag eslemesi için
export type PersonalizationTag =
  | 'daily'      // Günlük hayat (selamlaşma, küçük konuşmalar)
  | 'travel'     // Seyahat (otel, ulaşım, yön)
  | 'work'       // İş, kariyer (ofis, e-posta)
  | 'family'     // Aile, kişisel ilişkiler
  | 'food'       // Yemek, restoran, içecek
  | 'numbers'    // Sayılar, saat, tarih
  | 'culture'    // Kültür, eğlence, film/dizi/müzik
  | 'formal'     // Resmi/akademik dil
  | 'emotion'    // Duygular, ifadeler
  | 'tech';      // Teknoloji (ileri seviyeler için)

// Onboarding'de seçilen motivasyon türleri
export type LearningMotivation =
  | 'travel'
  | 'work'
  | 'family'
  | 'media'
  | 'academic'
  | 'curious';

export type Lesson = {
  id: string;
  order: number;
  title: string;
  xpReward: number;
  exercises: Exercise[];
  // Gramer ipucu — ders başlamadan önce intro card gösterilir
  grammarNote?: { tr: string; en: string };
};

export type ExerciseType =
  | 'translate'
  | 'multipleChoice'
  | 'listen'
  | 'matchPairs'
  | 'fillBlank'
  | 'speak';

export type MultipleChoiceOption = {
  id: string;
  text: string;
};

export type MultipleChoiceExercise = {
  id: string;
  type: 'multipleChoice';
  question: string;
  options: MultipleChoiceOption[];
  correctOptionId: string;
  explanation?: string;
};

export type TranslateExercise = {
  id: string;
  type: 'translate';
  prompt: string;
  sentence?: string;
  correctAnswer: string;
  wordBank: string[];
};

export type ListenExercise = {
  id: string;
  type: 'listen';
  prompt?: string;
  audioText: string;
  // Opsiyonel gerçek ses dosyası URL'si — yoksa expo-speech TTS fallback
  audioUrl?: string;
  correctAnswer: string;
  wordBank: string[];
  // 🌐 Türkçe çeviri — cevap kontrol edildikten sonra görünür (anlam bütünlüğü için)
  translation?: string;
};

export type MatchPair = {
  id: string;
  left: string;
  right: string;
};

export type MatchPairsExercise = {
  id: string;
  type: 'matchPairs';
  pairs: MatchPair[];
};

export type FillBlankExercise = {
  id: string;
  type: 'fillBlank';
  prompt: string;
  correctAnswer: string;
  wordBank: string[];
};

export type SpeakExercise = {
  id: string;
  type: 'speak';
  prompt: string;
  targetText: string;
};

export type Exercise =
  | TranslateExercise
  | MultipleChoiceExercise
  | ListenExercise
  | MatchPairsExercise
  | FillBlankExercise
  | SpeakExercise;