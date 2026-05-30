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

// ─── Login sonrası MERGE — guest progress kaybedilmez ───────────────
// Login (email/Google/Apple/verify-email) sonrası çağrılır.
// MERGE STRATEJİSİ (downloadAndMergeProgress ile aynı mantık):
//   - completedLessons → union (local + remote birleşir)
//   - lessonExerciseProgress → merge (per-lesson keys)
//   - reviewItems → merge
//   - xp/streak → max
//   - achievementsUnlocked → union
//   - selectedLevel → cloud (varsa) yoksa local
//   - activeCourse → local korunur (cloud'da yok)
//
// 🚨 ESKİ DAVRANIŞ (BUG): Cloud boşsa clearLocalProgress() çağırırdı →
//    guest progress WIPE olurdu. Yeni davranış: cloud boşsa local'i
//    cloud'a UPLOAD eder (preserve guest). Cloud'da varsa MERGE yapar.
//
// onboardingCompleted, hasCompletedPlacement → cihaz-bazlı, ASLA dokunulmaz.

export async function downloadAndReplaceProgress(userId: string): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) return;
  try {
    const snap = await getDoc(PROGRESS_PATH(userId));
    const localBefore = useUserStore.getState();

    console.warn('[AUTH_PROGRESS_BEFORE_LOGIN]', {
      localXp: localBefore.xp,
      localCompletedLessonsCount: localBefore.completedLessons.size,
      localStreak: localBefore.streak,
      localOnboardingCompleted: localBefore.onboardingCompleted,
      localHasCompletedPlacement: localBefore.hasCompletedPlacement,
      localSelectedLevel: localBefore.selectedLevel,
    });

    if (!snap.exists()) {
      // Cloud BOŞ → bu kullanıcının ilk girişi.
      // ESKİ DAVRANIŞ: clearLocalProgress() → WIPE guest (BUG)
      // YENİ DAVRANIŞ: Local guest progress'i cloud'a UPLOAD et (preserve).
      console.warn('[AUTH_PROGRESS_AFTER_REMOTE_FETCH]', {
        cloudExists: false,
        action: 'preserving local + uploading to cloud',
      });
      await uploadProgress(userId);
      console.warn('[AUTH_PROGRESS_MERGED]', {
        result: 'cloud-empty-uploaded-local',
        finalCompletedLessons: localBefore.completedLessons.size,
        finalXp: localBefore.xp,
      });
      return;
    }

    const cloud = snap.data() as ProgressDoc;
    console.warn('[AUTH_PROGRESS_AFTER_REMOTE_FETCH]', {
      cloudExists: true,
      cloudXp: cloud.xp,
      cloudCompletedLessonsCount: cloud.completedLessons?.length ?? 0,
      cloudStreak: cloud.streak,
      cloudSelectedLevel: cloud.selectedLevel,
    });

    // ─── MERGE — guest + cloud progress birleşir ──────────────────
    const mergedXp = Math.max(localBefore.xp, cloud.xp ?? 0);
    const mergedStreak = Math.max(localBefore.streak, cloud.streak ?? 0);

    const mergedCompletedLessons = new Set([
      ...Array.from(localBefore.completedLessons),
      ...(cloud.completedLessons ?? []),
    ]);

    const mergedAchievements = new Set([
      ...Array.from(localBefore.achievementsUnlocked),
      ...(cloud.achievementsUnlocked ?? []),
    ]);

    // Selected level — cloud öncelikli (daha güncel) ama local'de farklıysa max al
    const mergedSelectedLevel = (cloud.selectedLevel as any) ?? localBefore.selectedLevel;

    // 🔒 KORUNAN STATE'LER (asla dokunulmaz):
    //   - onboardingCompleted, hasCompletedPlacement (cihaz-bazlı)
    //   - lessonExerciseProgress (cloud'da yok, local'de kalır)
    //   - reviewItems (cloud'da yok, local'de kalır)
    //   - activeCourse (cloud'da yok, local'de kalır)
    //   - hearts, nextHeartRefillAt (gerçek zamanlı state)
    useUserStore.setState({
      xp:                   mergedXp,
      streak:               mergedStreak,
      completedLessons:     mergedCompletedLessons,
      achievementsUnlocked: mergedAchievements,
      selectedLevel:        mergedSelectedLevel,
    });

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
    const localWords = await getLearnedWords();
    const localWordSet = new Set(localWords.map((w) => `${w.language}:${w.id}`));
    const newWords = (cloud.learnedWords ?? []).filter(
      (w) => w?.id && w?.language && !localWordSet.has(`${w.language}:${w.id}`),
    );
    if (newWords.length > 0) {
      await setLearnedWords([...localWords, ...newWords]);
    }

    console.warn('[AUTH_PROGRESS_MERGED]', {
      result: 'merged-cloud-with-local',
      mergedCompletedLessons: mergedCompletedLessons.size,
      mergedXp,
      mergedStreak,
      onboardingPreserved: localBefore.onboardingCompleted,
      placementPreserved: localBefore.hasCompletedPlacement,
    });

    // Merge sonrası cloud'u da güncelle (yeni union state remote'a yazılsın)
    await uploadProgress(userId);
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
