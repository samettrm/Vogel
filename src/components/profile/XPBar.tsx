import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface XPBarProps {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  totalXp?: number;
}

export function XPBar({ level, xpInLevel, xpForNext, totalXp }: XPBarProps) {
  const c = useThemeColors();
  const t = useT();
  const ratio = Math.min(1, Math.max(0, xpInLevel / Math.max(1, xpForNext)));
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [ratio, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const styles = makeStyles(c);

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.headerRow}>
        <View style={styles.levelInfo}>
          <Ionicons name="star" size={18} color={c.gold} />
          <Text style={styles.levelText}>{t('profile.level')} {level}</Text>
        </View>
        <Text style={styles.nextLevel}>{t('profile.nextLevel')}: {level + 1}</Text>
      </View>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, fillStyle]}>
          <View style={styles.barHighlight} pointerEvents="none" />
          <View style={styles.barBottomShade} pointerEvents="none" />
        </Animated.View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.xpText}>
          <Text style={styles.xpCurrent}>{xpInLevel}</Text>
          <Text style={styles.xpSeparator}> / {xpForNext} XP</Text>
        </Text>
        {totalXp !== undefined ? (
          <Text style={styles.totalText}>{t('profile.xpProgress')}: {totalXp} XP</Text>
        ) : null}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 20;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.base,
      overflow: 'hidden', gap: spacing.sm,
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    levelInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    levelText: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    nextLevel: { ...textStyles.label, color: c.textLow },
    barTrack: {
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
      backgroundColor: c.surface,
      overflow: 'hidden',
      borderWidth: 1.5, borderColor: c.divider,
    },
    barFill: {
      height: '100%',
      borderRadius: BAR_HEIGHT / 2,
      backgroundColor: c.neonDark,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 6, elevation: 4,
    },
    barHighlight: {
      position: 'absolute', top: 3,
      left: 6, right: 6, height: 3,
      backgroundColor: c.neonLight,
      borderRadius: 1.5, opacity: 0.7,
    },
    barBottomShade: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: BAR_HEIGHT / 2,
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      borderBottomLeftRadius: BAR_HEIGHT / 2,
      borderBottomRightRadius: BAR_HEIGHT / 2,
    },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    xpText: { ...textStyles.bodyBold },
    xpCurrent: { color: c.neon },
    xpSeparator: { color: c.textLow, fontWeight: '600' },
    totalText: { ...textStyles.label, color: c.textMuted },
  });
}
