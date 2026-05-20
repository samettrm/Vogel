import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
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
}

export function AvatarCard({ level, username, joinedLabel }: AvatarCardProps) {
  const c = useThemeColors();
  const t = useT();
  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);

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
  }, [bob, tilt]);

  const birdStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { rotate: `${tilt.value}deg` }],
  }));

  const styles = makeStyles(c);
  const defaultUsername = username ?? 'Vogel';
  const defaultJoinedLabel = joinedLabel ?? 'Almanca';

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />
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
  });
}
