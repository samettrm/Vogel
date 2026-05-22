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
import { radius, shadows, spacing, textStyles, useThemeColors } from '../../theme';

interface BirdMascotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_PX: Record<NonNullable<BirdMascotProps['size']>, number> = {
  sm: 44, md: 60, lg: 80,
};

export function BirdMascot({ message, size = 'md' }: BirdMascotProps) {
  const c = useThemeColors();
  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
    tilt.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400 }),
      ),
      -1, false,
    );
    return () => {
      cancelAnimation(bob);
      cancelAnimation(tilt);
    };
  }, [bob, tilt]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { rotate: `${tilt.value}deg` }],
  }));

  const px = SIZE_PX[size];
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      {message ? (
        <View style={styles.bubbleWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{message}</Text>
          </View>
          <View style={styles.bubbleTail} />
        </View>
      ) : null}

      <Animated.View style={[styles.mascotWrap, animatedStyle]}>
        <View style={[styles.glowRing, { width: px * 0.9, height: px * 0.9, borderRadius: px }]} />
        <Text style={[styles.bird, { fontSize: px }]}>🐦</Text>
      </Animated.View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bubbleWrap: { flexDirection: 'row', alignItems: 'center' },
    bubble: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.md, maxWidth: 200,
    },
    bubbleText: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 13 },
    bubbleTail: {
      width: 0, height: 0,
      borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 8,
      borderTopColor: 'transparent', borderBottomColor: 'transparent',
      borderLeftColor: c.glassBgStrong,
      marginLeft: -1,
    },
    mascotWrap: { alignItems: 'center', justifyContent: 'center', ...shadows.glowPrimarySoft },
    glowRing: {
      position: 'absolute', bottom: 4,
      backgroundColor: c.neonGlowSoft,
      borderWidth: 1, borderColor: c.neonGlow,
    },
    bird: { textAlign: 'center' },
  });
}
