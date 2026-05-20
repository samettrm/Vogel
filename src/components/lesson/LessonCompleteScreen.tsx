import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { Confetti } from '../feedback/Confetti';

type LessonCompleteScreenProps = {
  xpEarned: number;
  correctCount: number;
  totalExercises: number;
  heartsRemaining: number;
  maxHearts: number;
  onContinue: () => void;
  isUnitComplete?: boolean;
};

type ResultStyle = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  iconShadowColor: string;
  titleKey: string;
  subtitleKey: string;
  buttonLabel: string;
  tone: 'positive' | 'neutral' | 'retry';
};

function getResultStyle(
  c: ReturnType<typeof useThemeColors>,
  accuracy: number,
  isUnitComplete: boolean,
): ResultStyle {
  if (accuracy === 0) {
    return {
      icon: 'refresh-circle',
      iconColor: '#FB7185',
      iconBgColor: 'rgba(239, 68, 68, 0.18)',
      iconShadowColor: c.red,
      titleKey: 'lessonComplete.retryTitle',
      subtitleKey: 'lessonComplete.retryDesc',
      buttonLabel: 'common.retry',
      tone: 'retry',
    };
  }
  if (accuracy < 40) {
    return {
      icon: 'leaf',
      iconColor: c.cyan,
      iconBgColor: 'rgba(34, 211, 238, 0.18)',
      iconShadowColor: c.cyan,
      titleKey: 'lessonComplete.growthTitle',
      subtitleKey: 'lessonComplete.growthDesc',
      buttonLabel: 'common.continue',
      tone: 'neutral',
    };
  }
  if (accuracy < 70) {
    return {
      icon: 'medal',
      iconColor: '#CD7F32',
      iconBgColor: 'rgba(205, 127, 50, 0.18)',
      iconShadowColor: '#CD7F32',
      titleKey: 'lessonComplete.goodTitle',
      subtitleKey: 'lessonComplete.goodDesc',
      buttonLabel: 'common.continue',
      tone: 'positive',
    };
  }
  if (accuracy < 90) {
    return {
      icon: 'trophy',
      iconColor: '#C0C0C0',
      iconBgColor: 'rgba(192, 192, 192, 0.18)',
      iconShadowColor: '#C0C0C0',
      titleKey: 'lessonComplete.greatTitle',
      subtitleKey: 'lessonComplete.greatDesc',
      buttonLabel: 'common.continue',
      tone: 'positive',
    };
  }
  return {
    icon: 'trophy',
    iconColor: c.gold,
    iconBgColor: c.goldBg,
    iconShadowColor: c.gold,
    titleKey: isUnitComplete ? 'lessonComplete.unitCompleteTitle' : 'lessonComplete.perfectTitle',
    subtitleKey: isUnitComplete ? 'lessonComplete.unitCompleteDesc' : 'lessonComplete.perfectDesc',
    buttonLabel: 'common.continue',
    tone: 'positive',
  };
}

export function LessonCompleteScreen({
  xpEarned, correctCount, totalExercises,
  heartsRemaining, maxHearts, onContinue, isUnitComplete = false,
}: LessonCompleteScreenProps) {
  const c = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const accuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;
  const result = getResultStyle(c, accuracy, isUnitComplete);

  const iconScale = useSharedValue(0);
  const xpProgress = useSharedValue(0);
  const [displayedXp, setDisplayedXp] = useState(0);

  useEffect(() => {
    if (result.tone === 'retry') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    iconScale.value = withSpring(1, { damping: 11, stiffness: 140, mass: 0.6 });
    xpProgress.value = 0;
    xpProgress.value = withDelay(250, withTiming(xpEarned, { duration: 900, easing: Easing.out(Easing.cubic) }));
    return () => {
      cancelAnimation(xpProgress);
      cancelAnimation(iconScale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpEarned]);

  useAnimatedReaction(
    () => Math.round(xpProgress.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplayedXp)(current);
    },
  );

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const styles = makeStyles(c);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + spacing.xl }]}>
      <View style={[styles.bgGlow, { backgroundColor: result.iconShadowColor }]} pointerEvents="none" />

      {/* 🎊 Konfeti — SADECE ders sonu (positive tone) için patlar.
          Tek mount'ta animasyon, sonra fade out. UI thread'de çalışır. */}
      {result.tone === 'positive' ? (
        <Confetti origin="top" count={20} fullScreen baseDuration={1800} />
      ) : null}

      <View style={styles.celebration}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: result.iconBgColor,
              borderColor: result.iconShadowColor,
              shadowColor: result.iconShadowColor,
            },
            iconStyle,
          ]}
        >
          <Ionicons name={result.icon} size={72} color={result.iconColor} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(150).duration(300)}
          style={[styles.title, { color: result.iconColor }]}
        >
          {t(result.titleKey as 'lessonComplete.perfectTitle')}
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(220).duration(300)}
          style={styles.subtitle}
        >
          {t(result.subtitleKey as 'lessonComplete.perfectDesc')}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeIn.delay(320).duration(300)} style={styles.statsRow}>
        <StatCard c={c} icon="flash" tone={c.gold} toneBg={c.goldBg}
          label={t('lessonComplete.totalXp')} value={`+${displayedXp}`} />
        <StatCard c={c} icon="checkmark-circle"
          tone={accuracy >= 70 ? c.neon : accuracy >= 40 ? c.cyan : '#FB7185'}
          toneBg={accuracy >= 70 ? c.neonBg : accuracy >= 40 ? 'rgba(34, 211, 238, 0.18)' : 'rgba(239, 68, 68, 0.18)'}
          label={t('lessonComplete.accuracyLabel')} value={`%${accuracy}`} />
        <StatCard c={c} icon="heart" tone={c.red} toneBg={c.redBg}
          label={t('lessonComplete.heartsLabel')} value={`${heartsRemaining}/${maxHearts}`} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(450).duration(300)} style={styles.buttonWrap}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: result.tone === 'retry' ? c.red : c.neon,
              shadowColor: result.tone === 'retry' ? c.red : c.neon,
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.continueButtonText,
              { color: result.tone === 'retry' ? c.white : c.textOnNeon },
            ]}
          >{t(result.buttonLabel as 'common.continue')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function StatCard({
  c, icon, tone, toneBg, label, value,
}: {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string; toneBg: string;
  label: string; value: string;
}) {
  const styles = makeStyles(c);
  return (
    <View style={[styles.statCard, { borderColor: tone, backgroundColor: toneBg }]}>
      <View style={[styles.statHeader, { backgroundColor: tone }]}>
        <Text style={[styles.statHeaderText, { color: c.bg }]}>{label}</Text>
      </View>
      <View style={styles.statBody}>
        <Ionicons name={icon} size={22} color={tone} />
        <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      </View>
    </View>
  );
}

const ICON_SIZE = 140;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1, backgroundColor: c.bg,
      paddingHorizontal: spacing.base, paddingTop: spacing.xxxl,
      justifyContent: 'space-between',
    },
    bgGlow: {
      position: 'absolute', top: -80, alignSelf: 'center',
      width: 320, height: 320, borderRadius: 160, opacity: 0.08,
    },
    celebration: { alignItems: 'center', gap: spacing.base, marginTop: spacing.xl },
    iconCircle: {
      width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2,
      borderWidth: 2, alignItems: 'center', justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
    },
    title: { ...textStyles.display, textAlign: 'center', marginTop: spacing.sm, fontSize: 30 },
    subtitle: {
      ...textStyles.body, color: c.textMed,
      textAlign: 'center', paddingHorizontal: spacing.base,
    },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: { flex: 1, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
    statHeader: { paddingVertical: spacing.xs, alignItems: 'center' },
    statHeaderText: { ...textStyles.label, fontSize: 10 },
    statBody: { paddingVertical: spacing.md, alignItems: 'center', gap: spacing.xs },
    statValue: { ...textStyles.subheading, fontSize: 20 },
    buttonWrap: { paddingHorizontal: spacing.xs },
    continueButton: {
      minHeight: 56, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
    },
    continueButtonText: { ...textStyles.button, fontSize: 18 },
    pressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  });
}
