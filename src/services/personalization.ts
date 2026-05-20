import type {
  LearningMotivation,
  PersonalizationTag,
  Unit,
} from '../types';
import type { MessageKey } from '../i18n';

// ════════════════════════════════════════════════════════════════
// PERSONALIZATION SERVICE
//
// Kullanıcının motivasyonlarına göre içerik puanlama + mesaj seçimi.
//
// MİMARİ:
//   1. MOTIVATION_TAGS — her motivasyon hangi içerik kategorilerine bağlı
//   2. scoreUnitForUser() — bir ünite o kullanıcıya ne kadar uygun
//   3. getPersonalizedReminderKey() — bildirim mesajı seçimi
//   4. getMotivationLabel() — motivasyon i18n key'i
//   5. estimateTimeToA2() — kullanıcının A2'ye ne kadar sürede gideceğini tahmin
//
// MANTIK: İçerik herkese aynı, ama uygulama bu servisle "kullanıcıyı tanıyor"
// gibi davranır. Aynı uygulama, farklı yolculuk.
// ════════════════════════════════════════════════════════════════

// ─── Motivasyon → İçerik Tag eşlemesi ───
// Her motivasyon, hangi tag'leri yüksek puanlı bulur?
export const MOTIVATION_TAGS: Record<LearningMotivation, PersonalizationTag[]> = {
  travel:   ['travel', 'food', 'numbers', 'daily'],
  work:     ['work', 'formal', 'numbers', 'tech'],
  family:   ['family', 'emotion', 'daily'],
  media:    ['culture', 'daily', 'emotion'],
  academic: ['formal', 'numbers', 'tech'],
  curious:  ['daily', 'culture'],
};

// ─── Motivasyon meta bilgileri (UI için) ───
export interface MotivationMeta {
  id: LearningMotivation;
  emoji: string;
  labelKey: MessageKey;
  // Onboarding özet ekranında gösterilecek kısa kişisel mesaj
  summaryKey: MessageKey;
  // Tema rengi (özet ekranında kart border'ı)
  themeColor: 'neon' | 'cyan' | 'red' | 'gold' | 'purple';
}

export const MOTIVATIONS_META: MotivationMeta[] = [
  { id: 'travel',   emoji: '🌍', labelKey: 'onboarding.motivationTravel',   summaryKey: 'onboarding.summaryTravel',   themeColor: 'cyan'   },
  { id: 'work',     emoji: '💼', labelKey: 'onboarding.motivationWork',     summaryKey: 'onboarding.summaryWork',     themeColor: 'purple' },
  { id: 'family',   emoji: '❤️', labelKey: 'onboarding.motivationFamily',   summaryKey: 'onboarding.summaryFamily',   themeColor: 'red'    },
  { id: 'media',    emoji: '🎬', labelKey: 'onboarding.motivationMedia',    summaryKey: 'onboarding.summaryMedia',    themeColor: 'gold'   },
  { id: 'academic', emoji: '📚', labelKey: 'onboarding.motivationAcademic', summaryKey: 'onboarding.summaryAcademic', themeColor: 'purple' },
  { id: 'curious',  emoji: '🧠', labelKey: 'onboarding.motivationCurious',  summaryKey: 'onboarding.summaryCurious',  themeColor: 'neon'   },
];

// ─── Bir motivasyon için META bilgisi getir ───
export function getMotivationMeta(motivation: string): MotivationMeta | null {
  return MOTIVATIONS_META.find((m) => m.id === motivation) ?? null;
}

// ─── Üniteye kullanıcı motivasyonlarına göre puan ver ───
// 0-1 arası normalize edilmiş skor.
// 0 = hiç uygun değil, 1 = mükemmel uyum
export function scoreUnitForUser(
  unit: Unit,
  userMotivations: string[],
): number {
  if (!unit.tags || unit.tags.length === 0) return 0.5; // Tag yoksa ortalama
  if (userMotivations.length === 0) return 0.5;         // Motivasyon yoksa ortalama

  // Kullanıcının tüm motivasyonlarına ait tag havuzu
  const userTagPool = new Set<PersonalizationTag>();
  for (const m of userMotivations) {
    const tags = MOTIVATION_TAGS[m as LearningMotivation];
    if (tags) tags.forEach((t) => userTagPool.add(t));
  }

  // Ünite tag'leri ile kullanıcı tag havuzu arasındaki kesişim oranı
  const unitTags = new Set(unit.tags);
  let matches = 0;
  for (const t of unitTags) {
    if (userTagPool.has(t)) matches++;
  }

  // Skor: kesişim / ünite tag sayısı
  return matches / unitTags.size;
}

// ─── Akıllı bildirim mesajı seçimi ───
// Sabah/akşam ve kullanıcı motivasyonlarına göre uygun mesaj key'i döndürür.
// Strategy: %50 motivasyon-spesifik, %50 genel (kullanıcı motivasyon seçtiyse)
export function getPersonalizedReminderKey(
  timeOfDay: 'morning' | 'evening',
  userMotivations: string[],
): MessageKey {
  const generalKeys: MessageKey[] = timeOfDay === 'morning'
    ? [
        'smartReminder.morning1', 'smartReminder.morning2', 'smartReminder.morning3',
        'smartReminder.morning4', 'smartReminder.morning5', 'smartReminder.morning6',
        'smartReminder.morning7', 'smartReminder.morning8',
      ]
    : [
        'smartReminder.evening1', 'smartReminder.evening2', 'smartReminder.evening3',
        'smartReminder.evening4', 'smartReminder.evening5', 'smartReminder.evening6',
        'smartReminder.evening7', 'smartReminder.evening8',
      ];

  // Kullanıcı motivasyon seçmediyse → genel havuzdan random
  if (userMotivations.length === 0) {
    return pickRandom(generalKeys);
  }

  // %50 olasılık: motivasyon-spesifik mesaj
  if (Math.random() < 0.5) {
    const pickedMotivation = pickRandom(userMotivations);
    const personalKeys = getMotivationSpecificKeys(
      pickedMotivation as LearningMotivation,
      timeOfDay,
    );
    if (personalKeys.length > 0) {
      return pickRandom(personalKeys);
    }
  }

  // Diğer durumlarda genel havuzdan
  return pickRandom(generalKeys);
}

// ─── Motivasyon-spesifik mesaj key'lerini topla ───
function getMotivationSpecificKeys(
  motivation: LearningMotivation,
  timeOfDay: 'morning' | 'evening',
): MessageKey[] {
  // Her motivasyon için 3'er mesaj var (sabah + akşam)
  // i18n'de şu pattern'le: smartReminder.travel_morning_1, travel_evening_1 vs.
  const keys: MessageKey[] = [];
  for (let i = 1; i <= 3; i++) {
    keys.push(`smartReminder.${motivation}_${timeOfDay}_${i}` as MessageKey);
  }
  return keys;
}

// ─── Kullanıcıya kişisel mesaj (özet ekranı için) ───
// Birden fazla motivasyon varsa hepsini birleştiren bir tone oluşturur.
export function getPrimaryMotivation(motivations: string[]): string | null {
  if (motivations.length === 0) return null;
  // İlk seçim genelde en önemlisi
  return motivations[0];
}

// ─── A2'ye geçiş süresi tahmini ───
// Günlük hedef XP'sine göre kaç günde A2'ye geçileceği hesaplanır.
// A1 toplam ders sayısı: ~24, ders başı ortalama 100 XP → ~2400 XP
// Ama gerçekçi tahmin için biraz buffer ekleyelim (eksik gün vs.)
export function estimateTimeToA2(dailyXpGoal: number): {
  days: number;
  weeks: number;
  description: 'fast' | 'moderate' | 'slow';
} {
  const A1_TOTAL_XP = 2400;
  const realisticDailyXp = dailyXpGoal * 0.85; // %15 buffer (eksik günler için)
  const days = Math.ceil(A1_TOTAL_XP / Math.max(1, realisticDailyXp));
  const weeks = Math.ceil(days / 7);

  let description: 'fast' | 'moderate' | 'slow';
  if (weeks <= 6) description = 'fast';
  else if (weeks <= 12) description = 'moderate';
  else description = 'slow';

  return { days, weeks, description };
}

// ─── Helpers ───
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
