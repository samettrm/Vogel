import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { dark } from '../../theme';

// ════════════════════════════════════════════════════════════════
// CONFETTI (Performans optimize)
// - Partikul sayisi azaltildi (default 14 → cok daha az kasma)
// - Shadow/elevation kaldirildi (Android'de pahaliydi)
// - Tek transform (translate + rotate birlesik) ile worklet basit
// - opacity ayri sharedValue degil, animasyon icinde olusuyor
// ════════════════════════════════════════════════════════════════

interface ConfettiProps {
  count?: number;
  origin?: 'top' | 'center';
  colors?: string[];
  fullScreen?: boolean;
  baseDuration?: number;
}

const DEFAULT_COLORS = [
  dark.neon,
  dark.neonLight,
  dark.purple,
  dark.purpleLight,
  dark.gold,
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export function Confetti({
  count = 14,
  origin = 'top',
  colors = DEFAULT_COLORS,
  fullScreen = false,
  baseDuration = 1400,
}: ConfettiProps) {
  const particles = useMemo(() => {
    const W = SCREEN_WIDTH;
    const H = fullScreen ? SCREEN_HEIGHT : 360;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: Math.random() * W,
      driftX: (Math.random() - 0.5) * W * 0.4,
      color: colors[i % colors.length],
      size: 7 + Math.random() * 6,
      delay: Math.random() * 200,
      duration: baseDuration + Math.random() * 700,
      rotation: (Math.random() - 0.5) * 540,
      originY: origin === 'top' ? -30 : H * 0.4,
      endY: H + 30,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((p) => (
        <Particle
          key={p.id}
          startX={p.startX}
          driftX={p.driftX}
          color={p.color}
          size={p.size}
          delay={p.delay}
          duration={p.duration}
          rotation={p.rotation}
          originY={p.originY}
          endY={p.endY}
        />
      ))}
    </View>
  );
}

interface ParticleProps {
  startX: number;
  driftX: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  originY: number;
  endY: number;
}

function Particle({
  startX,
  driftX,
  color,
  size,
  delay,
  duration,
  rotation,
  originY,
  endY,
}: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.in(Easing.cubic),
      }),
    );
  }, [progress, delay, duration]);

  // Tek shared value → tek interpolasyon → daha az worklet yuku
  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const x = driftX * p;
    const y = originY + (endY - originY) * p;
    const rot = rotation * p;
    // Son %25'te fade out
    const opacity = p < 0.75 ? 1 : Math.max(0, 1 - (p - 0.75) * 4);
    return {
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${rot}deg` }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 2,
        },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
});
