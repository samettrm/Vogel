import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useThemeColors } from '../../theme';

// ════════════════════════════════════════════════════════════════
// SEGMENTED RING
// Ders düğümünün etrafında dairesel halka — her segment bir egzersizi
// temsil eder. Doğru = neon yeşil, yanlış = kırmızı, kalan = nötr koyu.
// Aktif derste yumuşak dönüş + nefes alma efekti.
// ════════════════════════════════════════════════════════════════

interface SegmentedRingProps {
  size: number;           // dış çap (px)
  thickness?: number;     // halka kalınlığı (px)
  total: number;          // toplam egzersiz
  correct: number;        // doğru sayılan egzersiz
  wrong: number;          // yanlış işaretli egzersiz
  isCurrent?: boolean;    // aktif ders mi → animasyon açılır
  gap?: number;           // segmentler arası boşluk (derece)
}

// Bir SVG arc Path'i üretir — verilen başlangıç/bitiş açıları için.
// 0° saat 12 yönü, saat yönünde artar.
function buildArc(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const start = toRad(startAngleDeg);
  const end = toRad(endAngleDeg);

  const x1 = cx + radius * Math.cos(start);
  const y1 = cy + radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(end);
  const y2 = cy + radius * Math.sin(end);

  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function SegmentedRingImpl({
  size,
  thickness = 5,
  total,
  correct,
  wrong,
  isCurrent = false,
  gap = 3,
}: SegmentedRingProps) {
  const c = useThemeColors();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Aktif derste: yavaş dönüş + nefes alma
  // 🚀 PERF: isCurrent false olunca animasyonları iptal et — worklet arka planda CPU yakmaya devam etmesin
  useEffect(() => {
    if (!isCurrent) {
      cancelAnimation(rotation);
      cancelAnimation(scale);
      return;
    }

    rotation.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
    scale.value = withRepeat(
      withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale);
    };
  }, [isCurrent, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  // Segment hesapları
  const segments = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - thickness) / 2;
    const arcPerSeg = 360 / Math.max(1, total);

    return Array.from({ length: total }, (_, i) => {
      const start = i * arcPerSeg + gap / 2;
      const end = (i + 1) * arcPerSeg - gap / 2;

      // Renk kararı: önce doğrular, sonra yanlışlar, kalan nötr
      let color: string = c.lockedBorder;
      if (i < correct) color = c.neon;
      else if (i < correct + wrong) color = c.red;
      else if (isCurrent) color = c.glassBorderStrong;

      return {
        d: buildArc(cx, cy, radius, start, end),
        color,
      };
    });
  }, [size, thickness, total, correct, wrong, isCurrent, gap, c]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }, animatedStyle]}
    >
      <Svg width={size} height={size}>
        {segments.map((seg, i) => (
          <Path
            key={i}
            d={seg.d}
            stroke={seg.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

// Memo — props değişmedikçe re-render olmaz (haritada 30+ tane var)
export const SegmentedRing = React.memo(SegmentedRingImpl);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
