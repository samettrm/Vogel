import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Line,
} from 'react-native-svg';

// ════════════════════════════════════════════════════════════════
// 3D FACETED DIAMOND SVG
//
// ViewBox 0 0 80 88 — 7 yüzey (facet):
//   • Table         (üst düz yüzey) — beyaz/açık mavi
//   • Crown UL/UR   (taç - üst köşeler)
//   • Crown LL/LR   (taç - alt köşeler)
//   • Pavilion L/R  (pavio - alt üçgenler)
//
// Işık kaynağı sağ-üstten gelir:
//   → Sağ yüzeyler parlak, sol yüzeyler koyu
// ════════════════════════════════════════════════════════════════

function DiamondSvg({ size }: { size: number }) {
  // Tüm koordinatlar 80×88 ViewBox'a göre — React Native SVG scale eder
  return (
    <Svg width={size} height={size * (88 / 80)} viewBox="0 0 80 88">
      <Defs>
        {/* Table (üst düz yüzey) — ışığa dik bakan en parlak yüzey */}
        <LinearGradient id="dTableGrad" x1="0.3" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1"   />
          <Stop offset="45%"  stopColor="#D8F2FF" stopOpacity="0.97"/>
          <Stop offset="100%" stopColor="#9ACDE8" stopOpacity="0.92"/>
        </LinearGradient>
        {/* Sağ taç — orta parlaklık */}
        <LinearGradient id="dCrownR" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#A8DEFF" />
          <Stop offset="100%" stopColor="#60B8E0" />
        </LinearGradient>
        {/* Sağ pavio */}
        <LinearGradient id="dPavR" x1="0" y1="0" x2="0.5" y2="1">
          <Stop offset="0%"   stopColor="#3A88C0" />
          <Stop offset="100%" stopColor="#1A4870" />
        </LinearGradient>
      </Defs>

      {/* ── CROWN (taç) yüzeyleri ── */}

      {/* Crown sol-üst — koyu (ışıktan uzak) */}
      <Polygon
        points="40,4 2,34 12,32 22,20"
        fill="#183C62"
      />
      {/* Crown sağ-üst — parlak (ışığa dönük) */}
      <Polygon
        points="40,4 78,34 68,32 58,20"
        fill="url(#dCrownR)"
      />
      {/* Crown sol-alt — çok koyu */}
      <Polygon
        points="2,34 2,52 40,46 12,32"
        fill="#0B2840"
      />
      {/* Crown sağ-alt — orta */}
      <Polygon
        points="78,34 78,52 40,46 68,32"
        fill="#50A8D8"
      />

      {/* ── TABLE (üst yüzey) — en parlak ── */}
      <Polygon
        points="22,20 58,20 68,32 40,46 12,32"
        fill="url(#dTableGrad)"
      />

      {/* ── PAVILION (alt üçgenler) ── */}

      {/* Pavilion sol — neredeyse siyah */}
      <Polygon
        points="2,52 40,86 40,46"
        fill="#060F1A"
      />
      {/* Pavilion sağ — koyu mavi */}
      <Polygon
        points="78,52 40,86 40,46"
        fill="url(#dPavR)"
      />

      {/* ── FACET KENAR ÇİZGİLERİ — ince beyaz, derinlik hissi ── */}
      <Line x1="40" y1="4"  x2="22" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
      <Line x1="40" y1="4"  x2="58" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
      <Line x1="22" y1="20" x2="12" y2="32" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7"/>
      <Line x1="58" y1="20" x2="68" y2="32" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7"/>
      <Line x1="12" y1="32" x2="40" y2="46" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
      <Line x1="68" y1="32" x2="40" y2="46" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
      <Line x1="2"  y1="34" x2="12" y2="32" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
      <Line x1="78" y1="34" x2="68" y2="32" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
      <Line x1="2"  y1="52" x2="40" y2="46" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6"/>
      <Line x1="78" y1="52" x2="40" y2="46" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6"/>
      <Line x1="40" y1="46" x2="40" y2="86" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6"/>

      {/* ── IŞIK PARLAMA — table köşesinde parlak yansıma ── */}
      <Polygon
        points="27,22 44,13 53,22 38,30"
        fill="rgba(255,255,255,0.52)"
      />
      {/* Sağ taç parlak kenar */}
      <Line x1="40" y1="4" x2="78" y2="34" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
    </Svg>
  );
}

// ─── SpinningDiamondGem ────────────────────────────────────────────────────────
// Ortak bileşen — NoHeartsScreen + PremiumPlansCard + YearlyHeroCard'da kullanılır
// size: elmasın genişliği (pixel). Yükseklik otomatik orantılanır.
export function SpinningDiamondGem({ size = 44 }: { size?: number }) {
  const spinY = useSharedValue(0);
  const flash = useSharedValue(0);
  const glowV = useSharedValue(0.08);

  useEffect(() => {
    const MS = 2400; // tam tur süresi (ms)

    spinY.value = withRepeat(
      withTiming(360, { duration: MS, easing: Easing.linear }),
      -1, false,
    );
    // Ön yüze gelince (≈180° ve 360°) beyaz flaş
    flash.value = withRepeat(
      withSequence(
        withDelay(MS * 0.43, withTiming(0.82, { duration: 70 })),
        withTiming(0, { duration: 200 }),
        withDelay(MS * 0.43, withTiming(0, { duration: 0 })),
      ),
      -1, false,
    );
    // Glow halkası nabzı (spin ile senkronize)
    glowV.value = withRepeat(
      withSequence(
        withTiming(0.58, { duration: MS * 0.5, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.06, { duration: MS * 0.5, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
    return () => {
      cancelAnimation(spinY);
      cancelAnimation(flash);
      cancelAnimation(glowV);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateY: `${spinY.value}deg` }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const glowStyle  = useAnimatedStyle(() => ({
    opacity: glowV.value,
    transform: [{ scale: 0.55 + glowV.value * 0.85 }],
  }));

  const svgH   = size * (88 / 80);
  const radius = (Math.max(size, svgH) / 2) + 8;
  const wrap   = size + 16;
  const wrapH  = svgH + 16;

  return (
    <View style={{ width: wrap, height: wrapH, alignItems: 'center', justifyContent: 'center' }}>
      {/* Buz mavisi glow halkası */}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: 'absolute',
          width: radius * 2, height: radius * 2, borderRadius: radius,
          backgroundColor: '#A8DCFF',
        }, glowStyle]}
      />

      {/* 3D dönen elmas */}
      <Animated.View style={spinStyle}>
        <DiamondSvg size={size} />
      </Animated.View>

      {/* Ön yüze gelince beyaz flaş */}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: 'absolute',
          width: size, height: svgH,
          backgroundColor: '#FFFFFF',
        }, flashStyle]}
      />
    </View>
  );
}
