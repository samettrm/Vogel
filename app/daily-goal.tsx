import React, { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing, FadeInDown,
  useAnimatedStyle, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { useUserStore } from '../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';

const DAILY_XP_GOAL_FALLBACK = 30;

export default function DailyGoalScreen() {
  const c = useThemeColors();
  const t = useT();
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const dailyQuests = useUserStore((s) => (s as { dailyQuests?: unknown[] }).dailyQuests);

  const { dailyCurrent, dailyTarget } = useMemo(() => {
    const list = (dailyQuests ?? []) as { type?: string; progress?: number; target?: number }[];
    const earnXpQuest = list.find((q) => q?.type === 'earnXp');
    if (earnXpQuest && typeof earnXpQuest.target === 'number') {
      return {
        dailyCurrent: earnXpQuest.progress ?? 0,
        dailyTarget: earnXpQuest.target,
      };
    }
    return { dailyCurrent: 0, dailyTarget: DAILY_XP_GOAL_FALLBACK };
  }, [dailyQuests]);

  const isComplete = dailyCurrent >= dailyTarget;
  const remaining = Math.max(0, dailyTarget - dailyCurrent);
  const ratio = Math.min(1, Math.max(0, dailyCurrent / Math.max(1, dailyTarget)));
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [ratio, fill]);

  const ringFillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.bgGlow} pointerEvents="none" />

      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={c.textHigh} />
        </Pressable>
        <Text style={styles.title}>{t('dailyGoal.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(420).springify().damping(14)}
          style={styles.heroCard}
        >
          <View style={styles.topHighlight} pointerEvents="none" />
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: isComplete ? c.gold : c.neon,
                shadowColor: isComplete ? c.gold : c.neon,
              },
            ]}
          >
            <Ionicons
              name={isComplete ? 'trophy' : 'flag'}
              size={36}
              color={c.bg}
            />
          </View>

          <Text style={styles.heroStatus}>
            {isComplete ? '🎉' : `${remaining} XP`}
          </Text>
          <Text style={[styles.heroPercent, { color: isComplete ? c.gold : c.neon }]}>
            %{Math.round(ratio * 100)}
          </Text>

          <View style={styles.heroBarTrack}>
            <Animated.View
              style={[
                styles.heroBarFill,
                { backgroundColor: isComplete ? c.gold : c.neon, shadowColor: isComplete ? c.gold : c.neon },
                ringFillStyle,
              ]}
            >
              <View style={styles.heroBarHighlight} pointerEvents="none" />
            </Animated.View>
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.heroDetail}>
              <Text style={styles.heroDetailLabel}>{t('dailyGoal.todayProgress')}</Text>
              <Text style={[styles.heroDetailValue, { color: isComplete ? c.gold : c.neon }]}>
                {dailyCurrent}
              </Text>
              <Text style={styles.heroDetailUnit}>XP</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroDetail}>
              <Text style={styles.heroDetailLabel}>{t('profile.dailyGoal')}</Text>
              <Text style={[styles.heroDetailValue, { color: c.textHigh }]}>{dailyTarget}</Text>
              <Text style={styles.heroDetailUnit}>XP</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroDetail}>
              <Text style={styles.heroDetailLabel}>{t('lessons.total')}</Text>
              <Text style={[styles.heroDetailValue, { color: c.textHigh }]}>{xp}</Text>
              <Text style={styles.heroDetailUnit}>XP</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400).springify().damping(14)}
          style={styles.infoCard}
        >
          <View style={styles.topHighlight} pointerEvents="none" />
          <View style={styles.infoIconBox}>
            <Ionicons name="bulb" size={18} color={c.gold} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>{t('dailyGoal.streakTitle')}</Text>
            <Text style={styles.infoDescription}>{t('dailyGoal.streakDesc')}</Text>
            {streak > 0 ? (
              <Text style={[styles.infoDescription, { color: c.gold, marginTop: 4 }]}>
                🔥 {t('profile.streakDays', { n: streak })}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(400).springify().damping(14)}>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          >
            <Ionicons name="play" size={20} color={c.textOnNeon} />
            <Text style={styles.ctaButtonText}>{t('common.start')}</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    bgGlow: {
      position: 'absolute', top: -60, alignSelf: 'center',
      width: 320, height: 320, borderRadius: 160,
      backgroundColor: c.gold, opacity: 0.06,
    },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center',
    },
    backButtonPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
    title: { ...textStyles.subheading, color: c.textHigh },
    headerSpacer: { width: 40 },
    scrollContent: { paddingHorizontal: spacing.base, gap: spacing.base, paddingTop: spacing.sm },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    heroCard: {
      alignItems: 'center',
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.xl, borderWidth: 1, borderColor: c.glassBorder,
      padding: spacing.lg, gap: spacing.sm, overflow: 'hidden',
    },
    heroIcon: {
      width: 80, height: 80, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 16, elevation: 10,
    },
    heroStatus: {
      ...textStyles.bodyBold, color: c.textMed,
      fontSize: 14, textTransform: 'uppercase', letterSpacing: 1,
    },
    heroPercent: { ...textStyles.display, fontSize: 56, lineHeight: 60 },
    heroBarTrack: {
      width: '100%', height: 18, borderRadius: 9,
      backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.divider,
      overflow: 'hidden', marginVertical: spacing.sm,
    },
    heroBarFill: {
      height: '100%', borderRadius: 9,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 8, elevation: 4,
    },
    heroBarHighlight: {
      position: 'absolute', top: 2,
      left: 4, right: 4, height: 2,
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderRadius: 1,
    },
    heroDetails: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
      width: '100%', paddingTop: spacing.sm,
      borderTopWidth: 1, borderTopColor: c.divider,
    },
    heroDetail: { flex: 1, alignItems: 'center', gap: 2 },
    heroDivider: { width: 1, height: 40, backgroundColor: c.divider },
    heroDetailLabel: { ...textStyles.label, color: c.textLow, fontSize: 9 },
    heroDetailValue: { ...textStyles.subheading, fontSize: 20 },
    heroDetailUnit: { ...textStyles.label, color: c.textMuted, fontSize: 10 },
    infoCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.lg, padding: spacing.base, overflow: 'hidden',
    },
    infoIconBox: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: c.goldBg,
      borderWidth: 1, borderColor: c.gold,
      alignItems: 'center', justifyContent: 'center',
    },
    infoText: { flex: 1, gap: 4 },
    infoTitle: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    infoDescription: { ...textStyles.body, color: c.textLow, fontSize: 13, lineHeight: 18 },
    ctaButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, minHeight: 56,
      borderRadius: radius.md, backgroundColor: c.neon,
      paddingHorizontal: spacing.lg,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 14, elevation: 8,
    },
    ctaButtonPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
    ctaButtonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 16 },
  });
}
