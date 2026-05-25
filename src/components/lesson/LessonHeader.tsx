import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useUserStore } from '../../store/useUserStore';

// ════════════════════════════════════════════════════════════════
// LESSON HEADER — Parlak Neon Bar + Her Zaman Aktif Efektler
//
// Bar:
//  - DÜZ PARLAK NEON YEŞİL renk (gradient yok, sade)
//  - Üst highlight beyaz parıltı (3D his)
//  - Alt shade koyu gölge (derinlik)
//
// Efektler (her zaman aktif — completed kontrolü YOK):
//  - SHIMMER: bar fill içinde soldan sağa akan parlak beyaz parıltı
//  - HELIX: bar dış hatlarında sarmal şimşek, üzerinde elektrik akar
//
// Progress ile senkron:
//  - Bar fill width = fill.value * 100% (animasyonlu, her soruyla ilerler)
//  - Helix wrap width = barWidthSV * fill.value (bar ile birlikte uzar)
//  - Shimmer bar fill içinde olduğu için otomatik clip
//
// Tek cycle ile efekt senkronizasyonu: shimmer + dashOffset
// ════════════════════════════════════════════════════════════════

interface LessonHeaderProps {
  progress: number;
  hearts: number;
  onClose: () => void;
  completed?: boolean; // Kullanılmıyor artık ama API uyumu için tutuldu
  isPremium?: boolean;
}

const BAR_HEIGHT = 24;
const HELIX_PAD = 14;
const WRAP_HEIGHT = BAR_HEIGHT + HELIX_PAD * 2;
const CENTER_Y = WRAP_HEIGHT / 2;
const PEAK_TOP = 4;
const PEAK_BOTTOM = WRAP_HEIGHT - 4;

const DASH_VISIBLE = 28;
const DASH_GAP = 260;
const DASH_TOTAL = DASH_VISIBLE + DASH_GAP;

const CYCLE_MS = 1200;
const SHIMMER_RATIO = 0.5;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function buildHelixPath(barWidth: number, waves: number): string {
  const halfWave = barWidth / waves / 2;
  let x = -halfWave * 2;
  let d = `M ${x} ${CENTER_Y}`;
  let topNext = true;
  for (let i = 0; i < waves * 2 + 4; i++) {
    const peakX = x + halfWave / 2;
    const peakY = topNext ? PEAK_TOP : PEAK_BOTTOM;
    const nextX = x + halfWave;
    d += ` Q ${peakX} ${peakY} ${nextX} ${CENTER_Y}`;
    x = nextX;
    topNext = !topNext;
  }
  return d;
}

export function LessonHeader({
  progress,
  hearts,
  onClose,
  isPremium = false,
}: LessonHeaderProps) {
  const c = useThemeColors();
  const soundEnabled = useUserStore((s) => s.soundEnabled);
  const setSoundEnabled = useUserStore((s) => s.setSoundEnabled);

  const fill = useSharedValue(0);
  const barWidthSV = useSharedValue(0);
  const [barWidthState, setBarWidthState] = useState(0);

  // Efekt cycle (sürekli loop)
  const cycle = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.min(100, Math.max(0, progress)) / 100;
    fill.value = withTiming(clamped, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, fill]);

  // Efektler her zaman aktif — bar dolarken efektler de görünür
  // 🚀 PERF: unmount'ta cycle animasyonu iptal et — ders biterken CPU yakmaya devam etmesin
  useEffect(() => {
    cycle.value = 0;
    cycle.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => { cancelAnimation(cycle); };
  }, [cycle]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  // HELIX WRAP — bar fill ile aynı genişlikte, ilerleyince helix de uzar
  const helixWrapStyle = useAnimatedStyle(() => ({
    width: barWidthSV.value * fill.value,
  }));

  const helixPath = useMemo(() => {
    if (barWidthState <= 0) return '';
    const waves = Math.max(5, Math.round(barWidthState / 36));
    return buildHelixPath(barWidthState, waves);
  }, [barWidthState]);

  const dashAnimProps = useAnimatedProps(() => ({
    strokeDashoffset: cycle.value * -DASH_TOTAL,
  }));

  // SHIMMER — bar fill içinde soldan sağa akar
  const shimmerStyle = useAnimatedStyle(() => {
    const bw = barWidthSV.value;
    if (bw <= 0) return { opacity: 0, transform: [{ translateX: 0 }] };
    const sw = bw * SHIMMER_RATIO;
    const travel = bw + sw;
    const x = -sw + cycle.value * travel;
    return {
      opacity: 1,
      transform: [{ translateX: x }],
    };
  });

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);
  const shimmerWidth = Math.max(40, barWidthState * SHIMMER_RATIO);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onClose}
        style={styles.closeButton}
        hitSlop={10}
        accessibilityRole="button"
      >
        <Ionicons name="close" size={26} color={c.textLow} />
      </Pressable>

      <View
        style={styles.barWrap}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - barWidthState) > 1) {
            barWidthSV.value = w;
            setBarWidthState(w);
          }
        }}
      >
        {/* Bar track — overflow:hidden */}
        <View style={styles.barTrack}>
          {/* Bar fill — DÜZ PARLAK NEON YEŞİL */}
          <Animated.View style={[styles.barFillContainer, fillStyle]}>
            {/* SHIMMER overlay — bar fill içinde clip edilir */}
            {barWidthState > 0 ? (
              <Animated.View
                style={[styles.shimmerWrap, { width: shimmerWidth }, shimmerStyle]}
                pointerEvents="none"
              >
                <Svg width="100%" height={BAR_HEIGHT}>
                  <Defs>
                    <SvgLinearGradient id="shimGrad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor={c.neonLight} stopOpacity={0} />
                      <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.85} />
                      <Stop offset="1" stopColor={c.neonLight} stopOpacity={0} />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect
                    x="0"
                    y="0"
                    width="100%"
                    height={BAR_HEIGHT}
                    fill="url(#shimGrad)"
                  />
                </Svg>
              </Animated.View>
            ) : null}

            <View style={styles.barTopHighlight} pointerEvents="none" />
            <View style={styles.barBottomShade} pointerEvents="none" />
          </Animated.View>
        </View>

        {/* HELIX WRAP — bar fill ile beraber ilerler (width: barW * fill) */}
        {barWidthState > 0 && helixPath ? (
          <Animated.View
            style={[styles.helixWrap, helixWrapStyle]}
            pointerEvents="none"
          >
            <Svg
              width={barWidthState}
              height={WRAP_HEIGHT}
              pointerEvents="none"
            >
              <AnimatedPath
                d={helixPath}
                stroke={c.neon}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${DASH_VISIBLE} ${DASH_GAP}`}
                fill="none"
                opacity={0.5}
                animatedProps={dashAnimProps}
              />
              <AnimatedPath
                d={helixPath}
                stroke={c.neonLight}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={`${DASH_VISIBLE} ${DASH_GAP}`}
                fill="none"
                opacity={0.9}
                animatedProps={dashAnimProps}
              />
              <AnimatedPath
                d={helixPath}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={`${DASH_VISIBLE} ${DASH_GAP}`}
                fill="none"
                opacity={1}
                animatedProps={dashAnimProps}
              />
            </Svg>
          </Animated.View>
        ) : null}
      </View>

      {/* 🔊 Ses aç/kapa — açıkken yeşil neon, kapalıyken kırmızı + slash */}
      <Pressable
        onPress={() => setSoundEnabled(!soundEnabled)}
        style={({ pressed }) => [
          styles.muteButton,
          {
            backgroundColor: soundEnabled ? c.neonBg : c.redBg,
            borderColor: soundEnabled ? c.neon : c.red,
            shadowColor: soundEnabled ? c.neon : c.red,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
      >
        <Ionicons
          name={soundEnabled ? 'volume-high' : 'volume-mute'}
          size={22}
          color={soundEnabled ? c.neon : c.red}
        />
        {!soundEnabled && (
          <View style={styles.muteSlash} pointerEvents="none" />
        )}
      </Pressable>

      <View style={styles.hearts}>
        <Ionicons name="heart" size={18} color={isPremium ? c.neon : c.red} />
        <Text style={[styles.heartText, isPremium && { color: c.neon }]}>
          {isPremium ? '∞' : hearts}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm + HELIX_PAD / 2,
      gap: spacing.md,
      backgroundColor: c.bg,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    muteButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      borderWidth: 2,
      // Glow effect — dikkat çekici
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 8,
      elevation: 6,
    },
    muteSlash: {
      position: 'absolute',
      width: 30,
      height: 2.5,
      backgroundColor: c.red,
      transform: [{ rotate: '-45deg' }],
      borderRadius: 2,
    },
    barWrap: {
      flex: 1,
      height: WRAP_HEIGHT,
      justifyContent: 'center',
    },
    barTrack: {
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.divider,
      overflow: 'hidden',
    },
    // BAR FILL — DÜZ PARLAK NEON YEŞİL (gradient yok)
    barFillContainer: {
      height: '100%',
      borderRadius: BAR_HEIGHT / 2,
      overflow: 'hidden',
      backgroundColor: c.neon, // ← Parlak neon yeşil, sade
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 10,
      elevation: 6,
    },
    shimmerWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: BAR_HEIGHT,
    },
    barTopHighlight: {
      position: 'absolute',
      top: 3,
      left: 6,
      right: 6,
      height: 3,
      backgroundColor: '#FFFFFF',
      borderRadius: 1.5,
      opacity: 0.5,
    },
    barBottomShade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: BAR_HEIGHT / 2,
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      borderBottomLeftRadius: BAR_HEIGHT / 2,
      borderBottomRightRadius: BAR_HEIGHT / 2,
    },
    helixWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: WRAP_HEIGHT,
      overflow: 'hidden',
    },
    hearts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.pill,
    },
    heartText: {
      ...textStyles.bodyBold,
      color: c.red,
      fontSize: 15,
    },
  });
}
