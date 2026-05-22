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

// ─── Titreyen ✦ sparkle yıldızı ──────────────────────────────────────────────
function DiamondSparkle({
  size, color, delay, style,
}: {
  size: number; color: string; delay: number; style: object;
}) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.1);

  useEffect(() => {
    const pause = 1200 + (delay % 700);
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,   { duration: 150 }),
        withTiming(0.5, { duration: 110 }),
        withTiming(1,   { duration: 140 }),
        withTiming(0,   { duration: 250 }),
        withDelay(pause, withTiming(0, { duration: 0 })),
      ), -1, false,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(0.6, { duration: 110 }),
        withTiming(1.2, { duration: 140 }),
        withTiming(0.1, { duration: 250 }),
        withDelay(pause, withTiming(0.1, { duration: 0 })),
      ), -1, false,
    ));
    return () => { cancelAnimation(opacity); cancelAnimation(scale); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text
      pointerEvents="none"
      style={[{ position: 'absolute', fontSize: size, color, lineHeight: size + 2 }, style, anim]}
    >✦</Animated.Text>
  );
}

// ════════════════════════════════════════════════════════════════
// NEON AKUAMARİN ELMASı — 3D SVG Facet Tasarımı
//
// ViewBox 0 0 80 88 — 7 ana yüzey + prizma aksanı:
//   Canlı neon teal/aqua + beyaz ışık + mor/pembe prizma yansıması
//   Işık sağ-üstten → sağ yüzeyler parlak aqua, sol yüzeyler derin lacivert
// ════════════════════════════════════════════════════════════════
function DiamondSvg({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * (88 / 80)} viewBox="0 0 80 88">
      <Defs>
        {/* Table — beyazdan canlı aqua'ya */}
        <LinearGradient id="aqTable" x1="0.2" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#FFFFFF"  stopOpacity="1"    />
          <Stop offset="35%"  stopColor="#BFFFF6"  stopOpacity="0.98" />
          <Stop offset="100%" stopColor="#00DDB8"  stopOpacity="0.95" />
        </LinearGradient>
        {/* Crown sağ-üst — neon teal */}
        <LinearGradient id="aqCrownUR" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#3DFFE0" />
          <Stop offset="100%" stopColor="#009FC0" />
        </LinearGradient>
        {/* Crown sağ-alt — electric blue-teal */}
        <LinearGradient id="aqCrownLR" x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0%"   stopColor="#00C4DC" />
          <Stop offset="100%" stopColor="#005A90" />
        </LinearGradient>
        {/* Pavilion sağ — derin electric */}
        <LinearGradient id="aqPavR" x1="0" y1="0" x2="0.35" y2="1">
          <Stop offset="0%"   stopColor="#0082C0" />
          <Stop offset="100%" stopColor="#001E3C" />
        </LinearGradient>
      </Defs>

      {/* ── CROWN (taç) ── */}
      <Polygon points="40,4 2,34 13,31 23,20"   fill="#0D2448"          />  {/* UL gölge    */}
      <Polygon points="40,4 78,34 67,31 57,20"   fill="url(#aqCrownUR)" />  {/* UR canlı    */}
      <Polygon points="2,34 2,52 40,46 13,31"    fill="#060F1C"          />  {/* LL derin    */}
      <Polygon points="78,34 78,52 40,46 67,31"  fill="url(#aqCrownLR)" />  {/* LR orta     */}

      {/* ── TABLE (en parlak yüzey) ── */}
      <Polygon points="23,20 57,20 67,31 40,46 13,31" fill="url(#aqTable)" />

      {/* ── PAVILION (alt kesim) ── */}
      <Polygon points="2,52 40,86 40,46"   fill="#03070D"         />  {/* L karanlık */}
      <Polygon points="78,52 40,86 40,46"  fill="url(#aqPavR)"   />  {/* R electric */}

      {/* ── PRİZMA AKSANI — mor/pembe ışık kırılması ── */}
      <Polygon points="50,20 62,27 55,35 44,28" fill="rgba(195,95,255,0.40)" />

      {/* ── FACET KENAR ÇİZGİLERİ ── */}
      <Line x1="40" y1="4"  x2="23" y2="20" stroke="rgba(255,255,255,0.44)" strokeWidth="0.8"/>
      <Line x1="40" y1="4"  x2="57" y2="20" stroke="rgba(255,255,255,0.44)" strokeWidth="0.8"/>
      <Line x1="23" y1="20" x2="13" y2="31" stroke="rgba(255,255,255,0.30)" strokeWidth="0.7"/>
      <Line x1="57" y1="20" x2="67" y2="31" stroke="rgba(255,255,255,0.30)" strokeWidth="0.7"/>
      <Line x1="13" y1="31" x2="40" y2="46" stroke="rgba(255,255,255,0.24)" strokeWidth="0.6"/>
      <Line x1="67" y1="31" x2="40" y2="46" stroke="rgba(255,255,255,0.24)" strokeWidth="0.6"/>
      <Line x1="2"  y1="34" x2="13" y2="31" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
      <Line x1="78" y1="34" x2="67" y2="31" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
      <Line x1="2"  y1="52" x2="40" y2="46" stroke="rgba(0,220,195,0.22)"   strokeWidth="0.6"/>
      <Line x1="78" y1="52" x2="40" y2="46" stroke="rgba(0,220,195,0.22)"   strokeWidth="0.6"/>
      <Line x1="40" y1="46" x2="40" y2="86" stroke="rgba(0,180,190,0.20)"   strokeWidth="0.6"/>
      <Line x1="40" y1="4"  x2="78" y2="34" stroke="rgba(0,255,210,0.24)"   strokeWidth="1.0"/>

      {/* ── IŞIK PARLAMA — table üzerinde güçlü beyaz highlight ── */}
      <Polygon points="27,21 46,12 54,22 37,30" fill="rgba(255,255,255,0.70)" />
      {/* İkincil parlama — sağ üst köşe */}
      <Polygon points="49,14 57,19 53,25"        fill="rgba(255,255,255,0.54)" />
    </Svg>
  );
}

// ─── SpinningDiamondGem ────────────────────────────────────────────────────────
// Paylaşılan bileşen — tüm premium diamond noktalarında kullanılır.
// size: elmasın px genişliği. Yükseklik otomatik orantılanır (88/80).
export function SpinningDiamondGem({ size = 44 }: { size?: number }) {
  const spinY = useSharedValue(0);
  const flash = useSharedValue(0);
  const glowV = useSharedValue(0.06);

  useEffect(() => {
    const MS = 2400; // bir tam tur (ms)

    spinY.value = withRepeat(
      withTiming(360, { duration: MS, easing: Easing.linear }),
      -1, false,
    );
    // Ön yüze gelince (≈0° ve 180°) beyaz flaş
    flash.value = withRepeat(
      withSequence(
        withDelay(MS * 0.43, withTiming(0.88, { duration: 65 })),
        withTiming(0, { duration: 190 }),
        withDelay(MS * 0.43, withTiming(0, { duration: 0 })),
      ), -1, false,
    );
    // Neon glow halkası nabzı
    glowV.value = withRepeat(
      withSequence(
        withTiming(0.68, { duration: MS * 0.5, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration: MS * 0.5, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    return () => {
      cancelAnimation(spinY);
      cancelAnimation(flash);
      cancelAnimation(glowV);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spinStyle  = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateY: `${spinY.value}deg` }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const glowStyle  = useAnimatedStyle(() => ({
    opacity: glowV.value,
    transform: [{ scale: 0.5 + glowV.value * 0.9 }],
  }));

  const svgH  = size * (88 / 80);
  const glowR = (Math.max(size, svgH) / 2) + 10;
  const wrap  = size + 20;
  const wrapH = svgH + 20;

  // Sparkle boyutları — her size için uyumlu minimum değer
  const spBig = Math.max(Math.round(size * 0.32), 7);
  const spMid = Math.max(Math.round(size * 0.24), 5);
  const spSml = Math.max(Math.round(size * 0.17), 4);

  return (
    <View style={{ width: wrap, height: wrapH, alignItems: 'center', justifyContent: 'center' }}>

      {/* ── Neon aqua glow halkası ── */}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: 'absolute',
          width: glowR * 2, height: glowR * 2, borderRadius: glowR,
          backgroundColor: '#00EAC4',
        }, glowStyle]}
      />

      {/* ── 3D dönen elmas ── */}
      <Animated.View style={spinStyle}>
        <DiamondSvg size={size} />
      </Animated.View>

      {/* ── Ön yüze gelince beyaz flash ── */}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: 'absolute',
          width: size, height: svgH,
          backgroundColor: '#FFFFFF',
        }, flashStyle]}
      />

      {/* ── Sparkle yıldızları — 4 köşede, farklı zamanlarda titreşir ── */}
      <DiamondSparkle size={spBig} color="#FFFFFF"  delay={0}    style={{ top: 0,    left: 0 }}    />
      <DiamondSparkle size={spMid} color="#00FFDC"  delay={750}  style={{ top: 0,    right: 0 }}   />
      <DiamondSparkle size={spMid} color="#FF88EE"  delay={1300} style={{ bottom: 0, right: 0 }}   />
      <DiamondSparkle size={spSml} color="#FFFFFF"  delay={450}  style={{ bottom: 0, left: 0 }}    />
    </View>
  );
}
