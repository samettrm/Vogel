import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { dark } from '../../theme';

// ════════════════════════════════════════════════════════════════
// PROGRESS BAR
// Yatay ilerleme çubuğu. Reanimated ile yumuşak doldurma.
// ════════════════════════════════════════════════════════════════

export type ProgressBarVariant = 'primary' | 'purple' | 'gold' | 'cyan' | 'red';
export type ProgressBarSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number; // 0..1
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  showGlow?: boolean;
  showHighlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<ProgressBarSize, number> = { sm: 8, md: 12, lg: 16 };

function getVariantColors(variant: ProgressBarVariant) {
  switch (variant) {
    case 'purple':
      return { fill: dark.purple, glow: dark.purpleGlow, light: dark.purpleLight };
    case 'gold':
      return { fill: dark.gold, glow: dark.goldGlow, light: '#FBBF24' };
    case 'cyan':
      return { fill: dark.cyan, glow: dark.cyanGlow, light: '#67E8F9' };
    case 'red':
      return { fill: dark.red, glow: dark.redGlow, light: '#FB7185' };
    case 'primary':
    default:
      return { fill: dark.neon, glow: dark.neonGlow, light: dark.neonLight };
  }
}

export function ProgressBar({
  value,
  variant = 'primary',
  size = 'md',
  showGlow = true,
  showHighlight = true,
  style,
}: ProgressBarProps) {
  const height = HEIGHTS[size];
  const colors = getVariantColors(variant);
  const safeValue = Math.min(1, Math.max(0, value));

  const widthSv = useSharedValue(0);

  useEffect(() => {
    widthSv.value = withTiming(safeValue, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [safeValue, widthSv]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthSv.value * 100}%`,
  }));

  const glowStyle: ViewStyle | undefined = showGlow
    ? {
        shadowColor: colors.fill,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 4,
      }
    : undefined;

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: colors.fill, borderRadius: height / 2 },
          glowStyle,
          fillStyle,
        ]}
      >
        {showHighlight && (
          <View
            style={[
              styles.highlight,
              { backgroundColor: colors.light, borderRadius: height / 4 },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: dark.surface,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 2,
    opacity: 0.7,
  },
});
