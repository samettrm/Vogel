import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

// Tema'dan beslenen renk paleti — konfeti markayla aynı dilden konuşsun.
const PARTICLE_COLORS = [
  colors.primary,
  colors.gold,
  colors.blue,
  colors.purple,
  colors.heart,
  colors.streak,
];

// Performans için 50 → 30. Görsel doluluk hâlâ tatmin edici, CPU yükü %40 az.
const PARTICLE_COUNT = 30;

type ConfettiProps = {
  // Olduğu yere yağsın mı, yoksa orta noktadan mı patlasın
  origin?: 'top' | 'center';
  // Animasyon süresi alt sınırı (ms). Üstüne rastgele ekleme yapılır.
  baseDuration?: number;
};

// Tek seferlik konfeti efekti. Mount edildiğinde tetiklenir.
// pointerEvents='none' olduğu için altındaki butonlara dokunmaz.
export function Confetti({ origin = 'top', baseDuration = 1800 }: ConfettiProps) {
  const { width, height } = Dimensions.get('window');

  // Parçacıkları sadece bir kez üret — render'da yeniden hesaplama olmasın.
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      startX: Math.random() * width,
      driftX: (Math.random() - 0.5) * width * 0.6,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 7 + Math.random() * 9,
      delay: Math.random() * 350,
      duration: baseDuration + Math.random() * 1400,
      rotation: (Math.random() - 0.5) * 720,
      shape: i % 3 === 0 ? 'circle' : 'square',
    }));
  }, [width, baseDuration]);

  const originY = origin === 'top' ? -40 : height * 0.35;

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
          shape={p.shape as 'circle' | 'square'}
          endY={height + 60}
          originY={originY}
        />
      ))}
    </View>
  );
}

type ParticleProps = {
  startX: number;
  driftX: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  shape: 'circle' | 'square';
  endY: number;
  originY: number;
};

function Particle({
  startX,
  driftX,
  color,
  size,
  delay,
  duration,
  rotation,
  shape,
  endY,
  originY,
}: ParticleProps) {
  const translateY = useSharedValue(originY);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(endY, {
        duration,
        easing: Easing.in(Easing.cubic),
      }),
    );

    translateX.value = withDelay(
      delay,
      withTiming(driftX, {
        duration,
        easing: Easing.linear,
      }),
    );

    rotate.value = withDelay(
      delay,
      withTiming(rotation, {
        duration,
        easing: Easing.linear,
      }),
    );

    // Son %30'da kademeli kaybolma
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }),
    );
  }, [translateY, translateX, rotate, opacity, endY, driftX, rotation, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: shape === 'circle' ? size / 2 : 2,
        },
        animatedStyle,
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
