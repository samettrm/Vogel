import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CEFRLevel, ExerciseType, LanguageCode } from '../types';
import type { PlanId } from '../services/purchases';
import { ACHIEVEMENTS } from '../data/achievements';
import { ALL_COURSES } from '../data/courses';

// ⏱ Kalp yenileme aralığı (dakika)
// Production: 300dk (5 saat) / kalp. Test için 1 yapabilirsin.
export const HEART_REFILL_MINUTES = 300;
export const HEART_REFILL_MS = HEART_REFILL_MINUTES * 60 * 1000;

// 🔥 Streak milestone'ları — bu günlere ulaşınca özel kutlama ekranı gösterilir.
// Mevcut/extendable: yeni milestone eklemek istersen buraya sayı ekle.
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

function isStreakMilestone(n: number): n is StreakMilestone {
  return (STREAK_MILESTONES as readonly number[]).includes(n);
}

export interface LeagueCompetitor {
  id: string;
  name: string;
  xp: number;
  isUser?: boolean;
  avatar: string;
}

export interface ReviewItem {
  id: string;
  courseId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  sourceText: string;
  targetText: string;
  wrongCount: number;
  correctCount: number;
  correctStreak: number;
  strength: number;
  repetitions: number;
  interval: number;
  easeFactor: number;
  lastAnsweredAt: number;
  nextReviewAt: number;
}

export type ReviewResultPayload = {
  id: string;
  courseId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  sourceText: string;
  targetText: string;
};

// 🎯 GÜNLÜK GÖREV SİSTEMİ — retention motoru.
// Her gün 3 random görev üretilir, kullanıcı oynadıkça ilerler.
// Tamamlanan görev "claimed" olarak işaretlenip ödül XP'si verilir.
export type QuestType = 'completeLesson' | 'earnXp' | 'correctAnswers';

export interface DailyQuest {
  id: string;
  type: QuestType;
  target: number;
  progress: number;
  rewardXp: number;
  claimed: boolean;
  label: string;
  emoji: string;
}

// 🔥 TERTEMİZ ARABİRİM (Mükerrer alanlar tekilleştirildi, kayıp lessonExerciseProgress eklendi)
interface UserState {
  activeCourse: {
    source: LanguageCode;
    target: LanguageCode;
    level: CEFRLevel;
  };
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  lastStudyDate: string | null;
  nextHeartRefillAt: number | null;
  completedLessons: Set<string>;
  hasHydrated: boolean;
  reviewItems: Record<string, ReviewItem>;
  lessonExerciseProgress: Record<string, Record<string, 'correct' | 'wrong'>>;
  // 🆕 Kullanıcının ilk kez gördüğü kelimeler — çoktan seçmeli egzersizde
  // "YENİ" rozeti, bir kelime ilk kez çıktığında gösterilir.
  seenWords: string[];
  currentLeague: string;
  leagueCompetitors: LeagueCompetitor[];
  leagueEndDate: number;
  isPremium: boolean;
  activePlanId: PlanId | null;

  // ONBOARDING
  // 🚨 İKİ FLAG MİMARİSİ (2026-05-30 — AI consensus):
  //   onboardingCompleted: Tüm onboarding flow'unu (welcome → goal → notif → summary) tamamladı mı?
  //   hasCompletedPlacement: Placement step'inde "Sıfırdan başla" veya seviye testi seçti mi?
  //
  // Map'e erişim KURALI: HER İKİSİ DE === true olmalı.
  // undefined / null / missing → ASLA completed kabul edilmez.
  //
  // Bu iki ayrı flag, "iCloud restore" veya "lesson progress yanlış yorum"
  // gibi sahte completion senaryolarını engeller.
  onboardingCompleted: boolean;
  hasCompletedPlacement: boolean;
  // Kullanıcı bir kere giriş yaptıysa true. Logout sonrası clearLocalProgress
  // bunu BOZMAZ → AuthGuard misafir mod yerine login zorlar.
  // (Duolingo paterni: bir kere hesap açtın mı, artık geri dönemezsin.)
  hasEverSignedIn: boolean;
  dailyXpGoal: number;
  // Kullanıcının motivasyonları (çoklu seçim, 1-3 arası).
  // Öneri algoritması, bildirim mesajları ve kutlama tonlarını etkiler.
  // Olası değerler: 'travel' | 'work' | 'family' | 'media' | 'academic' | 'curious'
  learningMotivations: string[];

  // HARITA SEVIYE SECIMI
  selectedLevel: CEFRLevel;

  // TEMA + DIL (UI ayarlari)
  themeMode: 'dark' | 'light';
  language: 'tr' | 'en';

  // SES + HAPTIC ayarları
  soundEnabled: boolean;
  hapticEnabled: boolean;

  // 🏆 Başarımlar
  achievementsUnlocked: Set<string>;
  // Toast için transient (persist edilmez)
  recentlyUnlocked: string | null;
  hasFirstPurchase: boolean;
  hasPerfectLesson: boolean;

  // 🌟 Seviye atlama — LevelUpScreen tetikleyici
  // lastShownLevel: en son gösterilen level. Hesaplanan level (xp/100 + 1) > lastShownLevel
  // olduğunda LevelUpScreen tetiklenir.
  lastShownLevel: number;
  // Transient: pending level-up var mı? (persist edilmez)
  pendingLevelUp: number | null;

  // 🔥 Transient: streak milestone bekliyor mu? (persist edilmez)
  // registerStudySession sonrası milestone günlerine ulaşılırsa set edilir.
  // StreakMilestoneScreen bunu okur ve dismissPendingStreakMilestone ile kapatılır.
  pendingStreakMilestone: number | null;

  // 🔔 Akıllı hatırlatma bildirimleri
  reminderEnabled: boolean;
  // Son schedule zamanı — 24 saatten eskiyse app açılışında yenilenir
  lastReminderScheduledAt: number | null;

  // 🎯 Günlük görevler
  dailyQuests: DailyQuest[];
  dailyQuestsDate: string | null;

  addXp: (amount: number) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  applyHeartRefills: () => void;
  completeLesson: (lessonId: string) => void;
  registerStudySession: () => void;
  setActiveCourse: (
    source: LanguageCode,
    target: LanguageCode,
    level: CEFRLevel,
  ) => void;
  setHasHydrated: (value: boolean) => void;
  resetProgressForTesting: () => void;
  buyKupaPackage: (amount: number) => void;
  recordReviewResult: (payload: ReviewResultPayload, isCorrect: boolean) => void;
  setExerciseResult: (lessonId: string, exerciseId: string, result: 'correct' | 'wrong') => void;
  markWordSeen: (word: string) => void;
  getDueReviewItems: () => ReviewItem[];
  resetReviewItems: () => void;
  checkLeagueStatus: () => void;
  makePremium: (planId?: PlanId) => void;
  // IAP: n adet can ekle (max'ta kesilebilir)
  addHearts: (n: number) => void;
  // IAP: RC'den gelen premium durumunu store'a yaz (app açılışı senkronizasyonu)
  setPremium: (value: boolean) => void;

  // ONBOARDING actions
  completeOnboarding: (dailyGoal: number) => void;
  setLearningMotivations: (motivations: string[]) => void;

  // HARITA SEVIYE
  setSelectedLevel: (level: CEFRLevel) => void;

  // TEMA + DIL setters
  setThemeMode: (mode: 'dark' | 'light') => void;
  setLanguage: (lang: 'tr' | 'en') => void;

  // SES + HAPTIC setters
  setSoundEnabled: (v: boolean) => void;
  setHapticEnabled: (v: boolean) => void;

  // 🎯 Placement setter — onboarding step 1'de scratch veya placement test seçince true yapılır
  setHasCompletedPlacement: (v: boolean) => void;

  // 🎯 Quest actions
  refreshDailyQuestsIfNeeded: () => void;
  incrementQuestProgress: (type: QuestType, delta: number) => void;
  claimQuestReward: (questId: string) => void;

  // 🏆 Achievement actions
  checkAndUnlockAchievements: (opts?: { perfectLesson?: boolean; firstPurchase?: boolean }) => string[];
  dismissRecentlyUnlocked: () => void;

  // 🌟 Level-up actions
  checkLevelUp: () => void;
  dismissPendingLevelUp: () => void;

  // 🔥 Streak milestone actions
  dismissPendingStreakMilestone: () => void;

  // 🔔 Reminder actions
  setReminderEnabled: (enabled: boolean) => void;
  setLastReminderScheduledAt: (timestamp: number | null) => void;
}

type SerializedSet = {
  __type: 'Set';
  value: string[];
};

function isSerializedSet(value: unknown): value is SerializedSet {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { __type?: unknown; value?: unknown };
  return candidate.__type === 'Set' && Array.isArray(candidate.value);
}

function normalizeCompletedLessons(value: unknown): Set<string> {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  if (isSerializedSet(value)) return new Set(value.value);
  return new Set<string>();
}

function normalizeReviewItems(value: unknown): Record<string, ReviewItem> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, ReviewItem>;

  const cleaned: Record<string, ReviewItem> = {};
  for (const [id, item] of Object.entries(raw)) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.wrongCount === 'number' &&
      item.wrongCount > 0
    ) {
      cleaned[id] = item;
    }
  }
  return cleaned;
}

function normalizeLessonProgress(value: unknown): Record<string, Record<string, 'correct' | 'wrong'>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Record<string, 'correct' | 'wrong'>>;
}

function createInitialCompetitors(userXp: number): LeagueCompetitor[] {
  return [
    { id: 'user', name: 'Sen', xp: userXp, isUser: true, avatar: '🦅' },
    { id: 'bot-1', name: 'Anna', xp: 620, avatar: '🦊' },
    { id: 'bot-2', name: 'Max', xp: 540, avatar: '🐻' },
    { id: 'bot-3', name: 'Lena', xp: 430, avatar: '🐼' },
    { id: 'bot-4', name: 'Jonas', xp: 350, avatar: '🐸' },
  ].sort((a, b) => b.xp - a.xp);
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

// SRS zamanlama yardımcısı — ileri faz (SM-2 entegrasyonu) için hazır
function _getNextReviewDelayMs(isCorrect: boolean, nextStrength: number): number {
  if (!isCorrect) return 0;
  if (nextStrength <= 1) return 10 * 60 * 1000;
  if (nextStrength === 2) return 60 * 60 * 1000;
  if (nextStrength === 3) return 6 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

// 🧠 SM-2 (SuperMemo) algoritması — Spaced Repetition
//
// Klasik SM-2'nin sadeleştirilmiş binary versiyonu:
//   - Doğru cevap → quality = 4 (doğru ama biraz tereddtlü)
//   - Yanlış cevap → quality = 2 (yanlış, ama hatırlamaya çalıştı)
//
// Algoritma her kelimeye 3 metrik atar:
//   - repetitions: kaç kez üst üste doğru yanıtlandı
//   - interval: bir sonraki tekrar için gün sayısı
//   - easeFactor: "kolaylık katsayısı" — zorlandığya kelimelerde düşer, kolaylarda yükselir
//
// Hesaplama:
//   Doğru cevap:
//     repetitions += 1
//     interval: 1 → 6 → prev * easeFactor
//     easeFactor: max(1.3, ef + 0.1)
//   Yanlış cevap:
//     repetitions = 0
//     interval = 1 (gün)
//     easeFactor: max(1.3, ef - 0.2)
//
// Sonuç: zorlanılan kelimeler sık tekrarlanır, kolaylar uzun aralıklarla.
function applySM2(
  existing: ReviewItem | undefined,
  isCorrect: boolean,
): { repetitions: number; interval: number; easeFactor: number; nextReviewAt: number } {
  const now = Date.now();
  const prevRep = existing?.repetitions ?? 0;
  const prevInt = existing?.interval ?? 1;
  const prevEf = existing?.easeFactor ?? 2.5;

  let repetitions: number;
  let intervalDays: number;
  let easeFactor: number;

  if (isCorrect) {
    repetitions = prevRep + 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(prevInt * prevEf));
    }
    easeFactor = Math.min(3.0, prevEf + 0.1);
  } else {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, prevEf - 0.2);
  }

  const nextReviewAt = now + intervalDays * 24 * 60 * 60 * 1000;
  return { repetitions, interval: intervalDays, easeFactor, nextReviewAt };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      activeCourse: {
        source: 'tr',
        target: 'de',
        level: 'A1',
      },
      xp: 0,
      hearts: 5,
      maxHearts: 5,
      streak: 0,
      lastStudyDate: null,
      nextHeartRefillAt: null,
      completedLessons: new Set<string>(),
      hasHydrated: false,
      reviewItems: {},
      lessonExerciseProgress: {},
      seenWords: [],
      dailyQuests: [],
      dailyQuestsDate: null,
      achievementsUnlocked: new Set<string>(),
      recentlyUnlocked: null,
      hasFirstPurchase: false,
      hasPerfectLesson: false,
      lastShownLevel: 1,
      pendingLevelUp: null,
      pendingStreakMilestone: null,
      reminderEnabled: false,
      lastReminderScheduledAt: null,
      currentLeague: 'Bronz Lig',
      leagueCompetitors: createInitialCompetitors(0),
      leagueEndDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      isPremium: false,
      activePlanId: null,
      // Fresh install'da HER İKİSİ DE false → Map entry guard /onboarding'e
      // yönlendirir. completeOnboarding() çağrılınca ikisi de true yapılır
      // ve map render olur. Sonraki açılışlarda persist'ten true gelir.
      onboardingCompleted: false,
      hasCompletedPlacement: false,
      hasEverSignedIn: false,
      dailyXpGoal: 30,
      learningMotivations: [],
      selectedLevel: 'A1',
      themeMode: 'dark',
      language: 'tr',
      soundEnabled: true,
      hapticEnabled: true,

      addXp: (amount) =>
        set((state) => {
          const safeAmount = Math.max(0, amount);
          const nextXp = state.xp + safeAmount;
          return {
            xp: nextXp,
            leagueCompetitors: state.leagueCompetitors
              .map((competitor) =>
                competitor.isUser
                  ? { ...competitor, xp: competitor.xp + safeAmount }
                  : competitor,
              )
              .sort((a, b) => b.xp - a.xp),
          };
        }),

      loseHeart: () =>
        set((state) => {
          if (state.isPremium) return {};
          const nextHearts = Math.max(0, state.hearts - 1);
          return {
            hearts: nextHearts,
            nextHeartRefillAt:
              nextHearts >= state.maxHearts
                ? null
                : state.nextHeartRefillAt ?? Date.now() + HEART_REFILL_MS,
          };
        }),

      refillHearts: () =>
        set((state) => {
          if (state.xp < 450) return {};
          return {
            hearts: state.maxHearts,
            xp: state.xp - 450,
            nextHeartRefillAt: null,
          };
        }),

      applyHeartRefills: () =>
        set((state) => {
          if (state.isPremium) {
            return {
              hearts: state.maxHearts,
              nextHeartRefillAt: null,
            };
          }
          if (
            state.nextHeartRefillAt === null ||
            state.hearts >= state.maxHearts
          ) {
            return {};
          }
          const now = Date.now();
          if (now < state.nextHeartRefillAt) {
            return {};
          }
          const extraRefills = Math.floor(
            (now - state.nextHeartRefillAt) / HEART_REFILL_MS,
          );
          const refillCount = 1 + extraRefills;
          const nextHearts = Math.min(
            state.maxHearts,
            state.hearts + refillCount,
          );
          return {
            hearts: nextHearts,
            nextHeartRefillAt:
              nextHearts >= state.maxHearts
                ? null
                : state.nextHeartRefillAt + refillCount * HEART_REFILL_MS,
          };
        }),

      completeLesson: (lessonId) =>
        set((state) => {
          const nextCompletedLessons = new Set(state.completedLessons);
          nextCompletedLessons.add(lessonId);
          return {
            completedLessons: nextCompletedLessons,
          };
        }),

      registerStudySession: () =>
        set((state) => {
          const today = getTodayKey();
          if (state.lastStudyDate === today) {
            return {};
          }
          const yesterday = getYesterdayKey();
          const nextStreak = state.lastStudyDate === yesterday ? state.streak + 1 : 1;
          // Milestone gününe ulaşılırsa özel ekran tetikle
          const milestone = isStreakMilestone(nextStreak) ? nextStreak : null;
          return {
            streak: nextStreak,
            lastStudyDate: today,
            ...(milestone !== null ? { pendingStreakMilestone: milestone } : {}),
          };
        }),

      setActiveCourse: (source, target, level) =>
        set({
          activeCourse: {
            source,
            target,
            level,
          },
        }),

      setHasHydrated: (value) =>
        set({
          hasHydrated: value,
        }),

      resetProgressForTesting: () =>
        set({
          xp: 0,
          hearts: 5,
          maxHearts: 5,
          streak: 0,
          lastStudyDate: null,
          nextHeartRefillAt: null,
          completedLessons: new Set<string>(),
          reviewItems: {},
          lessonExerciseProgress: {},
          seenWords: [],
          currentLeague: 'Bronz Lig',
          leagueCompetitors: createInitialCompetitors(0),
          leagueEndDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
          isPremium: false,
          onboardingCompleted: false,
          hasCompletedPlacement: false,
          dailyXpGoal: 30,
          learningMotivations: [],
          dailyQuests: [],
          dailyQuestsDate: null,
          achievementsUnlocked: new Set<string>(),
          recentlyUnlocked: null,
          hasFirstPurchase: false,
          hasPerfectLesson: false,
          lastShownLevel: 1,
          pendingLevelUp: null,
          pendingStreakMilestone: null,
          reminderEnabled: false,
          lastReminderScheduledAt: null,
        }),

      buyKupaPackage: (amount) => {
        get().addXp(amount);
      },

      recordReviewResult: (payload, isCorrect) =>
        set((state) => {
          const existing = state.reviewItems[payload.id];
          if (isCorrect && !existing) {
            return state;
          }
          const now = Date.now();
          const previousStrength = existing?.strength ?? 0;
          const nextStrength = isCorrect ? Math.min(5, previousStrength + 1) : 0;
          const nextCorrectStreak = isCorrect ? (existing?.correctStreak ?? 0) + 1 : 0;

          // 🎓 Kelime "öğrenildi" — strength 5 + 3 ardarda doğru
          if (isCorrect && nextCorrectStreak >= 3 && nextStrength >= 5) {
            const remaining = { ...state.reviewItems };
            delete remaining[payload.id];
            return { reviewItems: remaining };
          }

          // 🧠 SM-2 algoritması ile sonraki tekrar zamanını hesapla
          const sm2 = applySM2(existing, isCorrect);

          const nextItem: ReviewItem = {
            id: payload.id,
            courseId: payload.courseId,
            exerciseId: payload.exerciseId,
            exerciseType: payload.exerciseType,
            sourceText: payload.sourceText,
            targetText: payload.targetText,
            wrongCount: (existing?.wrongCount ?? 0) + (isCorrect ? 0 : 1),
            correctCount: (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0),
            correctStreak: nextCorrectStreak,
            strength: nextStrength,
            repetitions: sm2.repetitions,
            interval: sm2.interval,
            easeFactor: sm2.easeFactor,
            lastAnsweredAt: now,
            nextReviewAt: sm2.nextReviewAt,
          };

          return {
            reviewItems: {
              ...state.reviewItems,
              [payload.id]: nextItem,
            },
          };
        }),

      setExerciseResult: (lessonId, exerciseId, result) =>
        set((state) => {
          const currentLessonProgress = state.lessonExerciseProgress[lessonId] ?? {};
          return {
            lessonExerciseProgress: {
              ...state.lessonExerciseProgress,
              [lessonId]: {
                ...currentLessonProgress,
                [exerciseId]: result,
              },
            },
          };
        }),

      markWordSeen: (word) =>
        set((state) =>
          state.seenWords.includes(word)
            ? {}
            : { seenWords: [...state.seenWords, word] },
        ),

      getDueReviewItems: () => {
        const now = Date.now();
        return Object.values(get().reviewItems ?? {})
          .filter((item) => item.wrongCount > 0 && item.nextReviewAt <= now)
          .sort((a, b) => {
            if (a.strength !== b.strength) return a.strength - b.strength;
            if (a.wrongCount !== b.wrongCount) return b.wrongCount - a.wrongCount;
            return a.nextReviewAt - b.nextReviewAt;
          });
      },

      resetReviewItems: () =>
        set({
          reviewItems: {},
        }),

      checkLeagueStatus: () =>
        set((state) => {
          if (Date.now() < state.leagueEndDate) return {};
          return {
            currentLeague: 'Bronz Lig',
            leagueCompetitors: createInitialCompetitors(state.xp),
            leagueEndDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
          };
        }),

      makePremium: (planId) =>
        set((state) => ({
          isPremium: true,
          activePlanId: planId ?? state.activePlanId,
          hearts: state.maxHearts,
          nextHeartRefillAt: null,
        })),

      addHearts: (n) =>
        set((state) => {
          const next = Math.min(state.maxHearts, state.hearts + n);
          return {
            hearts: next,
            nextHeartRefillAt: next >= state.maxHearts ? null : state.nextHeartRefillAt,
          };
        }),

      setPremium: (value) =>
        set((state) => ({
          isPremium: value,
          ...(value
            ? { hearts: state.maxHearts, nextHeartRefillAt: null }
            : {}),
        })),

      // ONBOARDING
      // İki flag de true yapılır — user tüm flow'u tamamladı + placement geçti
      completeOnboarding: (dailyGoal) =>
        set({
          onboardingCompleted: true,
          hasCompletedPlacement: true,
          dailyXpGoal: Math.max(10, Math.min(100, dailyGoal)),
        }),

      // Motivasyonlar — onboarding step 2'de çoklu seçim (en az 1, en fazla 3)
      // Etki: smart reminders, recommended lesson scoring, kişisel mesajlar
      setLearningMotivations: (motivations) =>
        set({ learningMotivations: motivations.slice(0, 3) }),

      // HARITA SEVIYE
      setSelectedLevel: (level) =>
        set({
          selectedLevel: level,
        }),

      // TEMA
      setThemeMode: (mode) =>
        set({
          themeMode: mode,
        }),

      // DIL
      setLanguage: (lang) =>
        set({
          language: lang,
        }),

      // SES + HAPTIC
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setHapticEnabled: (v) => set({ hapticEnabled: v }),
      setHasCompletedPlacement: (v) => set({ hasCompletedPlacement: v }),

      // ──────────────────────────────────────────────────────────────────
      // 🎯 DAILY QUESTS — günlük görev sistemi
      // ──────────────────────────────────────────────────────────────────
      refreshDailyQuestsIfNeeded: () => {
        const today = getTodayKey();
        const state = get();
        if (state.dailyQuestsDate === today && state.dailyQuests.length > 0) {
          return;
        }

        // Sabit görev şablonları havuzu. Aynı tip içinden bir tane seçilir.
        const POOL: {
          type: QuestType;
          target: number;
          rewardXp: number;
          label: string;
          emoji: string;
        }[] = [
          { type: 'completeLesson', target: 1, rewardXp: 20, label: '1 ders tamamla', emoji: '📚' },
          { type: 'completeLesson', target: 3, rewardXp: 50, label: '3 ders tamamla', emoji: '📚' },
          { type: 'earnXp', target: 30, rewardXp: 15, label: '30 XP topla', emoji: '⚡' },
          { type: 'earnXp', target: 80, rewardXp: 35, label: '80 XP topla', emoji: '⚡' },
          { type: 'correctAnswers', target: 10, rewardXp: 20, label: '10 doğru cevap', emoji: '✅' },
          { type: 'correctAnswers', target: 25, rewardXp: 50, label: '25 doğru cevap', emoji: '✅' },
        ];

        // Karıştır + her tipten en fazla 1 al (çeşitlilik için)
        const shuffled = [...POOL].sort(() => Math.random() - 0.5);
        const typesUsed = new Set<QuestType>();
        const selected: typeof POOL = [];
        for (const q of shuffled) {
          if (typesUsed.has(q.type)) continue;
          selected.push(q);
          typesUsed.add(q.type);
          if (selected.length === 3) break;
        }

        const newQuests: DailyQuest[] = selected.map((q, i) => ({
          id: `quest-${today}-${i}`,
          type: q.type,
          target: q.target,
          progress: 0,
          rewardXp: q.rewardXp,
          claimed: false,
          label: q.label,
          emoji: q.emoji,
        }));

        set({ dailyQuests: newQuests, dailyQuestsDate: today });
      },

      incrementQuestProgress: (type, delta) =>
        set((state) => ({
          dailyQuests: state.dailyQuests.map((q) =>
            q.type === type && !q.claimed && q.progress < q.target
              ? { ...q, progress: Math.min(q.target, q.progress + delta) }
              : q,
          ),
        })),

      claimQuestReward: (questId) => {
        const state = get();
        const quest = state.dailyQuests.find((q) => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) return;

        set({
          dailyQuests: state.dailyQuests.map((q) =>
            q.id === questId ? { ...q, claimed: true } : q,
          ),
        });
        // Reward verilir — addXp çağrısı sonsuz döngü yaratmasın diye burada görev
        // ilerleme tetikleyici DEĞİL; düz state mutasyonu yapıyoruz.
        set((s) => ({ xp: s.xp + quest.rewardXp }));
      },

      // ────────────────────────────────────────────────────────────────
      // 🏆 ACHIEVEMENTS
      // Her ders tamamlandığında çağrılır. Yeni açılan rozet varsa Set'e ekler
      // ve recentlyUnlocked olarak set eder (toast göstermek için).
      // ────────────────────────────────────────────────────────────────
      checkAndUnlockAchievements: (opts) => {
        const state = get();
        // Flag'leri güncelle (perfect lesson, first purchase)
        const updates: Partial<UserState> = {};
        if (opts?.perfectLesson && !state.hasPerfectLesson) {
          updates.hasPerfectLesson = true;
        }
        if (opts?.firstPurchase && !state.hasFirstPurchase) {
          updates.hasFirstPurchase = true;
        }
        // Tamamlanan görev sayısı — dailyQuests'te claimed olan var mı
        const hasCompletedQuest = state.dailyQuests.some((q) => q.claimed);

        // Seviye tamamlama hesabı
        const levelCompletion: Record<string, boolean> = {};
        for (const course of ALL_COURSES) {
          const allLessonIds = course.units.flatMap((u) => u.lessons.map((l) => l.id));
          if (allLessonIds.length === 0) {
            levelCompletion[course.id] = false;
            continue;
          }
          levelCompletion[course.id] = allLessonIds.every((id) => state.completedLessons.has(id));
        }

        const achievementState = {
          xp: state.xp,
          streak: state.streak,
          completedLessonsSize: state.completedLessons.size,
          isPremium: state.isPremium,
          hasFirstPurchase: updates.hasFirstPurchase ?? state.hasFirstPurchase,
          hasCompletedQuest,
          hasPerfectLesson: updates.hasPerfectLesson ?? state.hasPerfectLesson,
          levelCompletion,
        };

        const newlyUnlocked: string[] = [];
        const nextUnlocked = new Set(state.achievementsUnlocked);
        for (const ach of ACHIEVEMENTS) {
          if (nextUnlocked.has(ach.id)) continue;
          if (ach.check(achievementState)) {
            nextUnlocked.add(ach.id);
            newlyUnlocked.push(ach.id);
          }
        }

        if (newlyUnlocked.length > 0 || Object.keys(updates).length > 0) {
          set({
            ...updates,
            achievementsUnlocked: nextUnlocked,
            recentlyUnlocked: newlyUnlocked[0] ?? state.recentlyUnlocked,
          });
        }
        return newlyUnlocked;
      },

      dismissRecentlyUnlocked: () => set({ recentlyUnlocked: null }),

      // ────────────────────────────────────────────────────────────────
      // 🌟 LEVEL UP — XP / 100 + 1 formülüyle hesaplanan level lastShownLevel'ı
      // geçince LevelUpScreen tetiklenir. Lesson screen finishLesson sonrası çağırır.
      // ────────────────────────────────────────────────────────────────
      checkLevelUp: () => {
        const state = get();
        const currentLevel = Math.floor(state.xp / 100) + 1;
        if (currentLevel > state.lastShownLevel) {
          set({
            lastShownLevel: currentLevel,
            pendingLevelUp: currentLevel,
          });
        }
      },

      dismissPendingLevelUp: () => set({ pendingLevelUp: null }),

      // 🔥 Streak milestone ekranını kapat
      dismissPendingStreakMilestone: () => set({ pendingStreakMilestone: null }),

      // ────────────────────────────────────────────────────────────────
      // 🔔 REMINDERS — Settings'ten kontrol edilir.
      // Gerçek scheduling utility içinde (src/utils/notifications.ts).
      // Paket (expo-notifications) kurulu değilse no-op olur.
      // ────────────────────────────────────────────────────────────────
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
      setLastReminderScheduledAt: (timestamp) => set({ lastReminderScheduledAt: timestamp }),
    }),
    {
      name: 'vogel-user-storage',
      version: 13,
      storage: createJSONStorage(() => AsyncStorage, {
        replacer: (_key, value) => {
          if (value instanceof Set) {
            return {
              __type: 'Set',
              value: Array.from(value),
            };
          }
          return value;
        },
        reviver: (_key, value) => {
          if (isSerializedSet(value)) {
            return new Set(value.value);
          }
          return value;
        },
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<UserState>;
        console.log('[MIGRATE]', {
          hasPersistedState: persistedState !== undefined && persistedState !== null,
          onboardingCompletedInPersist: state?.onboardingCompleted,
          hasCompletedPlacementInPersist: (state as any)?.hasCompletedPlacement,
          xpInPersist: state?.xp,
          completedLessonsCount: state?.completedLessons ? (Array.isArray(state.completedLessons) ? state.completedLessons.length : 'set/other') : 0,
          timestamp: Date.now(),
        });
        // 🔧 BUG FIX: eski versiyonlarda activeCourse.level yoktu — 'A1' default ata
        const existingActiveCourse = state.activeCourse as { source?: LanguageCode; target?: LanguageCode; level?: CEFRLevel } | undefined;
        const normalizedActiveCourse = {
          source: (existingActiveCourse?.source ?? 'tr') as LanguageCode,
          target: (existingActiveCourse?.target ?? 'de') as LanguageCode,
          level: (existingActiveCourse?.level ?? state.selectedLevel ?? 'A1') as CEFRLevel,
        };
        return {
          ...state,
          activeCourse: normalizedActiveCourse,
          // 🔒 STRICT: onboarding flag'leri sadece literal true ise true kabul edilir
          // undefined/null/missing → false (kullanıcı onboarding'e gönderilir)
          onboardingCompleted: state.onboardingCompleted === true,
          hasCompletedPlacement: (state as { hasCompletedPlacement?: boolean }).hasCompletedPlacement === true,
          completedLessons: normalizeCompletedLessons(state.completedLessons),
          reviewItems: normalizeReviewItems(state.reviewItems),
          lessonExerciseProgress: normalizeLessonProgress(state.lessonExerciseProgress),
          seenWords: Array.isArray(state.seenWords) ? state.seenWords : [],
          lastStudyDate: state.lastStudyDate ?? null,
          streak: state.streak ?? 0,
          xp: state.xp ?? 0,
          hearts: state.hearts ?? 5,
          maxHearts: state.maxHearts ?? 5,
          leagueCompetitors: state.leagueCompetitors ?? createInitialCompetitors(state.xp ?? 0),
          currentLeague: state.currentLeague ?? 'Bronz Lig',
          leagueEndDate: state.leagueEndDate ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
          isPremium: state.isPremium ?? false,
          dailyQuests: Array.isArray(state.dailyQuests) ? state.dailyQuests : [],
          dailyQuestsDate: typeof state.dailyQuestsDate === 'string' ? state.dailyQuestsDate : null,
          achievementsUnlocked: normalizeCompletedLessons(state.achievementsUnlocked as unknown),
          hasFirstPurchase: (state as { hasFirstPurchase?: boolean }).hasFirstPurchase ?? false,
          hasPerfectLesson: (state as { hasPerfectLesson?: boolean }).hasPerfectLesson ?? false,
          lastShownLevel: (state as { lastShownLevel?: number }).lastShownLevel ?? Math.floor((state.xp ?? 0) / 100) + 1,
          pendingLevelUp: null,
          pendingStreakMilestone: null,
          reminderEnabled: (state as { reminderEnabled?: boolean }).reminderEnabled ?? false,
          lastReminderScheduledAt: (state as { lastReminderScheduledAt?: number | null }).lastReminderScheduledAt ?? null,
          // Migration: eski tekli motivasyondan çoklu diziye dönüştür
          learningMotivations: (() => {
            const newField = (state as { learningMotivations?: string[] }).learningMotivations;
            if (Array.isArray(newField)) return newField;
            const oldField = (state as { learningMotivation?: string | null }).learningMotivation;
            return oldField ? [oldField] : [];
          })(),
          recentlyUnlocked: null,
          hasHydrated: false,
          soundEnabled: (state as { soundEnabled?: boolean }).soundEnabled ?? true,
          hapticEnabled: (state as { hapticEnabled?: boolean }).hapticEnabled ?? true,
        };
      },
      partialize: (state) => ({
        activeCourse: state.activeCourse,
        xp: state.xp,
        hearts: state.hearts,
        maxHearts: state.maxHearts,
        streak: state.streak,
        lastStudyDate: state.lastStudyDate,
        nextHeartRefillAt: state.nextHeartRefillAt,
        completedLessons: state.completedLessons,
        reviewItems: state.reviewItems,
        lessonExerciseProgress: state.lessonExerciseProgress,
        seenWords: state.seenWords,
        dailyQuests: state.dailyQuests,
        dailyQuestsDate: state.dailyQuestsDate,
        currentLeague: state.currentLeague,
        leagueCompetitors: state.leagueCompetitors,
        leagueEndDate: state.leagueEndDate,
        isPremium: state.isPremium,
        onboardingCompleted: state.onboardingCompleted,
        hasCompletedPlacement: state.hasCompletedPlacement,
        hasEverSignedIn: state.hasEverSignedIn,
        dailyXpGoal: state.dailyXpGoal,
        learningMotivations: state.learningMotivations,
        selectedLevel: state.selectedLevel,
        themeMode: state.themeMode,
        language: state.language,
        soundEnabled: state.soundEnabled,
        hapticEnabled: state.hapticEnabled,
        // 🏆 Achievements persist
        achievementsUnlocked: state.achievementsUnlocked,
        hasFirstPurchase: state.hasFirstPurchase,
        hasPerfectLesson: state.hasPerfectLesson,
        lastShownLevel: state.lastShownLevel,
        reminderEnabled: state.reminderEnabled,
        lastReminderScheduledAt: state.lastReminderScheduledAt,
        // recentlyUnlocked + pendingLevelUp persist edilmez (transient)
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<UserState>;
        console.log('[MERGE]', {
          hasPersistedState: persistedState !== undefined && persistedState !== null,
          onboardingCompletedInPersist: state?.onboardingCompleted,
          hasCompletedPlacementInPersist: state?.hasCompletedPlacement,
          onboardingCompletedInCurrent: currentState?.onboardingCompleted,
          hasCompletedPlacementInCurrent: currentState?.hasCompletedPlacement,
          xpInPersist: state?.xp,
          timestamp: Date.now(),
        });

        const rawCompleted = normalizeCompletedLessons(state.completedLessons);
        const lessonProgress = normalizeLessonProgress(
          state.lessonExerciseProgress,
        );

        // 🩹 SELF-HEALING — eski buggy versiyonda yanlış cevaplı dersler de
        // completedLessons'a ekleniyordu. Burada her hydration'da o bozuk
        // kayıtları temizliyoruz: bir ders completed olarak işaretli AMA
        // lessonExerciseProgress'inde herhangi bir 'wrong' kayıt varsa,
        // o ders henüz gerçekten tamamlanmamış demektir → setten çıkar.
        // İdempotent: temiz state'de hiçbir şey yapmaz, sadece bozukları temizler.
        const healedCompleted = new Set(rawCompleted);
        for (const lessonId of rawCompleted) {
          const progress = lessonProgress[lessonId];
          if (!progress) continue;
          const hasWrongs = Object.values(progress).some(
            (v) => v === 'wrong',
          );
          if (hasWrongs) {
            healedCompleted.delete(lessonId);
          }
        }

        return {
          ...currentState,
          ...state,
          // 🔒 STRICT: onboarding flag'leri sadece literal true ise true kabul edilir.
          //   undefined/null/missing/false → false (kullanıcı onboarding'e gönderilir)
          //   Bu spread'in SONRA çağrıldığından emin ol — yukarıdaki ...state'in
          //   undefined değerini override eder.
          onboardingCompleted: state?.onboardingCompleted === true,
          hasCompletedPlacement: state?.hasCompletedPlacement === true,
          completedLessons: healedCompleted,
          reviewItems: normalizeReviewItems(state.reviewItems),
          lessonExerciseProgress: lessonProgress,
          lastStudyDate: state.lastStudyDate ?? null,
          achievementsUnlocked: normalizeCompletedLessons(state.achievementsUnlocked as unknown),
          recentlyUnlocked: null,
          pendingLevelUp: null,
          pendingStreakMilestone: null,
          hasHydrated: false,
        };
      },
      // 🚨 CRITICAL BUG FIX (2026-05-30):
      //
      // Fresh install'da AsyncStorage BOŞ. Zustand persist v5'te:
      //   - getItem('vogel-user-storage') → null döner
      //   - Hidrasyon "rehydrate edecek bir şey yok" der
      //   - onRehydrateStorage callback'i state=undefined ile fire eder
      //   - state?.setHasHydrated(true) → optional chaining → NO-OP
      //   - hasHydrated SONSUZA KADAR false kalır
      //   - OnboardingGuard "!hasHydrated" check'inde takılır
      //   - User Map ekranında kalır (default route render olur)
      //
      // SYMPTOM (eski davranış):
      //   Fresh install → Map (yanlış — onboarding olmalıydı)
      //   3-4 kez aç kapat → hala Map
      //   1 lesson cevabı ver → bu setState AsyncStorage'a yazıyor
      //   Bir sonraki açılışta artık veri VAR → state undefined değil →
      //   setHasHydrated(true) çalışır → onboardingCompleted=false görür →
      //   /onboarding'e redirect EDER (geç de olsa)
      //
      // FIX: Direkt useUserStore.setState({ hasHydrated: true }) çağır.
      //      `state` parametresine güvenme. Bu, AsyncStorage boş bile olsa
      //      hidrasyon "tamamlandı" olarak işaretlenir.
      onRehydrateStorage: () => (state, error) => {
        console.log('[REHYDRATE_COMPLETE]', {
          stateDefined: state !== undefined && state !== null,
          hasOnboardingCompletedInState: state && 'onboardingCompleted' in state,
          onboardingCompletedValue: state?.onboardingCompleted,
          error: error?.message,
          timestamp: Date.now(),
        });
        useUserStore.setState({ hasHydrated: true });
        if (error) {
          console.warn('[Persist] hydration error:', error);
        }
      },
    },
  ),
);