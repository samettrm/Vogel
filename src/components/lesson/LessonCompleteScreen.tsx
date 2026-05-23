import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../utils/haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { SpinningDiamondGem } from '../shared/SpinningDiamondGem';
import { Confetti } from '../feedback/Confetti';

type LessonCompleteScreenProps = {
  xpEarned: number;
  correctCount: number;
  totalExercises: number;
  heartsRemaining: number;
  maxHearts: number;
  onContinue: () => void;
  isUnitComplete?: boolean;
  isPremium?: boolean;
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
  heartsRemaining, maxHearts, onContinue, isUnitComplete = false, isPremium = false,
}: LessonCompleteScreenProps) {
  const c = useThemeColors();
  const t = useT();
  const showLowHeartsBanner = !isPremium && heartsRemaining <= 1;
  const insets = useSafeAreaInsets();
  const accuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;
  const result = getResultStyle(c, accuracy, isUnitComplete);

  const iconScale = useSharedValue(0);
  // Tüm içerik için tek opacity — 5 ayrı FadeIn yerine 1 animasyon
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (result.tone === 'retry') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    // Daha sert yay → daha hızlı snap, daha az overshot
    iconScale.value = withSpring(1, { damping: 18, stiffness: 220, mass: 0.5 });
    // Tek basit opacity fade
    contentOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    return () => {
      cancelAnimation(iconScale);
      cancelAnimation(contentOpacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  // Çıkışta animasyonları temiz kapat, sonra navigate et
  const handleContinue = () => {
    cancelAnimation(iconScale);
    cancelAnimation(contentOpacity);
    onContinue();
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + spacing.xl }]}>
      <View style={[styles.bgGlow, { backgroundColor: result.iconShadowColor }]} pointerEvents="none" />

      {/* 🎊 Konfeti — parçacık sayısı azaltıldı: daha az worklet yükü */}
      {result.tone === 'positive' ? (
        <Confetti origin="top" count={10} baseDuration={1400} />
      ) : null}

      {/* Tek opacity wrapper — 5 ayrı FadeIn.delay() yerine */}
      <Animated.View style={[styles.innerContent, contentStyle]}>

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

          <Text style={[styles.title, { color: result.iconColor }]}>
            {t(result.titleKey as 'lessonComplete.perfectTitle')}
          </Text>

          <Text style={styles.subtitle}>
            {t(result.subtitleKey as 'lessonComplete.perfectDesc')}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard c={c} icon="flash" tone={c.gold} toneBg={c.goldBg}
            label={t('lessonComplete.totalXp')} value={`+${xpEarned}`} />
          <StatCard c={c} icon="checkmark-circle"
            tone={accuracy >= 70 ? c.neon : accuracy >= 40 ? c.cyan : '#FB7185'}
            toneBg={accuracy >= 70 ? c.neonBg : accuracy >= 40 ? 'rgba(34, 211, 238, 0.18)' : 'rgba(239, 68, 68, 0.18)'}
            label={t('lessonComplete.accuracyLabel')} value={`%${accuracy}`} />
          <StatCard c={c} icon="heart"
            tone={isPremium ? c.neon : c.red}
            toneBg={isPremium ? c.neonBg : c.redBg}
            label={t('lessonComplete.heartsLabel')}
            value={isPremium ? '∞' : `${heartsRemaining}/${maxHearts}`} />
        </View>

        {/* ❤️ Düşük can uyarısı */}
        {showLowHeartsBanner ? (
          <Pressable
            onPress={() => { handleContinue(); router.push('/(tabs)/shop'); }}
            style={({ pressed }) => [styles.lowHeartsCard, pressed && styles.lowHeartsCardPressed]}
          >
            <View style={styles.lowHeartsHighlight} pointerEvents="none" />
            <View style={styles.lowHeartsLeft}>
              <SpinningDiamondGem size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lowHeartsTitle}>Canın bitmeden önce al! ❤️</Text>
                <Text style={styles.lowHeartsSub}>Vogel Plus → Sınırsız can · Günde ₺3.3</Text>
              </View>
            </View>
            <View style={styles.lowHeartsArrow}>
              <Ionicons name="chevron-forward" size={16} color={c.purpleLight} />
            </View>
          </Pressable>
        ) : null}

        <View style={styles.buttonWrap}>
          <Pressable
            onPress={handleContinue}
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
        </View>

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
    },
    innerContent: {
      flex: 1,
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
    // Premium upsell — güçlü mor CTA (NoHeartsScreen ile aynı dil)
    lowHeartsCard: {
      width: '100%',
      backgroundColor: c.purple,
      borderRadius: radius.lg,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
      gap: spacing.md, overflow: 'hidden',
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
    },
    lowHeartsCardPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    lowHeartsHighlight: {
      position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg,
      height: 1, backgroundColor: 'rgba(255,255,255,0.2)',
    },
    lowHeartsLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    lowHeartsTitle: { ...textStyles.button, color: c.white, fontSize: 14 },
    lowHeartsSub: { ...textStyles.body, color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
    lowHeartsArrow: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
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
