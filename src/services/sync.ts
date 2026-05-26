import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseDb, isFirebaseConfigured } from '../config/firebase';
import { useUserStore } from '../store/useUserStore';
import {
  getLearnedWords,
  setLearnedWords,
  getExamScores,
  setExamScores,
  type LearnedWord,
} from '../../lib/storage';

// ════════════════════════════════════════════════════════════════
// SYNC SERVİSİ — Firestore ↔ Yerel depolama
//
// Şema: /users/{uid}/data/progress
//
// Merge stratejisi (veri kaybını önler):
//   Sayılar   → max al (en büyük değer kazanır)
//   Listeler  → union (birleştir, tekrarları sil)
//   Boolean   → OR   (true kazanır)
// ════════════════════════════════════════════════════════════════

// Onboarding state cihaz-bazlıdır (her cihazda kullanıcı kendi onboarding'ini görür),
// bu yüzden ProgressDoc'a dahil değildir. Sync sadece kullanıcının ilerlemesini taşır.
export interface ProgressDoc {
  xp: number;
  streak: number;
  completedLessons: string[];
  achievementsUnlocked: string[];
  selectedLevel: string;
  learnedWords: LearnedWord[];
  examScores: Record<string, number>;
  updatedAt: number;
}

const PROGRESS_PATH = (uid: string) =>
  doc(firebaseDb!, 'users', uid, 'data', 'progress');

// ─── Yükle: yerel → Firestore ──────────────────────────────────────

export async function uploadProgress(userId: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  try {
    const s = useUserStore.getState();
    const learnedWords = await getLearnedWords();
    const examScores   = await getExamScores();

    const data: ProgressDoc = {
      xp:                   s.xp,
      streak:               s.streak,
      completedLessons:     Array.from(s.completedLessons),
      achievementsUnlocked: Array.from(s.achievementsUnlocked),
      selectedLevel:        s.selectedLevel,
      learnedWords,
      examScores,
      updatedAt:            Date.now(),
    };

    await setDoc(PROGRESS_PATH(userId), data);
  } catch (e) {
    if (__DEV__) console.warn('[Sync] Upload hatası:', e);
  }
}

// ─── İndir ve birleştir: Firestore → yerel (MERGE) ────────────────
// SADECE sign-up sonrası kullanılır: kullanıcının var olan guest progress'i
// ile cloud'daki (varsa) progress birleştirilir. Veri kaybı olmaz.

export async function downloadAndMergeProgress(userId: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  try {
    const snap = await getDoc(PROGRESS_PATH(userId));
    if (!snap.exists()) return; // Yeni kullanıcı — bulut verisi yok

    const cloud = snap.data() as ProgressDoc;
    const s     = useUserStore.getState();

    // XP — max al
    const mergedXp = Math.max(s.xp, cloud.xp ?? 0);
    if (mergedXp > s.xp) {
      useUserStore.setState({ xp: mergedXp });
    }

    // Streak — max al
    const mergedStreak = Math.max(s.streak, cloud.streak ?? 0);
    if (mergedStreak > s.streak) {
      useUserStore.setState({ streak: mergedStreak });
    }

    // Tamamlanan dersler — union
    const mergedLessons = new Set([
      ...Array.from(s.completedLessons),
      ...(cloud.completedLessons ?? []),
    ]);
    useUserStore.setState({ completedLessons: mergedLessons });

    // Başarımlar — union
    const mergedAchievements = new Set([
      ...Array.from(s.achievementsUnlocked),
      ...(cloud.achievementsUnlocked ?? []),
    ]);
    useUserStore.setState({ achievementsUnlocked: mergedAchievements });

    // Onboarding cihaz-bazlı — cloud'dan çekme, local'de kalsın.
    // Her cihazda kullanıcı kendi welcome + level placement + sorular akışını görür.

    // Seviye — cloud'u al (daha güncel)
    if (cloud.selectedLevel && cloud.selectedLevel !== s.selectedLevel) {
      useUserStore.setState({ selectedLevel: cloud.selectedLevel as any });
    }

    // Sınav skorları — max per level
    const localScores = await getExamScores();
    const mergedScores: Record<string, number> = { ...localScores };
    for (const [level, score] of Object.entries(cloud.examScores ?? {})) {
      if ((mergedScores[level] ?? 0) < (score ?? 0)) {
        mergedScores[level] = score;
      }
    }
    await setExamScores(mergedScores);

    // Öğrenilen kelimeler — union (id bazlı dedupe)
    const localWords   = await getLearnedWords();
    const localWordSet = new Set(localWords.map((w) => `${w.language}:${w.id}`));
    const newWords     = (cloud.learnedWords ?? []).filter(
      (w) => w?.id && w?.language && !localWordSet.has(`${w.language}:${w.id}`),
    );
    if (newWords.length > 0) {
      await setLearnedWords([...localWords, ...newWords]);
    }
  } catch (e) {
    if (__DEV__) console.warn('[Sync] Download merge hatası:', e);
  }
}

// ─── İndir ve REPLACE: Firestore → yerel (cloud authoritative) ────
// SADECE LOGIN sonrası kullanılır. Local'i tamamen cloud'la değiştirir.
// "Bu cihaza giriş yaptım" senaryosu: cloud'daki state ana state olur.
// Eğer cloud boşsa local de boş guest state'e döner (= clearLocalProgress).

export async function downloadAndReplaceProgress(userId: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  try {
    const snap = await getDoc(PROGRESS_PATH(userId));

    if (!snap.exists()) {
      // Cloud boş → bu kullanıcının ilk girişi → boş state'le başla
      await clearLocalProgress();
      return;
    }

    const cloud = snap.data() as ProgressDoc;

    // Tüm progress alanlarını cloud'unkilerle değiştir
    // NOT: onboardingCompleted cihaz-bazlıdır, cloud'dan dokunulmaz.
    useUserStore.setState({
      xp:                   cloud.xp ?? 0,
      streak:               cloud.streak ?? 0,
      completedLessons:     new Set(cloud.completedLessons ?? []),
      achievementsUnlocked: new Set(cloud.achievementsUnlocked ?? []),
      selectedLevel:        (cloud.selectedLevel as any) ?? 'A1',
    });

    // Storage alanları
    await setLearnedWords(cloud.learnedWords ?? []);
    await setExamScores(cloud.examScores ?? {});
  } catch (e) {
    if (__DEV__) console.warn('[Sync] Download replace hatası:', e);
  }
}

// ─── Yerel'i temizle: logout / cloud-boş başlangıç ────────────────
// Progress alanlarını sıfırlar ama kullanıcı tercihlerini (theme, dil,
// onboarding, motivasyonlar, premium) korur.

export async function clearLocalProgress(): Promise<void> {
  try {
    useUserStore.setState({
      xp:                       0,
      streak:                   0,
      hearts:                   5,
      lastStudyDate:            null,
      nextHeartRefillAt:        null,
      completedLessons:         new Set<string>(),
      achievementsUnlocked:     new Set<string>(),
      reviewItems:              {},
      lessonExerciseProgress:   {},
      seenWords:                [],
      dailyQuests:              [],
      dailyQuestsDate:          null,
      recentlyUnlocked:         null,
      hasFirstPurchase:         false,
      hasPerfectLesson:         false,
      lastShownLevel:           1,
      pendingLevelUp:           null,
      pendingStreakMilestone:   null,
    });
    await setLearnedWords([]);
    await setExamScores({});
  } catch (e) {
    if (__DEV__) console.warn('[Sync] Clear hatası:', e);
  }
}
