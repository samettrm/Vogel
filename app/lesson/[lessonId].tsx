import * as Haptics from '../../src/utils/haptics';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  FadeInRight, ZoomIn, ZoomOut,
  Easing, useAnimatedStyle, useSharedValue, withDelay,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdBanner } from '../../src/components/ads/AdBanner';
import { showInterstitialAd } from '../../src/services/ads';
import { FillBlankExercise } from '../../src/components/exercises/FillBlankExercise';
import { ListenExercise } from '../../src/components/exercises/ListenExercise';
import { MatchPairsExercise } from '../../src/components/exercises/MatchPairsExercise';
import { MultipleChoiceExercise } from '../../src/components/exercises/MultipleChoiceExercise';
import { SpeakExercise } from '../../src/components/exercises/SpeakExercise';
import { TranslateExercise } from '../../src/components/exercises/TranslateExercise';
import { CorrectFeedback } from '../../src/components/feedback/CorrectFeedback';
import { WrongFeedback } from '../../src/components/feedback/WrongFeedback';
import { LessonCompleteScreen } from '../../src/components/lesson/LessonCompleteScreen';
import { LessonHeader } from '../../src/components/lesson/LessonHeader';
import { StreakMilestoneScreen } from '../../src/components/lesson/StreakMilestoneScreen';
import { GrammarTipCard } from '../../src/components/lesson/GrammarTipCard';
import { NoHeartsScreen } from '../../src/components/lesson/NoHeartsScreen';
import { PaywallModal } from '../../src/components/paywall/PaywallModal';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { ALL_COURSES, getCourseById } from '../../src/data/courses';
import { useUserStore } from '../../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';
import type { Exercise, Lesson } from '../../src/types';
import {
  getCorrectAnswerText, getReviewPayloadForExercise,
  isAnswerCorrect, joinWords,
} from '../../src/utils/exerciseHelpers';
import { playSound } from '../../src/utils/sounds';

// ─────────────────────────────────────────────────────────────────
// REDUCER — Tüm ders state'i tek yerde
// 12 ayrı useState yerine tek dispatch → render sayısı ciddi azalır
// ─────────────────────────────────────────────────────────────────

type AnswerState = 'idle' | 'correct' | 'wrong';

interface LessonReducerState {
  exerciseIndex: number;
  selectedOptionId: string;
  selectedWords: string[];
  answerState: AnswerState;
  earnedXp: number;
  correctCount: number;
  wrongCount: number;
  currentCombo: number;
  speakTypedText: string;
  isLessonComplete: boolean;
  isUnitComplete: boolean;
  isTransitioning: boolean;
}

type LessonAction =
  | { type: 'SELECT_OPTION'; optionId: string }
  | { type: 'ADD_WORD'; word: string }
  | { type: 'REMOVE_WORD_AT'; index: number }
  | { type: 'SELECT_PAIR'; pairId: string }
  | { type: 'SET_SELECTED_WORDS'; words: string[] }
  | { type: 'SET_SPEAK_TYPED_TEXT'; text: string }
  | { type: 'CHECK_CORRECT'; xp: number; comboInc: boolean }
  | { type: 'CHECK_WRONG' }
  | { type: 'RESET_ANSWER' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'START_TRANSITIONING' }
  | { type: 'FINISH_LESSON'; isUnitComplete: boolean };

const INITIAL_STATE: LessonReducerState = {
  exerciseIndex: 0,
  selectedOptionId: '',
  selectedWords: [],
  answerState: 'idle',
  earnedXp: 0,
  correctCount: 0,
  wrongCount: 0,
  currentCombo: 0,
  speakTypedText: '',
  isLessonComplete: false,
  isUnitComplete: false,
  isTransitioning: false,
};

function lessonReducer(state: LessonReducerState, action: LessonAction): LessonReducerState {
  // Guard: cevap verilmiş veya transition sırasında kullanıcı girdisi yok say
  const inputBlocked = state.answerState !== 'idle' || state.isTransitioning;

  switch (action.type) {
    case 'SELECT_OPTION':
      if (inputBlocked) return state;
      return { ...state, selectedOptionId: action.optionId };
    case 'ADD_WORD':
      if (inputBlocked) return state;
      return { ...state, selectedWords: [...state.selectedWords, action.word] };
    case 'REMOVE_WORD_AT':
      if (inputBlocked) return state;
      return {
        ...state,
        selectedWords: state.selectedWords.filter((_, i) => i !== action.index),
      };
    case 'SELECT_PAIR': {
      if (inputBlocked) return state;
      const exists = state.selectedWords.includes(action.pairId);
      return {
        ...state,
        selectedWords: exists
          ? state.selectedWords.filter((id) => id !== action.pairId)
          : [...state.selectedWords, action.pairId],
      };
    }
    case 'SET_SELECTED_WORDS':
      if (inputBlocked) return state;
      return { ...state, selectedWords: action.words };
    case 'SET_SPEAK_TYPED_TEXT':
      return { ...state, speakTypedText: action.text };
    case 'CHECK_CORRECT':
      return {
        ...state,
        answerState: 'correct',
        earnedXp: state.earnedXp + action.xp,
        correctCount: state.correctCount + 1,
        currentCombo: action.comboInc ? state.currentCombo + 1 : state.currentCombo,
      };
    case 'CHECK_WRONG':
      return {
        ...state,
        answerState: 'wrong',
        wrongCount: state.wrongCount + 1,
        currentCombo: 0,
      };
    case 'RESET_ANSWER':
      return {
        ...state,
        selectedOptionId: '',
        selectedWords: [],
        answerState: 'idle',
        speakTypedText: '',
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        exerciseIndex: state.exerciseIndex + 1,
        selectedOptionId: '',
        selectedWords: [],
        answerState: 'idle',
        speakTypedText: '',
      };
    case 'START_TRANSITIONING':
      return { ...state, isTransitioning: true };
    case 'FINISH_LESSON':
      return {
        ...state,
        isLessonComplete: true,
        isUnitComplete: action.isUnitComplete,
        isTransitioning: false,
      };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────

type CourseRef = { source: string; target: string; level?: string };

function findLessonById(lessonId: string, activeCourseId: string): { lesson: Lesson | undefined; courseId: string } {
  const activeCourse = getCourseById(activeCourseId);
  const fromActive = activeCourse?.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === lessonId);
  if (fromActive) return { lesson: fromActive, courseId: activeCourseId };
  for (const course of ALL_COURSES) {
    const found = course.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === lessonId);
    if (found) return { lesson: found, courseId: course.id };
  }
  return { lesson: undefined, courseId: activeCourseId };
}

function normalizeAnswer(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR').replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────
// 🎯 ADAPTIVE DIFFICULTY — kullanıcının genel doğruluk oranına göre
// "uygulama" egzersizlerini (translate/listen/fillBlank/matchPairs) sıralar.
// multipleChoice egzersizleri yeni kelime tanıttığı için her zaman önde,
// orijinal sırada kalır → öğrenme akışı (önce öğret, sonra uygula) korunur.
// ─────────────────────────────────────────────────────────────────
const PRACTICE_DIFFICULTY: Record<string, number> = {
  fillBlank: 1,
  matchPairs: 1,
  translate: 2,
  speak: 2,
  listen: 3,
};

function computeGlobalAccuracy(
  progress: Record<string, Record<string, 'correct' | 'wrong'>>,
): number {
  let correct = 0;
  let total = 0;
  for (const lessonProgress of Object.values(progress)) {
    for (const result of Object.values(lessonProgress)) {
      total += 1;
      if (result === 'correct') correct += 1;
    }
  }
  // Yeterli veri yoksa nötr değer döndür — adaptasyon yapılmaz.
  if (total < 12) return 0.75;
  return correct / total;
}

function adaptiveOrder(
  allExercises: Exercise[],
  progress: Record<string, Record<string, 'correct' | 'wrong'>>,
): Exercise[] {
  const accuracy = computeGlobalAccuracy(progress);
  // Nötr bölge (orta performans) — orijinal sırayı koru.
  if (accuracy >= 0.6 && accuracy <= 0.85) return allExercises;

  const teaching: Exercise[] = [];
  const practice: Exercise[] = [];
  for (const ex of allExercises) {
    if (ex.type === 'multipleChoice') teaching.push(ex);
    else practice.push(ex);
  }

  // Güçlü kullanıcı (>0.85) → zor uygulama egzersizleri önce.
  // Zorlanan kullanıcı (<0.6) → kolaylarla ısındır, zorları sona bırak.
  const strong = accuracy > 0.85;
  const sortedPractice = [...practice].sort((a, b) => {
    const da = PRACTICE_DIFFICULTY[a.type] ?? 2;
    const db = PRACTICE_DIFFICULTY[b.type] ?? 2;
    return strong ? db - da : da - db;
  });

  return [...teaching, ...sortedPractice];
}

// ─────────────────────────────────────────────────────────────────
// COMBO FLAME — Sürekli "yaşıyor" gibi nefes + sallanma + parıltı
// ─────────────────────────────────────────────────────────────────

function AnimatedFlame() {
  const wobble = useSharedValue(0);
  const breath = useSharedValue(1);
  const glowOpacity = useSharedValue(0.8);

  useEffect(() => {
    // Sallama: sağa-sola hafif rotasyon
    wobble.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 220, easing: Easing.inOut(Easing.quad) }),
        withTiming(4, { duration: 220, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    // Nefes: scale yukarı-aşağı
    breath.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 380, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    // Glow titrek alev gibi parlasın
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0.55, { duration: 200 }),
        withTiming(0.9, { duration: 160 }),
      ),
      -1,
      true,
    );
  }, [wobble, breath, glowOpacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${wobble.value}deg` },
      { scale: breath.value },
    ],
    textShadowColor: `rgba(255, 140, 0, ${glowOpacity.value})`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  }));

  return (
    <Animated.Text
      style={[
        { fontSize: 24, color: '#FFD56B' },
        style,
      ]}
    >
      🔥
    </Animated.Text>
  );
}

function AnimatedSparkle({
  delay,
  style: positionStyle,
  char,
}: {
  delay: number;
  style: { position: 'absolute'; [key: string]: any };
  char: string;
}) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.2, { duration: 450 }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.35, { duration: 350 }),
          withTiming(0.6, { duration: 450 }),
        ),
        -1,
        true,
      ),
    );
  }, [opacity, scale, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[positionStyle, animStyle]} pointerEvents="none">
      {char}
    </Animated.Text>
  );
}

export default function LessonScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const t = useT();
  const { lessonId, returnTo } = useLocalSearchParams<{ lessonId: string; returnTo?: string }>();
  const safeInsets = useSafeAreaInsets();
  const bottomPad = Math.max(safeInsets.bottom, 12) + 20;

  // Tek reducer ile state
  const [state, dispatch] = useReducer(lessonReducer, INITIAL_STATE);
  const {
    exerciseIndex, selectedOptionId, selectedWords, answerState,
    earnedXp, correctCount, currentCombo, speakTypedText,
    isLessonComplete, isUnitComplete, isTransitioning,
  } = state;

  // UI/Animation ayrı (state'e gerek yok)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  // Gramer ipucu gösterimi (her lesson özelinde, ders başlamadan)
  const [grammarTipShown, setGrammarTipShown] = useState(false);
  // 3. ders paywall — free kullanıcıya bir kez gösterilir
  const [showPaywall, setShowPaywall] = useState(false);

  const actionLockRef = useRef(false);
  const advanceLockRef = useRef(false);
  const comboMilestonesHitRef = useRef<Set<number>>(new Set());

  // Reanimated paylaşılan değerler
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const comboScale = useSharedValue(1);
  const comboStyle = useAnimatedStyle(() => ({ transform: [{ scale: comboScale.value }] }));

  const triggerWrongShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 45 }),
      withTiming(12, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-4, { duration: 40 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  const celebrateComboMilestone = useCallback(() => {
    // Büyük kutlama — milestone'larda (3, 5, 10)
    comboScale.value = withSequence(
      withTiming(1.75, { duration: 140 }),
      withTiming(0.88, { duration: 90 }),
      withTiming(1.18, { duration: 90 }),
      withTiming(1, { duration: 110 }),
    );
  }, [comboScale]);

  const pulseCombo = useCallback(() => {
    // Küçük puls — her combo artışında dikkat çekmek için
    comboScale.value = withSequence(
      withTiming(1.35, { duration: 110 }),
      withTiming(1, { duration: 140 }),
    );
  }, [comboScale]);

  // Store — alanları ayrı select et (sığ karşılaştırma)
  const activeCourse = useUserStore((s) => s.activeCourse) as CourseRef;
  const hearts = useUserStore((s) => s.hearts);
  const maxHearts = useUserStore((s) => s.maxHearts);
  const nextHeartRefillAt = useUserStore((s) => s.nextHeartRefillAt);
  const addXp = useUserStore((s) => s.addXp);
  const loseHeart = useUserStore((s) => s.loseHeart);
  const completeLesson = useUserStore((s) => s.completeLesson);
  const setExerciseResult = useUserStore((s) => s.setExerciseResult);
  const recordReviewResult = useUserStore((s) => s.recordReviewResult);
  const incrementQuestProgress = useUserStore((s) => s.incrementQuestProgress);
  const completedLessons = useUserStore((s) => s.completedLessons);
  const completedLessonsSize = useUserStore((s) => s.completedLessons.size);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const lessonExerciseProgress = useUserStore((s) => s.lessonExerciseProgress);
  const checkAndUnlockAchievements = useUserStore((s) => s.checkAndUnlockAchievements);
  // (Level-up sistemi kaldırıldı — amaca yönelik sadeleştirme)
  // 🔥 Streak motivasyonu — günlük çalışma kaydet + milestone tetikle
  const registerStudySession = useUserStore((s) => s.registerStudySession);
  const pendingStreakMilestone = useUserStore((s) => s.pendingStreakMilestone);
  const dismissPendingStreakMilestone = useUserStore((s) => s.dismissPendingStreakMilestone);

  const activeCourseId = `${activeCourse.source}-${activeCourse.target}-${(activeCourse.level ?? 'A1').toLowerCase()}`;
  const { lesson, courseId: lessonCourseId } = useMemo(
    () => findLessonById(lessonId ?? '', activeCourseId),
    [lessonId, activeCourseId],
  );

  // ── Erişim kontrolü — kilitli derslere URL ile bypass girişini engelle ──
  // Harita kilitleriyle aynı mantık: tamamlanmış veya "current" ders açık.
  const isAccessBlocked = useMemo(() => {
    if (!lesson) return false; // ders bulunamadı → ayrı hata ekranı
    const course = getCourseById(lessonCourseId);
    if (!course) return false;
    const flatAll = course.units.flatMap((u) => u.lessons);
    let foundCurrent = false;
    for (const l of flatAll) {
      const inExamUnit = course.units.some(
        (u) => (u.tags?.includes('exam') ?? false) && u.lessons.some((x) => x.id === l.id),
      );
      if (completedLessons.has(l.id)) {
        // tamamlanmış = erişilebilir, devam et
      } else if (inExamUnit) {
        if (!isPremium && l.id === lesson.id) return true; // sınav + premium değil = kilitli
      } else if (!foundCurrent) {
        foundCurrent = true;
        if (l.id === lesson.id) return false; // "current" ders = erişilebilir
      } else {
        if (l.id === lesson.id) return true; // henüz sırası gelmemiş = kilitli
      }
    }
    return false;
  }, [lesson, lessonCourseId, completedLessons, isPremium]);

  // Egzersizleri tek bir snapshot olarak hesapla (ders id değişirse yeniden)
  const exercises = useMemo<Exercise[]>(() => {
    if (!lesson) return [];
    const allExercises = lesson.exercises ?? [];
    const isCompleted = completedLessons?.has?.(lesson.id) ?? false;
    if (isCompleted) return allExercises;
    const progress = lessonExerciseProgress?.[lesson.id] ?? {};
    const wrongExercises = allExercises.filter((exercise) => progress[exercise.id] === 'wrong');
    if (wrongExercises.length > 0) return wrongExercises;
    // 🎯 İlk geçişte egzersizler kullanıcının genel performansına göre sıralanır.
    // (Sadece ders açılışında bir kez — ders ortasında sıra kaymaz.)
    return adaptiveOrder(allExercises, lessonExerciseProgress ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    advanceLockRef.current = false;
  }, [exerciseIndex]);

  const currentExercise = exercises[exerciseIndex] ?? null;
  const isAnswered = answerState !== 'idle';
  const isLocked = isTransitioning;

  // ─── Handler'lar (useCallback ile memoize) ───────────────────────

  const goHome = useCallback(() => {
    // returnTo parametresi varsa oraya dön (exam-map, lessons, vb.)
    // yoksa ana haritaya dön
    router.replace((returnTo as any) ?? '/');
  }, [router, returnTo]);

  const closeLesson = useCallback(() => {
    if (isLocked) return;
    setShowCloseConfirm(true);
  }, [isLocked]);

  const onCloseConfirm = useCallback(() => {
    setShowCloseConfirm(false);
    goHome();
  }, [goHome]);

  const onCloseCancel = useCallback(() => setShowCloseConfirm(false), []);

  // ÖNEMLİ: Bu callback'ler state bağımlılığı içermez → stable referans
  // Reducer guard'ı (inputBlocked) içeriden kontrol eder
  const addWord = useCallback((word: string) => {
    dispatch({ type: 'ADD_WORD', word });
  }, []);

  const removeWordAt = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_WORD_AT', index });
  }, []);

  const selectOption = useCallback((optionId: string) => {
    dispatch({ type: 'SELECT_OPTION', optionId });
  }, []);

  // Speak exercise handlers — henüz UI'a bağlanmadı, ileri faz için hazır
  const _selectSpeakAnswer = useCallback(() => {
    if (!currentExercise || currentExercise.type !== 'speak') return;
    dispatch({ type: 'SET_SELECTED_WORDS', words: [currentExercise.targetText] });
  }, [currentExercise]);

  const _onSpeakTypedTextChange = useCallback((text: string) => {
    dispatch({ type: 'SET_SPEAK_TYPED_TEXT', text });
  }, []);

  // MatchPairs: doğru eşleşme komponent içinde doğrulanır, burada sadece
  // selectedWords'e pair.id ekliyoruz — hepsi eşleşinceye kadar.
  const onPairMatched = useCallback((pairId: string) => {
    dispatch({ type: 'SELECT_PAIR', pairId });
  }, []);

  const getCurrentAnswer = useCallback((exercise: Exercise): string => {
    switch (exercise.type) {
      case 'multipleChoice': return selectedOptionId;
      case 'translate':
      case 'listen':
      case 'fillBlank': return joinWords(selectedWords);
      case 'speak':
        if (speakTypedText.trim().length > 0) return speakTypedText.trim();
        return joinWords(selectedWords);
      case 'matchPairs': return selectedWords.join('|');
      default: return '';
    }
  }, [selectedOptionId, selectedWords, speakTypedText]);

  const canCheck = currentExercise && !isLocked
    ? getCurrentAnswer(currentExercise).length > 0 : false;

  const finishLesson = useCallback(() => {
    if (!lesson) {
      actionLockRef.current = false;
      return;
    }

    const allLessonExercises = lesson.exercises ?? [];
    const finalProgress = useUserStore.getState().lessonExerciseProgress?.[lesson.id] ?? {};
    const allCorrect = allLessonExercises.length > 0 &&
      allLessonExercises.every((ex) => finalProgress[ex.id] === 'correct');

    let unitJustCompleted = false;
    let isPerfect = false;
    if (allCorrect) {
      completeLesson(lesson.id);
      incrementQuestProgress('completeLesson', 1);
      // 🔥 Streak günlük çalışma kaydı — streak artışı + milestone tetikleme
      registerStudySession();
      // Hatasız mı? — wrongCount state'te zaten var
      // (CHECK_WRONG ile artar). Buraya kadar geldiyse tüm cevaplar doğru.
      isPerfect = state.wrongCount === 0;
      const course = getCourseById(lessonCourseId);
      const unit = course?.units.find((u) => u.lessons.some((l) => l.id === lesson.id));
      if (unit) {
        const completed = useUserStore.getState().completedLessons;
        unitJustCompleted = unit.lessons.every((l) => completed.has(l.id) || l.id === lesson.id);
      }
    }

    // 🏆 Achievements kontrolü
    setTimeout(() => {
      checkAndUnlockAchievements({ perfectLesson: isPerfect });
    }, 100);

    dispatch({ type: 'FINISH_LESSON', isUnitComplete: unitJustCompleted });
    actionLockRef.current = false;

    // 💎 Paywall: 3. ders tamamlandığında free kullanıcıya bir kez göster
    if (!isPremium && allCorrect) {
      const newSize = completedLessonsSize + 1;
      if (newSize === 3) {
        setTimeout(() => setShowPaywall(true), 1200);
      }
    }
  }, [lesson, lessonCourseId, completeLesson, incrementQuestProgress, registerStudySession, checkAndUnlockAchievements, state.wrongCount, isPremium, completedLessonsSize]);

  const checkAnswer = useCallback(() => {
    if (!lesson || !currentExercise || !canCheck || isAnswered || actionLockRef.current) return;
    actionLockRef.current = true;

    const answer = getCurrentAnswer(currentExercise);
    let correct = false;

    if (currentExercise.type === 'multipleChoice') {
      const correctAnswerText = getCorrectAnswerText(currentExercise);
      const selectedOption = currentExercise.options.find((option) => option.id === selectedOptionId);
      correct = selectedOptionId === currentExercise.correctOptionId ||
        normalizeAnswer(selectedOption?.text ?? '') === normalizeAnswer(correctAnswerText);
    } else if (currentExercise.type === 'speak') {
      correct = normalizeAnswer(answer) === normalizeAnswer(currentExercise.targetText);
    } else if (currentExercise.type === 'matchPairs') {
      correct = selectedWords.length === currentExercise.pairs.length;
    } else {
      correct = isAnswerCorrect(currentExercise, answer);
    }

    // 🚀 PERF: store yazımı (setExerciseResult) artık setTimeout(0) içinde —
    // UI tepkisi (dispatch) bloke olmasın diye correct/wrong dalında defer edilir.
    const exerciseResultValue: 'correct' | 'wrong' = correct ? 'correct' : 'wrong';
    const reviewPayload = getReviewPayloadForExercise(currentExercise, lessonCourseId);

    if (correct) {
      const newCombo = currentCombo + 1;
      let bonusXp = 0;
      if (newCombo === 3 && !comboMilestonesHitRef.current.has(3)) { bonusXp = 5; comboMilestonesHitRef.current.add(3); }
      else if (newCombo === 5 && !comboMilestonesHitRef.current.has(5)) { bonusXp = 10; comboMilestonesHitRef.current.add(5); }
      else if (newCombo === 10 && !comboMilestonesHitRef.current.has(10)) { bonusXp = 25; comboMilestonesHitRef.current.add(10); }

      const totalXp = 10 + bonusXp;

      // Tek dispatch — birden çok setState yerine
      dispatch({ type: 'CHECK_CORRECT', xp: totalXp, comboInc: true });

      // Yan etkiler asenkron (UI render'ı blokla­masın)
      setTimeout(() => {
        setExerciseResult(lesson.id, currentExercise.id, exerciseResultValue);
        if (reviewPayload) recordReviewResult(reviewPayload, correct);
        addXp(totalXp);
        incrementQuestProgress('earnXp', totalXp);
        incrementQuestProgress('correctAnswers', 1);

        // 🎯 SES + ANİMASYON HİYERARŞİSİ
        //   - newCombo >= 2 → combo sesi + pulse animasyon (her combo dikkat çekiyor)
        //   - newCombo < 2 → normal correct sesi (ilk doğru cevap)
        //   - Milestone (3, 5, 10) → BÜYÜK kutlama + heavy haptic
        if (bonusXp > 0) {
          celebrateComboMilestone();
          playSound('comboUp').catch(() => {});
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        } else if (newCombo >= 2) {
          pulseCombo();
          playSound('comboUp').catch(() => {});
          // Hafif haptic — combo enerjisini desteklesin ama yormasın
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        } else {
          playSound('correct').catch(() => {});
        }
      }, 0);
    } else {
      dispatch({ type: 'CHECK_WRONG' });
      comboMilestonesHitRef.current.clear();
      triggerWrongShake();
      setTimeout(() => {
        setExerciseResult(lesson.id, currentExercise.id, exerciseResultValue);
        if (reviewPayload) recordReviewResult(reviewPayload, correct);
        loseHeart();
        playSound('wrong').catch(() => {});
        // Haptic kaldırıldı — sadece kombolarda titresin (yanlış cevapta da titreme YOK)
      }, 0);
    }
    actionLockRef.current = false;
  }, [
    lesson, currentExercise, canCheck, isAnswered, selectedOptionId, selectedWords,
    currentCombo, getCurrentAnswer, lessonCourseId, setExerciseResult,
    recordReviewResult, addXp, incrementQuestProgress, loseHeart,
    celebrateComboMilestone, pulseCombo, triggerWrongShake,
  ]);

  const continueLesson = useCallback(() => {
    if (!isAnswered || isTransitioning) return;
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;

    const nextIndex = exerciseIndex + 1;
    if (nextIndex >= exercises.length) {
      dispatch({ type: 'START_TRANSITIONING' });
      finishLesson();
      return;
    }
    dispatch({ type: 'NEXT_QUESTION' });
  }, [isAnswered, isTransitioning, exerciseIndex, exercises.length, finishLesson]);

  const styles = makeStyles(c);

  // ─── Early returns ────────────────────────────────────────────────

  // Kilitli ders koruması — harita dışından bypass girişini önle
  if (isAccessBlocked) {
    return <Redirect href="/(tabs)" />;
  }

  // Kalp kontrolü — sıfır can + free kullanıcı → ders açılamaz
  if (hearts === 0 && !isPremium) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <NoHeartsScreen nextHeartAt={nextHeartRefillAt} onGoHome={goHome} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>{t('lesson.notFound')}</Text>
          <CheckButton c={c} label={t('common.goHome')} onPress={goHome} enabled />
        </View>
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>{t('lesson.empty')}</Text>
          <Text style={styles.subtitle}>{t('lesson.emptyDesc')}</Text>
          <CheckButton c={c} label={t('common.goHome')} onPress={goHome} enabled />
        </View>
      </SafeAreaView>
    );
  }

  if (isLessonComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Öncelik sırası:
            1. 🔥 Streak milestone (3/7/14/30/60/100/180/365 gün)
            2. ✅ Normal lesson complete ekranı
            (Level-up sistemi kaldırıldı — derslerde fazla animasyon birikiyordu) */}
        {pendingStreakMilestone !== null ? (
          <StreakMilestoneScreen
            streak={pendingStreakMilestone}
            onContinue={dismissPendingStreakMilestone}
          />
        ) : (
          <>
            <LessonCompleteScreen
              xpEarned={earnedXp}
              correctCount={correctCount}
              totalExercises={exercises.length}
              heartsRemaining={hearts}
              maxHearts={maxHearts}
              onContinue={async () => {
                // 📺 Free kullanıcıya ~1/3 olasılıkla interstitial göster.
                // Premium kullanıcıda hiç reklam yok.
                // showInterstitialAd kendisi probability + premium gating yapıyor;
                // burada sadece açıkça `!isPremium` kontrolü ile fazladan emniyet ekledik.
                if (!isPremium) {
                  try { await showInterstitialAd(); } catch {}
                }
                goHome();
              }}
              isUnitComplete={isUnitComplete}
              isPremium={isPremium}
            />
            <PaywallModal
              visible={showPaywall}
              onDismiss={() => setShowPaywall(false)}
            />
          </>
        )}
      </SafeAreaView>
    );
  }

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>{t('lesson.loadFailed')}</Text>
          <CheckButton c={c} label={t('common.goHome')} onPress={goHome} enabled />
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent = Math.min(100, Math.max(4, ((exerciseIndex + 1) / exercises.length) * 100));
  const isLessonAlreadyCompleted = completedLessons?.has?.(lesson.id) ?? false;

  // Gramer ipucu: lesson.grammarNote varsa ve henüz gösterilmemişse + ders tamamlanmamışsa
  const shouldShowGrammarTip = lesson.grammarNote && !grammarTipShown && !isLessonAlreadyCompleted;

  return (
    <SafeAreaView style={styles.safeArea}>
      {shouldShowGrammarTip ? (
        <GrammarTipCard
          grammarNote={lesson.grammarNote!}
          onContinue={() => setGrammarTipShown(true)}
        />
      ) : null}
      <ConfirmDialog
        visible={showCloseConfirm}
        title={t('lesson.closeTitle')}
        message={t('lesson.closeMessage')}
        confirmLabel={t('lesson.closeExit')}
        cancelLabel={t('lesson.closeContinue')}
        onConfirm={onCloseConfirm}
        onCancel={onCloseCancel}
        destructive
        icon="exit-outline"
      />
      <View style={styles.container}>
        <View style={styles.bgGlow} pointerEvents="none" />
        <LessonHeader
          progress={isLessonAlreadyCompleted ? 100 : progressPercent}
          hearts={hearts}
          onClose={closeLesson}
          completed={isLessonAlreadyCompleted}
          isPremium={isPremium}
        />

        <View style={styles.statusRow} pointerEvents="none">
          <Text style={styles.xpStatusText}>+{earnedXp} XP</Text>
          {currentCombo >= 2 ? (
            // DIŞ wrapper → layout animation (entering/exiting)
            // İÇ wrapper → manuel scale transform (combo pulse)
            // Reanimated transform conflict'ini önlemek için ayrı.
            <Animated.View
              entering={ZoomIn.springify().damping(12).stiffness(180)}
              exiting={ZoomOut.duration(160)}
            >
              <Animated.View style={[styles.comboBadge, comboStyle]}>
                {/* Pırıldayan yıldızlar — farklı tempo ile sürekli twinkle */}
                <AnimatedSparkle delay={0}   style={styles.comboSparkleL} char="✦" />
                <AnimatedSparkle delay={250} style={styles.comboSparkleR} char="✦" />
                <AnimatedSparkle delay={120} style={styles.comboSparkleT} char="✧" />
                {/* Canlı alev — nefes alıyor, sallanıyor, parlıyor */}
                <AnimatedFlame />
                <Text style={styles.comboText}>x{currentCombo}</Text>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>

        <Animated.View
          key={`exercise-${currentExercise.id}-${exerciseIndex}`}
          entering={FadeInRight.duration(180)}
          style={[styles.exerciseArea, shakeStyle]}
          pointerEvents={isAnswered || isLocked ? 'none' : 'auto'}
        >
          <ScrollView
            contentContainerStyle={styles.exerciseScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentExercise.type === 'multipleChoice' ? (
              <MultipleChoiceExercise
                exercise={currentExercise}
                selectedOptionId={selectedOptionId}
                disabled={isAnswered || isLocked}
                onSelect={selectOption}
              />
            ) : null}
            {currentExercise.type === 'translate' ? (
              <TranslateExercise
                exercise={currentExercise}
                selectedWords={selectedWords}
                disabled={isAnswered || isLocked}
                onAddWord={addWord}
                onRemoveWordAt={removeWordAt}
              />
            ) : null}
            {currentExercise.type === 'listen' ? (
              <ListenExercise
                exercise={currentExercise}
                selectedWords={selectedWords}
                disabled={isAnswered || isLocked}
                onAddWord={addWord}
                onRemoveWordAt={removeWordAt}
              />
            ) : null}
            {currentExercise.type === 'fillBlank' ? (
              <FillBlankExercise
                exercise={currentExercise}
                selectedWords={selectedWords}
                disabled={isAnswered || isLocked}
                onAddWord={addWord}
                onRemoveWordAt={removeWordAt}
              />
            ) : null}

            {currentExercise.type === 'speak' ? (
              <SpeakExercise
                exercise={currentExercise}
                disabled={isAnswered || isLocked}
                recognizedText={selectedWords.join(' ') || speakTypedText}
                onRecognized={(text) => {
                  dispatch({ type: 'SET_SELECTED_WORDS', words: [text] });
                }}
              />
            ) : null}

            {currentExercise.type === 'matchPairs' ? (
              <MatchPairsExercise
                exercise={currentExercise}
                matchedIds={selectedWords}
                disabled={isAnswered || isLocked}
                onPairMatched={onPairMatched}
              />
            ) : null}
          </ScrollView>
        </Animated.View>

        <View style={[styles.bottomArea, { paddingBottom: bottomPad }]}>
          {isAnswered && !isTransitioning ? (
            answerState === 'correct' ? (
              <CorrectFeedback onContinue={continueLesson} />
            ) : (
              <WrongFeedback
                correctAnswer={getCorrectAnswerText(currentExercise)}
                onContinue={continueLesson}
              />
            )
          ) : null}

          {!isAnswered && !isTransitioning ? (
            <CheckButton c={c} label={t('common.check')} onPress={checkAnswer} enabled={canCheck} />
          ) : null}
        </View>

        {/* 📺 Banner reklam — sadece free user'da görünür (AdBanner içinde premium check) */}
        <AdBanner />
      </View>
    </SafeAreaView>
  );
}

function CheckButton({
  c, label, onPress, enabled,
}: {
  c: ReturnType<typeof useThemeColors>;
  label: string;
  onPress: () => void;
  enabled: boolean;
}) {
  const styles = makeStyles(c);
  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkButton,
        enabled ? styles.checkEnabled : styles.checkDisabled,
        pressed && enabled && styles.checkPressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={[
        styles.checkButtonText,
        enabled ? styles.checkTextEnabled : styles.checkTextDisabled,
      ]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    container: { flex: 1, backgroundColor: c.bg },
    bgGlow: {
      position: 'absolute', top: 80, right: -120,
      width: 280, height: 280, borderRadius: 140,
      backgroundColor: c.neon, opacity: 0.06,
    },
    centerContent: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing.xl, gap: spacing.base,
    },
    title: { ...textStyles.heading, color: c.textHigh, textAlign: 'center' },
    subtitle: { ...textStyles.body, color: c.textMed, textAlign: 'center' },
    statusRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.base, paddingTop: 2, paddingBottom: spacing.xs,
      minHeight: 28,
    },
    xpStatusText: { ...textStyles.bodyBold, color: c.neonLight, fontSize: 14 },
    comboBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.gold,
      paddingHorizontal: spacing.md, paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1.5, borderColor: '#FFE082',
      shadowColor: c.gold, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.95, shadowRadius: 18, elevation: 12,
    },
    comboEmoji: {
      fontSize: 24,
      // Alev kendisi için ekstra glow
      textShadowColor: 'rgba(255, 165, 0, 0.95)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    comboText: { ...textStyles.bodyBold, color: c.bg, fontSize: 18, fontWeight: '900' as const },
    comboSparkleL: { position: 'absolute', left: -2, top: -4, fontSize: 10, color: '#FFF8E1', opacity: 0.9 },
    comboSparkleR: { position: 'absolute', right: -2, bottom: -4, fontSize: 10, color: '#FFF8E1', opacity: 0.9 },
    comboSparkleT: { position: 'absolute', left: 14, top: -8, fontSize: 9, color: '#FFFFFF', opacity: 0.85 },
    exerciseArea: { flex: 1 },
    exerciseScrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
    bottomArea: {
      paddingHorizontal: spacing.base, minHeight: 100,
      justifyContent: 'flex-end', backgroundColor: 'transparent',
    },
    checkButton: {
      minHeight: 56, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    checkEnabled: {
      backgroundColor: c.neon, shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 14, elevation: 8,
    },
    checkDisabled: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    checkPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
    checkButtonText: { ...textStyles.button },
    checkTextEnabled: { color: c.textOnNeon },
    checkTextDisabled: { color: c.textMuted },
    speakInline: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.lg },
    inlineLabel: { ...textStyles.label, color: c.textLow },
    promptCard: {
      backgroundColor: c.glassBgStrong, borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden',
    },
    promptHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    inlinePrompt: { ...textStyles.heading, color: c.textHigh, fontSize: 24, lineHeight: 32 },
    speakSayButton: {
      minHeight: 54, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
    },
    speakSayButtonActive: {
      backgroundColor: c.neon, borderColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
    },
    speakSayText: { ...textStyles.button, color: c.textHigh },
    fallbackInput: {
      ...textStyles.bodyBold, color: c.textHigh,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.md,
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
      minHeight: 54, fontSize: 16,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
}
