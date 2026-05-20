import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface DailyGoalCardProps {
  current: number;
  target: number;
  streakDays?: number;
  onPress?: () => void;
}

export function DailyGoalCard({ current, target, streakDays = 0, onPress }: DailyGoalCardProps) {
  const c = useThemeColors();
  const t = useT();
  const ratio = Math.min(1, Math.max(0, current / Math.max(1, target)));
  const isComplete = current >= target;
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [ratio, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  const accent = isComplete ? c.gold : c.neon;
  const accentGlow = isComplete ? c.goldGlow : c.neonGlow;
  const styles = makeStyles(c);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: accent },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: accent, shadowColor: accentGlow }]}>
            <Ionicons name={isComplete ? 'trophy' : 'flag'} size={16} color={c.bg} />
          </View>
          <View>
            <Text style={styles.title}>{t('profile.dailyGoal')}</Text>
            {isComplete ? (
              <Text style={[styles.subtitle, { color: c.gold }]}>🎉</Text>
            ) : (
              <Text style={styles.subtitle}>{target - current} XP</Text>
            )}
          </View>
        </View>

        {streakDays > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streakDays}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { backgroundColor: accent, shadowColor: accentGlow }, fillStyle]}>
          <View style={styles.barHighlight} pointerEvents="none" />
        </Animated.View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.progressText}>
          <Text style={[styles.progressCurrent, { color: accent }]}>{current}</Text>
          <Text style={styles.progressSeparator}> / {target} XP</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const BAR_HEIGHT = 14;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg, borderWidth: 1,
      padding: spacing.base, gap: spacing.sm, overflow: 'hidden',
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconCircle: {
      width: 28, height: 28, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 8, elevation: 4,
    },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    subtitle: { ...textStyles.body, color: c.textLow, fontSize: 12 },
    streakBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: spacing.sm, paddingVertical: 4,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.pill,
    },
    streakEmoji: { fontSize: 12 },
    streakText: { ...textStyles.bodyBold, color: c.gold, fontSize: 13 },
    barTrack: {
      height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.divider,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%', borderRadius: BAR_HEIGHT / 2,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 6, elevation: 4,
    },
    barHighlight: {
      position: 'absolute', top: 2,
      left: 4, right: 4, height: 2,
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderRadius: 1,
    },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    progressText: { ...textStyles.bodyBold },
    progressCurrent: { fontSize: 14 },
    progressSeparator: { color: c.textLow, fontSize: 13, fontWeight: '600' },
  });
}
