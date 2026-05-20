import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInRight, FadeOutLeft,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

import { useUserStore } from '../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT, type MessageKey } from '../src/i18n';
import { requestNotificationPermission } from '../src/utils/notifications';
import { refreshSmartReminders } from '../src/utils/smartReminders';
import {
  MOTIVATIONS_META,
  estimateTimeToA2,
  getMotivationMeta,
  type MotivationMeta,
} from '../src/services/personalization';
import type { LearningMotivation } from '../src/types';
import { PlacementTest } from '../src/components/onboarding/PlacementTest';
import type { CEFRLevel } from '../src/types';

// ════════════════════════════════════════════════════════════════
// ONBOARDING — 6 ADIMLI KİŞİSELLEŞTİRİLMİŞ AKIŞ
//
// Step 1: Welcome
// Step 2: Motivasyon (ÇOKLU seçim 1-3) — kullanıcıyı tanıma
// Step 3: Günlük Hedef (sadece dakika)
// Step 4: Mini Taster ("Hallo" ne demek?)
// Step 5: Bildirimler
// Step 6: KİŞİSEL ÖZET — "Senin Vogel Yolculuğun" (sürpriz adım)
//
// Kişiselleştirme katmanı:
//   - Motivasyonlar store'da çoklu olarak saklanır
//   - personalization.ts servisi mesaj/scoring sağlar
//   - Smart reminders bu bilgiyi kullanır
//   - Önerilen ders bu skorlara göre öne çıkar
// ════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 7;
const MAX_MOTIVATIONS = 3;

interface GoalOption {
  xpValue: number;       // İçe XP olarak kayıt (UI'da gösterilmez)
  minutes: number;       // Özet ekranında gösterilir
  emoji: string;
  labelKey: MessageKey;
  minutesKey: MessageKey;
  mascotKey: MessageKey;
}

const GOALS: GoalOption[] = [
  { xpValue: 10, minutes: 5,  emoji: '🌱', labelKey: 'onboarding.goalCasual',   minutesKey: 'onboarding.goalMinutesCasual',   mascotKey: 'onboarding.goalMascotCasual'   },
  { xpValue: 20, minutes: 10, emoji: '⚡', labelKey: 'onboarding.goalNormal',   minutesKey: 'onboarding.goalMinutesNormal',   mascotKey: 'onboarding.goalMascotNormal'   },
  { xpValue: 30, minutes: 15, emoji: '🔥', labelKey: 'onboarding.goalSerious',  minutesKey: 'onboarding.goalMinutesSerious',  mascotKey: 'onboarding.goalMascotSerious'  },
  { xpValue: 50, minutes: 25, emoji: '🏆', labelKey: 'onboarding.goalIntense',  minutesKey: 'onboarding.goalMinutesIntense',  mascotKey: 'onboarding.goalMascotIntense'  },
];

const TASTER_CORRECT_INDEX = 0; // "Merhaba"

export default function OnboardingScreen() {
  const c = useThemeColors();
  const t = useT();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setLearningMotivations = useUserStore((s) => s.setLearningMotivations);
  const setReminderEnabled = useUserStore((s) => s.setReminderEnabled);
  const setLastReminderScheduledAt = useUserStore((s) => s.setLastReminderScheduledAt);
  const setActiveCourse = useUserStore((s) => s.setActiveCourse);
  const setSelectedLevel = useUserStore((s) => s.setSelectedLevel);

  const [step, setStep] = useState<number>(0); // 0..6
  const [motivations, setMotivations] = useState<LearningMotivation[]>([]);
  const [goalXp, setGoalXp] = useState<number>(20); // default Normal
  const [tasterAnswer, setTasterAnswer] = useState<number | null>(null);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(false);
  const [notifBusy, setNotifBusy] = useState(false);
  // 🎯 Placement (seviye belirleme)
  const [startingLevel, setStartingLevel] = useState<CEFRLevel>('A1');
  const [showPlacementTest, setShowPlacementTest] = useState(false);

  // Bird mascot float animation
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withTiming(-8, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
  }, [bob]);
  const birdStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  // ─── Motivasyon toggle (çoklu seçim) ───
  const toggleMotivation = (m: LearningMotivation) => {
    Haptics.selectionAsync().catch(() => {});
    setMotivations((prev) => {
      if (prev.includes(m)) {
        return prev.filter((x) => x !== m);
      }
      if (prev.length >= MAX_MOTIVATIONS) {
        // Max'a ulaşıldı → uyarı haptik + en eskiyi çıkar
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return [...prev.slice(1), m];
      }
      return [...prev, m];
    });
  };

  // ─── Step navigasyon ───
  const goNext = () => {
    Haptics.selectionAsync().catch(() => {});
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };
  const goBack = () => {
    Haptics.selectionAsync().catch(() => {});
    if (step > 0) setStep(step - 1);
  };

  // ─── Step 5 → 6 geçişinde bildirim ayarla ───
  const handleNotificationsChoice = async (enable: boolean) => {
    if (notifBusy) return;
    setNotifBusy(true);
    Haptics.selectionAsync().catch(() => {});

    // Motivasyonları önce kaydet ki smart reminders motivation-aware olsun
    setLearningMotivations(motivations);

    try {
      if (enable) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await refreshSmartReminders();
          setLastReminderScheduledAt(Date.now());
          setReminderEnabled(true);
          setNotifEnabled(true);
        }
      }
    } finally {
      setNotifBusy(false);
      // Özet ekranına geç (step 6)
      setStep(6);
    }
  };

  // ─── Onboarding bitir + ana ekrana yönlendir ───
  const finishOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    completeOnboarding(goalXp);
    setLearningMotivations(motivations); // emin olmak için tekrar
    // 🎯 Placement sonucunu uygula: active course + selected level
    setActiveCourse('tr', 'de', startingLevel);
    setSelectedLevel(startingLevel);
    router.replace('/');
  };

  // Atla — herhangi bir adımdan
  const skipAll = () => {
    Haptics.selectionAsync().catch(() => {});
    // Eğer motivasyon hiç seçilmediyse boş bırak, default goal ile bitir
    if (motivations.length > 0) setLearningMotivations(motivations);
    completeOnboarding(goalXp);
    setActiveCourse('tr', 'de', startingLevel);
    setSelectedLevel(startingLevel);
    router.replace('/');
  };

  // ─── Sonraki butonu disabled mı? ───
  const isNextDisabled = (() => {
    if (step === 2 && motivations.length === 0) return true;
    if (step === 4 && tasterAnswer === null) return true;
    return false;
  })();

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.bgGlow1} pointerEvents="none" />
      <View style={styles.bgGlow2} pointerEvents="none" />

      {/* ═══ ÜST: Progress dots + Atla ═══ */}
      <View style={styles.topBar}>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step && styles.dotActive,
                i < step && styles.dotDone,
              ]}
            />
          ))}
        </View>
        {step > 0 && step < TOTAL_STEPS - 1 ? (
          <Pressable onPress={skipAll} hitSlop={8}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* ═══ ORTA: Aktif step ═══ */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <WelcomeStep t={t} birdStyle={birdStyle} styles={styles} />
        )}
        {step === 1 && (
          <LevelCheckStep
            c={c} t={t} styles={styles}
            startingLevel={startingLevel}
            onChooseScratch={() => {
              Haptics.selectionAsync().catch(() => {});
              setStartingLevel('A1');
              setStep(2);
            }}
            onChoosePlacement={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowPlacementTest(true);
            }}
            birdStyle={birdStyle}
          />
        )}
        {step === 2 && (
          <MotivationStep
            c={c} t={t} styles={styles}
            selected={motivations}
            onToggle={toggleMotivation}
          />
        )}
        {step === 3 && (
          <GoalStep
            c={c} t={t} styles={styles}
            selectedXp={goalXp}
            onSelect={(xp) => {
              Haptics.selectionAsync().catch(() => {});
              setGoalXp(xp);
            }}
            birdStyle={birdStyle}
          />
        )}
        {step === 4 && (
          <TasterStep
            c={c} t={t} styles={styles}
            answer={tasterAnswer}
            onAnswer={(idx) => {
              if (tasterAnswer !== null) return;
              if (idx === TASTER_CORRECT_INDEX) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              }
              setTasterAnswer(idx);
            }}
            birdStyle={birdStyle}
          />
        )}
        {step === 5 && (
          <NotificationsStep
            c={c} t={t} styles={styles}
            onEnable={() => handleNotificationsChoice(true)}
            onSkip={() => handleNotificationsChoice(false)}
            busy={notifBusy}
            birdStyle={birdStyle}
          />
        )}
        {step === 6 && (
          <SummaryStep
            c={c} t={t} styles={styles}
            motivations={motivations}
            goalXp={goalXp}
            notifEnabled={notifEnabled}
            birdStyle={birdStyle}
            onStart={finishOnboarding}
          />
        )}
      </ScrollView>

      {/* ═══ Bottom bar: step 5+ (Notifications, Summary) kendi butonlarına sahip ═══ */}
      {step < 5 ? (
        <View style={styles.bottomBar}>
          {step > 0 ? (
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Ionicons name="chevron-back" size={18} color={c.textMed} />
              <Text style={styles.backButtonText}>{t('onboarding.back')}</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 0 }} />
          )}
          <Pressable
            onPress={step === 1 ? undefined : goNext}
            disabled={isNextDisabled || step === 1}
            style={({ pressed }) => [
              styles.nextButton,
              (isNextDisabled || step === 1) && styles.nextButtonDisabled,
              pressed && !isNextDisabled && step !== 1 && styles.nextButtonPressed,
            ]}
          >
            <Text style={[styles.nextButtonText, (isNextDisabled || step === 1) && { color: c.textLow }]}>
              {step === 0 ? t('onboarding.welcomeContinue') : t('onboarding.next')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={(isNextDisabled || step === 1) ? c.textLow : c.textOnNeon} />
          </Pressable>
        </View>
      ) : null}

      {/* 🎯 Placement Test Modal — step 1'de "Seviyemi test et" seçilirse açılır */}
      {showPlacementTest ? (
        <View style={styles.placementOverlay}>
          <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
            <PlacementTest
              onComplete={(level) => {
                setStartingLevel(level);
                setShowPlacementTest(false);
                // Kısa gecikmeyle bir sonraki step'e geç (kullanıcı sonucu gördükten sonra)
                setTimeout(() => setStep(2), 250);
              }}
              onCancel={() => setShowPlacementTest(false)}
            />
          </SafeAreaView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ════════════════════════════════════════════════════════════════

type StepStyles = ReturnType<typeof makeStyles>;

// ─── Step 1: Welcome ───
function WelcomeStep({
  t, birdStyle, styles,
}: {
  t: ReturnType<typeof useT>;
  birdStyle: ReturnType<typeof useAnimatedStyle>;
  styles: StepStyles;
}) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.welcomeContainer}>
      <Animated.View style={[styles.welcomeAvatar, birdStyle]}>
        <Text style={styles.welcomeBird}>🐦</Text>
      </Animated.View>
      <Text style={styles.welcomeTitle}>{t('onboarding.welcome')}</Text>
      <Text style={styles.welcomeSubtitle}>{t('onboarding.subtitle')}</Text>
    </Animated.View>
  );
}

// ─── Step 2: Motivasyon (ÇOKLU) ───
function MotivationStep({
  c, t, styles, selected, onToggle,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  styles: StepStyles;
  selected: LearningMotivation[];
  onToggle: (m: LearningMotivation) => void;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
      <Text style={styles.stepTitle}>{t('onboarding.motivationTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.motivationSubtitle')}</Text>

      {/* Sayaç badge */}
      <View style={styles.counterBadge}>
        <Ionicons
          name={selected.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
          size={14}
          color={selected.length > 0 ? c.neon : c.textLow}
        />
        <Text
          style={[
            styles.counterText,
            selected.length === MAX_MOTIVATIONS && { color: c.gold },
          ]}
        >
          {t('onboarding.motivationCounter', { count: selected.length })}
        </Text>
      </View>

      {/* Motivasyon kartları */}
      <View style={styles.motivationList}>
        {MOTIVATIONS_META.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const selectionOrder = selected.indexOf(opt.id) + 1;

          return (
            <MotivationCard
              key={opt.id}
              c={c}
              t={t}
              styles={styles}
              opt={opt}
              isSelected={isSelected}
              selectionOrder={selectionOrder}
              onPress={() => onToggle(opt.id)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── MotivationCard ile spring animation ───
function MotivationCard({
  c, t, styles, opt, isSelected, selectionOrder, onPress,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  styles: StepStyles;
  opt: MotivationMeta;
  isSelected: boolean;
  selectionOrder: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withSpring(1.04, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  }, [isSelected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.motivationCard,
          isSelected && styles.motivationCardSelected,
          pressed && styles.motivationCardPressed,
        ]}
      >
        <Text style={styles.motivationEmoji}>{opt.emoji}</Text>
        <Text style={[styles.motivationLabel, isSelected && styles.motivationLabelSelected]}>
          {t(opt.labelKey)}
        </Text>
        {isSelected ? (
          <View style={styles.motivationCheck}>
            <Text style={styles.motivationOrder}>{selectionOrder}</Text>
          </View>
        ) : (
          <View style={styles.motivationEmpty} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Step 3: Hedef ───
function GoalStep({
  c, t, styles, selectedXp, onSelect, birdStyle,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  styles: StepStyles;
  selectedXp: number;
  onSelect: (xp: number) => void;
  birdStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  const selectedGoal = GOALS.find((g) => g.xpValue === selectedXp);
  const mascotMessage = selectedGoal ? t(selectedGoal.mascotKey) : t('onboarding.goalMascotDefault');

  return (
    <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
      <Text style={styles.stepTitle}>{t('onboarding.goalTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.goalSubtitle')}</Text>

      {/* Mascot + konuşma balonu */}
      <View style={styles.mascotRow}>
        <Animated.View style={[styles.mascotAvatar, birdStyle]}>
          <Text style={styles.mascotBird}>🐦</Text>
        </Animated.View>
        <View style={styles.mascotBubble}>
          <Text style={styles.mascotBubbleText}>{mascotMessage}</Text>
        </View>
      </View>

      {/* Hedef kartları */}
      <View style={styles.goalsGrid}>
        {GOALS.map((goal) => {
          const isSelected = selectedXp === goal.xpValue;
          return (
            <Pressable
              key={goal.xpValue}
              onPress={() => onSelect(goal.xpValue)}
              style={({ pressed }) => [
                styles.goalCard,
                isSelected && styles.goalCardSelected,
                pressed && styles.goalCardPressed,
              ]}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                {t(goal.labelKey)}
              </Text>
              <Text style={[styles.goalMinutes, isSelected && styles.goalMinutesSelected]}>
                {t(goal.minutesKey)}
              </Text>
              {isSelected ? (
                <View style={styles.goalCheck}>
                  <Ionicons name="checkmark" size={12} color={c.textOnNeon} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── Step 4: Taster ───
function TasterStep({
  c, t, styles, answer, onAnswer, birdStyle,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  styles: StepStyles;
  answer: number | null;
  onAnswer: (idx: number) => void;
  birdStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  const optionKeys: MessageKey[] = [
    'onboarding.tasterOption1',
    'onboarding.tasterOption2',
    'onboarding.tasterOption3',
    'onboarding.tasterOption4',
  ];

  const isAnswered = answer !== null;
  const isCorrect = answer === TASTER_CORRECT_INDEX;

  return (
    <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
      <Text style={styles.stepTitle}>{t('onboarding.tasterTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.tasterSubtitle')}</Text>

      <View style={styles.questionCard}>
        <Animated.View style={[styles.questionBird, birdStyle]}>
          <Text style={styles.questionBirdEmoji}>🐦</Text>
        </Animated.View>
        <Text style={styles.questionText}>{t('onboarding.tasterQuestion')}</Text>
      </View>

      <View style={styles.optionsList}>
        {optionKeys.map((key, idx) => {
          const isThisSelected = answer === idx;
          const isThisCorrect = idx === TASTER_CORRECT_INDEX;
          const showCorrect = isAnswered && isThisCorrect;
          const showWrong = isAnswered && isThisSelected && !isThisCorrect;

          return (
            <Pressable
              key={idx}
              onPress={() => onAnswer(idx)}
              disabled={isAnswered}
              style={({ pressed }) => [
                styles.optionCard,
                showCorrect && styles.optionCardCorrect,
                showWrong && styles.optionCardWrong,
                pressed && !isAnswered && styles.optionCardPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  showCorrect && styles.optionLabelCorrect,
                  showWrong && styles.optionLabelWrong,
                ]}
              >
                {t(key)}
              </Text>
              {showCorrect ? (
                <Ionicons name="checkmark-circle" size={20} color={c.neon} />
              ) : showWrong ? (
                <Ionicons name="close-circle" size={20} color={c.red} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {isAnswered ? (
        <Animated.View
          entering={FadeIn.duration(280)}
          style={[
            styles.feedbackBox,
            isCorrect ? styles.feedbackBoxCorrect : styles.feedbackBoxWrong,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              { color: isCorrect ? c.neonLight : c.red },
            ]}
          >
            {isCorrect ? t('onboarding.tasterCorrect') : t('onboarding.tasterWrong')}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// ─── Step 5: Notifications ───
function NotificationsStep({
  c, t, styles, onEnable, onSkip, busy, birdStyle,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  styles: StepStyles;
  onEnable: () => void;
  onSkip: () => void;
  busy: boolean;
  birdStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
      <Animated.View style={[styles.notifAvatar, birdStyle]}>
        <Ionicons name="notifications" size={48} color={c.cyan} />
      </Animated.View>

      <Text style={[styles.stepTitle, { textAlign: 'center' }]}>{t('onboarding.notificationsTitle')}</Text>
      <Text style={[styles.stepSubtitle, { textAlign: 'center' }]}>{t('onboarding.notificationsSubtitle')}</Text>

      <View style={styles.benefitsList}>
        <BenefitRow c={c} icon="flame" text={t('onboarding.notificationsBenefit1')} color={c.gold} />
        <BenefitRow c={c} icon="book" text={t('onboarding.notificationsBenefit2')} color={c.neon} />
        <BenefitRow c={c} icon="time" text={t('onboarding.notificationsBenefit3')} color={c.cyan} />
      </View>

      <View style={styles.notifActions}>
        <Pressable
          onPress={onEnable}
          disabled={busy}
          style={({ pressed }) => [
            styles.notifEnableButton,
            busy && { opacity: 0.6 },
            pressed && !busy && styles.notifEnableButtonPressed,
          ]}
        >
          <Ionicons name="notifications" size={18} color={c.textOnNeon} />
          <Text style={styles.notifEnableText}>{t('onboarding.notificationsEnable')}</Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          disabled={busy}
          style={({ pressed }) => [styles.notifSkipButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.notifSkipText}>{t('onboarding.notificationsLater')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Step 6: KİŞİSEL ÖZET — ŞAŞIRTICI ADIM ───
function SummaryStep({
  c, t, styles, motivations, goalXp, notifEnabled, birdStyle, onStart,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  styles: StepStyles;
  motivations: LearningMotivation[];
  goalXp: number;
  notifEnabled: boolean;
  birdStyle: ReturnType<typeof useAnimatedStyle>;
  onStart: () => void;
}) {
  const goal = GOALS.find((g) => g.xpValue === goalXp) ?? GOALS[1];
  const eta = useMemo(() => estimateTimeToA2(goalXp), [goalXp]);

  const etaDescKey: MessageKey =
    eta.description === 'fast' ? 'onboarding.summaryEtaFast'
    : eta.description === 'moderate' ? 'onboarding.summaryEtaModerate'
    : 'onboarding.summaryEtaSlow';

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={{ gap: spacing.md }}
    >
      {/* Header: Mascot + başlık */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.summaryHeader}>
        <Animated.View style={[styles.summaryAvatar, birdStyle]}>
          <Text style={styles.summaryBird}>🐦</Text>
        </Animated.View>
        <Text style={styles.summaryTitle}>{t('onboarding.summaryTitle')}</Text>
        <Text style={styles.summarySubtitle}>{t('onboarding.summarySubtitle')}</Text>
      </Animated.View>

      {/* KART 1: Hedeflerin (Motivasyonlar) */}
      {motivations.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.summaryCard}
        >
          <View style={styles.summaryCardHeader}>
            <View style={[styles.summaryIconBox, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
              <Ionicons name="flag" size={16} color={c.purpleLight} />
            </View>
            <Text style={styles.summaryCardTitle}>{t('onboarding.summaryMotivationTitle')}</Text>
          </View>
          <View style={styles.summaryMotivationsList}>
            {motivations.map((mid, idx) => {
              const meta = getMotivationMeta(mid);
              if (!meta) return null;
              return (
                <Animated.View
                  key={mid}
                  entering={FadeInRight.delay(150 + idx * 80).duration(350)}
                  style={styles.summaryMotivationRow}
                >
                  <Text style={styles.summaryMotivationEmoji}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryMotivationLabel}>{t(meta.labelKey)}</Text>
                    <Text style={styles.summaryMotivationDesc}>{t(meta.summaryKey)}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* KART 2: Günlük Rutin */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={styles.summaryCard}
      >
        <View style={styles.summaryCardHeader}>
          <View style={[styles.summaryIconBox, { backgroundColor: c.neonBg, borderColor: c.neon }]}>
            <Ionicons name="time" size={16} color={c.neon} />
          </View>
          <Text style={styles.summaryCardTitle}>{t('onboarding.summaryRoutineTitle')}</Text>
        </View>
        <View style={styles.summaryStatRow}>
          <Text style={styles.summaryEmoji}>{goal.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryStatBig}>
              {t('onboarding.summaryRoutineDesc', { minutes: goal.minutes })}
            </Text>
            <Text style={styles.summaryStatSmall}>{t(goal.labelKey)}</Text>
          </View>
        </View>
      </Animated.View>

      {/* KART 3: A2'ye tahmini süre */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        style={styles.summaryCard}
      >
        <View style={styles.summaryCardHeader}>
          <View style={[styles.summaryIconBox, { backgroundColor: c.cyanBg, borderColor: c.cyan }]}>
            <Ionicons name="trending-up" size={16} color={c.cyan} />
          </View>
          <Text style={styles.summaryCardTitle}>{t('onboarding.summaryEtaTitle')}</Text>
        </View>
        <View style={styles.summaryEtaRow}>
          <Text style={[styles.summaryEtaBig, { color: c.cyan }]}>
            {t('onboarding.summaryEtaWeeks', { weeks: eta.weeks })}
          </Text>
          <Text style={styles.summaryEtaDesc}>{t(etaDescKey)}</Text>
        </View>
      </Animated.View>

      {/* KART 4: Bildirim durumu */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={[
          styles.summaryNotifCard,
          { borderColor: notifEnabled ? c.gold : c.divider },
        ]}
      >
        <Ionicons
          name={notifEnabled ? 'notifications' : 'notifications-off-outline'}
          size={18}
          color={notifEnabled ? c.gold : c.textLow}
        />
        <Text style={[styles.summaryNotifText, { color: notifEnabled ? c.gold : c.textLow }]}>
          {notifEnabled ? t('onboarding.summaryNotificationsOn') : t('onboarding.summaryNotificationsOff')}
        </Text>
      </Animated.View>

      {/* Mascot mesajı */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(400)}
        style={styles.summaryMascotBubble}
      >
        <Text style={styles.summaryMascotText}>{t('onboarding.summaryMascot')}</Text>
      </Animated.View>

      {/* HADİ BAŞLAYALIM butonu */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)}>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [
            styles.summaryStartButton,
            pressed && { opacity: 0.92, transform: [{ translateY: 1 }] },
          ]}
        >
          <Text style={styles.summaryStartButtonText}>{t('onboarding.summaryStartButton')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function BenefitRow({
  c, icon, text, color,
}: {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={{ ...textStyles.body, color: c.textMed, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════
function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    bgGlow1: {
      position: 'absolute', top: -80, right: -120,
      width: 320, height: 320, borderRadius: 160,
      backgroundColor: c.neon, opacity: 0.08,
    },
    bgGlow2: {
      position: 'absolute', bottom: -60, left: -100,
      width: 280, height: 280, borderRadius: 140,
      backgroundColor: c.purple, opacity: 0.08,
    },

    // Üst progress + skip
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    dotsRow: { flexDirection: 'row', gap: 6, flex: 1 },
    dot: {
      width: 24, height: 4, borderRadius: 2,
      backgroundColor: c.divider,
    },
    dotActive: {
      backgroundColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 4,
    },
    dotDone: { backgroundColor: c.neonDark },
    skipText: { ...textStyles.label, color: c.textLow, fontSize: 13 },

    scrollContent: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },

    // Genel step başlığı
    stepTitle: {
      ...textStyles.display,
      color: c.textHigh,
      fontSize: 24,
      lineHeight: 30,
      marginBottom: spacing.xs,
    },
    stepSubtitle: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 14,
      marginBottom: spacing.lg,
    },

    // ─── Step 1 Welcome ───
    welcomeContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    welcomeAvatar: {
      width: 140, height: 140, borderRadius: 70,
      backgroundColor: c.neonBg,
      borderWidth: 2, borderColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 22, elevation: 12,
      marginBottom: spacing.lg,
    },
    welcomeBird: { fontSize: 80 },
    welcomeTitle: {
      ...textStyles.display, color: c.textHigh, textAlign: 'center', fontSize: 30,
    },
    welcomeSubtitle: {
      ...textStyles.body, color: c.textMed, textAlign: 'center', fontSize: 15,
      paddingHorizontal: spacing.md,
    },

    // ─── Step 2 Motivasyon ───
    counterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.pill,
      marginBottom: spacing.md,
    },
    counterText: { ...textStyles.label, color: c.textMed, fontSize: 11 },

    motivationList: { gap: spacing.sm },
    motivationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.glassBg,
      borderWidth: 1.5, borderColor: c.glassBorderStrong,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      minHeight: 56,
    },
    motivationCardSelected: {
      borderColor: c.neon,
      backgroundColor: c.neonBg,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45, shadowRadius: 10, elevation: 5,
    },
    motivationCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    motivationEmoji: { fontSize: 24 },
    motivationLabel: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15, flex: 1 },
    motivationLabelSelected: { color: c.neonLight },
    motivationCheck: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
    },
    motivationOrder: { ...textStyles.bodyBold, color: c.textOnNeon, fontSize: 13 },
    motivationEmpty: { width: 24, height: 24 },

    // ─── Step 3 Hedef ───
    mascotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.xs,
    },
    mascotAvatar: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: c.neonBg,
      borderWidth: 1.5, borderColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
    },
    mascotBird: { fontSize: 32 },
    mascotBubble: {
      flex: 1,
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    mascotBubbleText: { ...textStyles.body, color: c.textHigh, fontSize: 13, lineHeight: 18 },

    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    goalCard: {
      flexBasis: '47%', flexGrow: 1,
      backgroundColor: c.glassBg,
      borderWidth: 1.5, borderColor: c.glassBorderStrong,
      borderRadius: radius.lg,
      padding: spacing.base,
      alignItems: 'center', gap: 4,
      minHeight: 130,
      justifyContent: 'center',
    },
    goalCardSelected: {
      borderColor: c.neon, backgroundColor: c.neonBg,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
    },
    goalCardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    goalEmoji: { fontSize: 36 },
    goalLabel: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 16 },
    goalLabelSelected: { color: c.neonLight },
    goalMinutes: { ...textStyles.body, color: c.textLow, fontSize: 13 },
    goalMinutesSelected: { color: c.neon },
    goalCheck: {
      position: 'absolute', top: 8, right: 8,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
    },

    // ─── Step 4 Taster ───
    questionCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    questionBird: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: c.neonBg,
      borderWidth: 1.5, borderColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
    },
    questionBirdEmoji: { fontSize: 32 },
    questionText: { ...textStyles.heading, color: c.textHigh, fontSize: 24, textAlign: 'center' },

    optionsList: { gap: spacing.sm },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.glassBg,
      borderWidth: 1.5, borderColor: c.glassBorderStrong,
      borderRadius: radius.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      minHeight: 52,
    },
    optionCardCorrect: { borderColor: c.neon, backgroundColor: c.neonBg },
    optionCardWrong: { borderColor: c.red, backgroundColor: c.redBg },
    optionCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    optionLabel: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    optionLabelCorrect: { color: c.neonLight },
    optionLabelWrong: { color: c.red },

    feedbackBox: {
      marginTop: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.base,
      alignItems: 'center',
    },
    feedbackBoxCorrect: { backgroundColor: c.neonBg, borderColor: c.neon },
    feedbackBoxWrong: { backgroundColor: c.redBg, borderColor: c.red },
    feedbackText: { ...textStyles.bodyBold, fontSize: 14, textAlign: 'center' },

    // ─── Step 5 Notifications ───
    notifAvatar: {
      alignSelf: 'center',
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: c.cyanBg,
      borderWidth: 2, borderColor: c.cyan,
      alignItems: 'center', justifyContent: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: c.cyan, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 18, elevation: 8,
    },
    benefitsList: {
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.base,
      marginVertical: spacing.lg,
      gap: 4,
    },
    notifActions: { gap: spacing.sm },
    notifEnableButton: {
      flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.neon,
      borderRadius: radius.md,
      minHeight: 54,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
    },
    notifEnableButtonPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
    notifEnableText: { ...textStyles.button, color: c.textOnNeon, fontSize: 16 },
    notifSkipButton: {
      alignItems: 'center', justifyContent: 'center',
      minHeight: 48,
    },
    notifSkipText: { ...textStyles.label, color: c.textLow, fontSize: 14 },

    // ─── Step 6 SUMMARY (Kişisel Özet) ───
    summaryHeader: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    summaryAvatar: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: c.neonBg,
      borderWidth: 2, borderColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 16, elevation: 10,
      marginBottom: spacing.sm,
    },
    summaryBird: { fontSize: 48 },
    summaryTitle: {
      ...textStyles.display, color: c.textHigh, textAlign: 'center', fontSize: 26,
    },
    summarySubtitle: {
      ...textStyles.body, color: c.textLow, textAlign: 'center', fontSize: 13,
    },

    summaryCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.base,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    summaryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    summaryIconBox: {
      width: 28, height: 28, borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    summaryCardTitle: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 11,
      letterSpacing: 1,
    },

    summaryMotivationsList: { gap: spacing.sm, marginTop: 4 },
    summaryMotivationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    summaryMotivationEmoji: { fontSize: 22 },
    summaryMotivationLabel: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    summaryMotivationDesc: { ...textStyles.body, color: c.textLow, fontSize: 11, lineHeight: 14 },

    summaryStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
    summaryEmoji: { fontSize: 28 },
    summaryStatBig: { ...textStyles.bodyBold, color: c.neonLight, fontSize: 16 },
    summaryStatSmall: { ...textStyles.body, color: c.textLow, fontSize: 12 },

    summaryEtaRow: { gap: 4, marginTop: 4 },
    summaryEtaBig: { ...textStyles.display, fontSize: 28 },
    summaryEtaDesc: { ...textStyles.body, color: c.textMed, fontSize: 13 },

    summaryNotifCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderRadius: radius.md,
    },
    summaryNotifText: { ...textStyles.bodyBold, fontSize: 13 },

    summaryMascotBubble: {
      backgroundColor: c.purpleBg,
      borderWidth: 1, borderColor: c.purple,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    summaryMascotText: {
      ...textStyles.body,
      color: c.purpleLight,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },

    summaryStartButton: {
      flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.neon,
      borderRadius: radius.md,
      minHeight: 60,
      marginTop: spacing.md,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 16, elevation: 10,
    },
    summaryStartButtonText: {
      ...textStyles.button, color: c.textOnNeon, fontSize: 17,
    },

    // ─── Alt bar ───
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    backButtonPressed: { opacity: 0.6 },
    backButtonText: { ...textStyles.body, color: c.textMed, fontSize: 14 },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.neon,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xl,
      minHeight: 50,
      flex: 1,
      maxWidth: 240,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
    },
    nextButtonPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
    nextButtonDisabled: {
      backgroundColor: c.surfaceElevated,
      shadowOpacity: 0, elevation: 0,
    },
    nextButtonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 15 },
  });
}
