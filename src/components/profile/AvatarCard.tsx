import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface AvatarCardProps {
  level: number;
  username?: string;
  joinedLabel?: string;
  xpInLevel?: number;
  xpForNext?: number;
}

export function AvatarCard({ level, username, joinedLabel, xpInLevel = 0, xpForNext = 100 }: AvatarCardProps) {
  const c = useThemeColors();
  const t = useT();
  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);
  const xpFill = useSharedValue(0);

  const xpRatio = Math.min(1, Math.max(0, xpInLevel / Math.max(1, xpForNext)));

  useEffect(() => {
    bob.value = withRepeat(
      withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
    tilt.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 400 }),
        withTiming(5, { duration: 800 }),
        withTiming(0, { duration: 400 }),
        withTiming(0, { duration: 2200 }),
      ),
      -1, false,
    );
    return () => {
      cancelAnimation(bob);
      cancelAnimation(tilt);
    };
  }, [bob, tilt]);

  useEffect(() => {
    xpFill.value = withTiming(xpRatio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [xpRatio, xpFill]);

  const birdStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { rotate: `${tilt.value}deg` }],
  }));

  const xpFillStyle = useAnimatedStyle(() => ({
    width: `${xpFill.value * 100}%`,
  }));

  const styles = useMemo(() => makeStyles(c), [c]);
  const defaultUsername = username ?? 'Vogel';
  const defaultJoinedLabel = joinedLabel ?? 'Almanca';

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />

      {/* Avatar satırı */}
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarGlowRing} pointerEvents="none" />
          <View style={styles.avatarCircle}>
            <Animated.Text style={[styles.bird, birdStyle]}>🐦</Animated.Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeLabel}>{t('profile.level')}</Text>
            <Text style={styles.levelBadgeValue}>{level}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{defaultUsername}</Text>
          <Text style={styles.joined}>{defaultJoinedLabel}</Text>
        </View>
      </View>

      {/* XP progress bölümü */}
      <View style={styles.xpSection}>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>{t('profile.level')} {level}</Text>
          <Text style={styles.xpMeta}>
            <Text style={[styles.xpVal, { color: c.neon }]}>{xpInLevel}</Text>
            <Text style={styles.xpOf}> / {xpForNext} XP</Text>
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <Animated.View style={[styles.xpBar, { backgroundColor: c.neon }, xpFillStyle]} />
        </View>
        <Text style={styles.xpHint}>
          {t('profile.nextLevel')}: {level + 1} · {xpForNext - xpInLevel} XP kaldı
        </Text>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 72;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.base,
      overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
    avatarWrap: {
      width: AVATAR_SIZE, height: AVATAR_SIZE,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarGlowRing: {
      position: 'absolute',
      width: AVATAR_SIZE, height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: c.neonBg,
      borderWidth: 1.5, borderColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    avatarCircle: {
      width: AVATAR_SIZE - 6, height: AVATAR_SIZE - 6,
      borderRadius: (AVATAR_SIZE - 6) / 2,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center', justifyContent: 'center',
    },
    bird: { fontSize: 36, textAlign: 'center' },
    levelBadge: {
      position: 'absolute', bottom: -2, right: -6,
      minWidth: 28, paddingHorizontal: 4, paddingVertical: 2,
      borderRadius: radius.pill, backgroundColor: c.gold,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.gold, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
    },
    levelBadgeLabel: { ...textStyles.label, color: c.bg, fontSize: 7, lineHeight: 8 },
    levelBadgeValue: { ...textStyles.bodyBold, color: c.bg, fontSize: 13, lineHeight: 14 },
    info: { flex: 1, gap: 2 },
    name: { ...textStyles.subheading, color: c.textHigh, fontSize: 18 },
    joined: { ...textStyles.body, color: c.textLow, fontSize: 12 },
    // XP progress
    xpSection: {
      gap: 6,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    xpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    xpLabel: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 13 },
    xpMeta: { flexDirection: 'row', alignItems: 'baseline' },
    xpVal: { ...textStyles.bodyBold, fontSize: 13 },
    xpOf: { ...textStyles.body, color: c.textLow, fontSize: 11 },
    xpTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    xpBar: {
      height: '100%',
      borderRadius: 5,
    },
    xpHint: { ...textStyles.label, color: c.textMuted, fontSize: 10 },
  });
}
