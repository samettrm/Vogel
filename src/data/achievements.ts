import type { MessageKey } from '../i18n';

// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS — Başarım Rozetleri
//
// Her rozet: id, ikon, başlık/açıklama (i18n), check fonksiyonu (state).
// Yeni rozet eklemek için: bu listeye yeni AchievementDefinition ekle.
// ════════════════════════════════════════════════════════════════

export interface AchievementState {
  xp: number;
  streak: number;
  completedLessonsSize: number;
  isPremium: boolean;
  hasFirstPurchase: boolean;
  hasCompletedQuest: boolean;
  hasPerfectLesson: boolean;
  // Seviye tamamlama: course id'leri → tamam mı
  levelCompletion: Record<string, boolean>; // 'tr-de-a1' → true vs.
}

export interface AchievementDefinition {
  id: string;
  iconName: string; // Ionicons glyphMap
  titleKey: MessageKey;
  descKey: MessageKey;
  check: (s: AchievementState) => boolean;
  // Renk (rozet açıldığında parıltı için)
  color: 'neon' | 'gold' | 'purple' | 'cyan';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // İlk adımlar
  {
    id: 'first_lesson',
    iconName: 'footsteps',
    titleKey: 'achievements.firstLessonTitle',
    descKey: 'achievements.firstLessonDesc',
    check: (s) => s.completedLessonsSize >= 1,
    color: 'neon',
  },
  {
    id: 'ten_lessons',
    iconName: 'school',
    titleKey: 'achievements.tenLessonsTitle',
    descKey: 'achievements.tenLessonsDesc',
    check: (s) => s.completedLessonsSize >= 10,
    color: 'neon',
  },
  {
    id: 'fifty_lessons',
    iconName: 'medal',
    titleKey: 'achievements.fiftyLessonsTitle',
    descKey: 'achievements.fiftyLessonsDesc',
    check: (s) => s.completedLessonsSize >= 50,
    color: 'gold',
  },
  {
    id: 'hundred_lessons',
    iconName: 'trophy',
    titleKey: 'achievements.hundredLessonsTitle',
    descKey: 'achievements.hundredLessonsDesc',
    check: (s) => s.completedLessonsSize >= 100,
    color: 'gold',
  },
  // Seri
  {
    id: 'streak_3',
    iconName: 'flame-outline',
    titleKey: 'achievements.streak3Title',
    descKey: 'achievements.streak3Desc',
    check: (s) => s.streak >= 3,
    color: 'gold',
  },
  {
    id: 'streak_7',
    iconName: 'flame',
    titleKey: 'achievements.streak7Title',
    descKey: 'achievements.streak7Desc',
    check: (s) => s.streak >= 7,
    color: 'gold',
  },
  {
    id: 'streak_30',
    iconName: 'bonfire',
    titleKey: 'achievements.streak30Title',
    descKey: 'achievements.streak30Desc',
    check: (s) => s.streak >= 30,
    color: 'gold',
  },
  // XP
  {
    id: 'xp_100',
    iconName: 'star-outline',
    titleKey: 'achievements.xp100Title',
    descKey: 'achievements.xp100Desc',
    check: (s) => s.xp >= 100,
    color: 'cyan',
  },
  {
    id: 'xp_1000',
    iconName: 'star',
    titleKey: 'achievements.xp1000Title',
    descKey: 'achievements.xp1000Desc',
    check: (s) => s.xp >= 1000,
    color: 'cyan',
  },
  {
    id: 'xp_5000',
    iconName: 'sparkles',
    titleKey: 'achievements.xp5000Title',
    descKey: 'achievements.xp5000Desc',
    check: (s) => s.xp >= 5000,
    color: 'purple',
  },
  // Seviye tamamlama
  {
    id: 'a1_complete',
    iconName: 'ribbon',
    titleKey: 'achievements.a1CompleteTitle',
    descKey: 'achievements.a1CompleteDesc',
    check: (s) => s.levelCompletion['tr-de-a1'] === true,
    color: 'neon',
  },
  {
    id: 'a2_complete',
    iconName: 'ribbon',
    titleKey: 'achievements.a2CompleteTitle',
    descKey: 'achievements.a2CompleteDesc',
    check: (s) => s.levelCompletion['tr-de-a2'] === true,
    color: 'neon',
  },
  {
    id: 'b1_complete',
    iconName: 'ribbon',
    titleKey: 'achievements.b1CompleteTitle',
    descKey: 'achievements.b1CompleteDesc',
    check: (s) => s.levelCompletion['tr-de-b1'] === true,
    color: 'purple',
  },
  // Mükemmel ders
  {
    id: 'perfect_lesson',
    iconName: 'diamond',
    titleKey: 'achievements.perfectLessonTitle',
    descKey: 'achievements.perfectLessonDesc',
    check: (s) => s.hasPerfectLesson,
    color: 'cyan',
  },
  // Market
  {
    id: 'first_purchase',
    iconName: 'cart',
    titleKey: 'achievements.firstPurchaseTitle',
    descKey: 'achievements.firstPurchaseDesc',
    check: (s) => s.hasFirstPurchase,
    color: 'gold',
  },
  {
    id: 'premium',
    iconName: 'diamond-outline',
    titleKey: 'achievements.premiumTitle',
    descKey: 'achievements.premiumDesc',
    check: (s) => s.isPremium,
    color: 'purple',
  },
  // Görev
  {
    id: 'complete_quest',
    iconName: 'gift',
    titleKey: 'achievements.completeQuestTitle',
    descKey: 'achievements.completeQuestDesc',
    check: (s) => s.hasCompletedQuest,
    color: 'cyan',
  },
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
