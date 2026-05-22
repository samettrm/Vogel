import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// PROGRESS CARD — XP seviyesi kartı
// ════════════════════════════════════════════════════════════════

interface ProgressCardProps {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  totalXp: number;
}

export function ProgressCard({
  level,
  xpInLevel,
  xpForNext,
  totalXp,
}: ProgressCardProps) {
  const c = useThemeColors();
  const t = useT();

  const xpRatio = Math.min(1, Math.max(0, xpInLevel / Math.max(1, xpForNext)));

  const xpFill = useSharedValue(0);

  useEffect(() => {
    xpFill.value = withTiming(xpRatio, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [xpRatio, xpFill]);

  const xpFillStyle = useAnimatedStyle(() => ({ width: `${xpFill.value * 100}%` }));

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.titleGroup}>
            <Ionicons name="star" size={16} color={c.neon} />
            <Text style={styles.title}>{t('profile.level')} {level}</Text>
          </View>
          <Text style={styles.metaText}>
            <Text style={[styles.metaValue, { color: c.neon }]}>{xpInLevel}</Text>
            <Text style={styles.metaSeparator}> / {xpForNext} XP</Text>
          </Text>
        </View>

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { backgroundColor: c.neon }, xpFillStyle]} />
        </View>

        <Text style={styles.subText}>
          {t('profile.xpProgress')}: {totalXp} XP · {t('profile.nextLevel')}: {level + 1}
        </Text>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 12;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.base,
      gap: spacing.md,
      overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    section: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    metaText: { flexDirection: 'row', alignItems: 'baseline' },
    metaValue: { ...textStyles.bodyBold, fontSize: 14 },
    metaSeparator: { ...textStyles.body, color: c.textLow, fontSize: 12 },
    barTrack: {
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: BAR_HEIGHT / 2,
    },
    subText: { ...textStyles.label, color: c.textMuted, fontSize: 10 },
  });
}
