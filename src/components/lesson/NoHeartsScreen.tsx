import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { radius, shadows, spacing, textStyles, useThemeColors } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { SpinningDiamondGem } from '../shared/SpinningDiamondGem';

// ─── Animasyonlu altın yıldız ─────────────────────────────────────────────────
function GoldSparkle({
  color, style, delay, size = 18,
}: {
  color: string; style: object; delay: number; size?: number;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.2);

  useEffect(() => {
    const pause = 1800 + (delay % 700);
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,   { duration: 280 }),
        withTiming(0.4, { duration: 180 }),
        withTiming(1,   { duration: 220 }),
        withTiming(0,   { duration: 350 }),
        withDelay(pause, withTiming(0, { duration: 0 })),
      ),
      -1, false,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 280 }),
        withTiming(0.8, { duration: 180 }),
        withTiming(1.1, { duration: 220 }),
        withTiming(0.2, { duration: 350 }),
        withDelay(pause, withTiming(0.2, { duration: 0 })),
      ),
      -1, false,
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
      style={[{ position: 'absolute', fontSize: size, color }, style, anim]}
    >✦</Animated.Text>
  );
}

// ════════════════════════════════════════════════════════════════
// NO HEARTS SCREEN — Kayıp korkusu + ilerleme kaybı psikolojisi
//
// Tetikleyiciler:
//   1. Streak tehlikesi  → "X günlük serin tehlikede!"
//   2. Kayıp çerçevesi  → İlerleme görselleştirmesi (ne kadar çalıştı)
//   3. Fiyat framing    → "Günde sadece ₺X"
//   4. Buton hiyerarşi  → Premium ÖNCE (yeşil, büyük), eve dön SONRA (küçük, soluk)
// ════════════════════════════════════════════════════════════════

type Props = {
  nextHeartAt: number | null;
  onGoHome: () => void;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function NoHeartsScreen({ nextHeartAt, onGoHome }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  // Süpürme ışığı
  const shimmerX    = useSharedValue(-80);
  // Kart dış glow nabzı
  const outerGlowV   = useSharedValue(0.06);
  // Kart hafif nefes skalası
  const cardScale    = useSharedValue(1);

  useEffect(() => {
    shimmerX.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(420, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withDelay(3200, withTiming(-80, { duration: 0 })),
      ),
      -1, false,
    ));

    outerGlowV.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.06, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
    cardScale.value = withRepeat(
      withSequence(
        withTiming(1.018, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.000, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
    return () => {
      cancelAnimation(shimmerX);
      cancelAnimation(outerGlowV);
      cancelAnimation(cardScale);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shimmerAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: '20deg' }],
  }));
  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: outerGlowV.value,
  }));
  const cardScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  // Store'dan motivasyon verileri — kayıp korkusu için
  const streak = useUserStore((s) => s.streak);
  const completedCount = useUserStore((s) => s.completedLessons.size);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!nextHeartAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextHeartAt]);

  const remaining = nextHeartAt ? Math.max(0, nextHeartAt - now) : 0;
  const hasStreak = streak > 0;

  return (
    <View style={styles.container}>
      {/* Arka plan kırmızı ışıma */}
      <View style={styles.bgGlow} pointerEvents="none" />

      {/* ① KAYIP UYARISI — en üstte, göz önünde */}
      {hasStreak && (
        <View style={styles.streakWarningCard}>
          <View style={styles.streakWarningRow}>
            <Text style={styles.streakFire}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakWarningTitle}>
                {streak} günlük serin tehlikede!
              </Text>
              <Text style={styles.streakWarningDesc}>
                Bugün ders yapmazsan serinizi sıfırlanır
              </Text>
            </View>
          </View>
          <View style={styles.streakWarningHighlight} pointerEvents="none" />
        </View>
      )}

      {/* ② KALP İKONU */}
      <View style={[styles.heartCircle, shadows.glowRed]}>
        <View style={styles.heartCircleInner} />
        <Ionicons name="heart-dislike" size={48} color={c.red} />
      </View>

      {/* ③ BAŞLIK + PROGRESS */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Canın bitti 💔</Text>
        <Text style={styles.subtitle}>
          {completedCount > 0
            ? `${completedCount} ders tamamladın — durmak zorunda değilsin.`
            : 'Devam etmek için can gerekiyor.'}
        </Text>
      </View>

      {/* ④ GERİ SAYIM */}
      {nextHeartAt !== null && (
        <View style={styles.timerCard}>
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={18} color={c.textLow} />
            <Text style={styles.timerLabel}>Sonraki ücretsiz can:</Text>
            <Text style={styles.timerValue}>{formatRemaining(remaining)}</Text>
          </View>
        </View>
      )}

      {/* ⑤ PRİMARY CTA — PREMIUM hero kart */}
      <View style={styles.premiumCtaWrapper}>
        {/* Altın rozet */}
        <View style={styles.premiumCtaBadge}>
          <Text style={styles.premiumCtaBadgeText}>✨ EN ÇOK TERCİH EDİLEN</Text>
        </View>

        {/* Dış nabız glow — kart arkasında pulse */}
        <Animated.View style={[styles.premiumCtaOuterGlow, outerGlowStyle]} pointerEvents="none" />

        {/* ── Animasyonlu yıldızlar — kartın çevresinde ── */}
        <GoldSparkle color={c.gold} style={{ top: 10, left: '18%' }}     delay={0}    />
        <GoldSparkle color={c.gold} style={{ top: 10, right: '18%' }}    delay={700}  />
        <GoldSparkle color={c.gold} style={{ top: 62, left: -10 }}       delay={350}  />
        <GoldSparkle color={c.gold} style={{ top: 62, right: -10 }}      delay={1050} />
        <GoldSparkle color={c.gold} style={{ top: 135, left: -10 }}      delay={900}  />
        <GoldSparkle color={c.gold} style={{ top: 135, right: -10 }}     delay={200}  />
        <GoldSparkle color={c.gold} style={{ bottom: -4, left: '25%' }}  delay={550}  />
        <GoldSparkle color={c.gold} style={{ bottom: -4, right: '25%' }} delay={1250} />

        {/* Kartın kendisi — hafif nefes animasyonu */}
        <Animated.View style={[{ width: '100%' }, cardScaleStyle]}>
          <Pressable
            onPress={() => { router.push('/(tabs)/shop'); }}
            style={({ pressed }) => [styles.premiumCta, pressed && styles.ctaPressed]}
          >
            <View style={styles.premiumCtaGoldBg} pointerEvents="none" />
            <View style={styles.premiumCtaHighlight} pointerEvents="none" />
            {/* Animasyonlu süpürme ışığı */}
            <Animated.View style={[styles.premiumCtaShimmer, shimmerAnim]} pointerEvents="none" />

            {/* Başlık */}
            <View style={styles.premiumCtaHeader}>
              {/* 3D dönen SVG elmas */}
              <SpinningDiamondGem size={50} />
              <Text style={styles.premiumCtaTitle}>Vogel Plus'a Geç</Text>
            </View>

            {/* Tagline */}
            <Text style={styles.premiumCtaTagline}>
              Öğrenmeni hiçbir şey durduramaz 🚀
            </Text>

            {/* Fiyat */}
            <View style={styles.premiumCtaPriceRow}>
              <Text style={styles.premiumCtaPriceBig}>₺3.3</Text>
              <View style={styles.premiumCtaPriceRight}>
                <Text style={styles.premiumCtaPriceUnit}>/gün</Text>
                <Text style={styles.premiumCtaPriceSub}>aylık ₺99'dan</Text>
              </View>
            </View>

            {/* İç buton */}
            <View style={styles.premiumCtaInnerBtn}>
              <Text style={styles.premiumCtaInnerBtnText}>HEMEN BAŞLA</Text>
              <Ionicons name="arrow-forward" size={18} color={c.purple} />
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* ⑥ FAYDA ÖZETİ — renkli kartlar */}
      <View style={styles.benefitRow}>
        {([
          { icon: 'infinite-outline', label: 'Sınırsız can',   color: c.neon,   bg: c.neonBg   },
          { icon: 'school-outline',   label: 'Yeterlilik sınavı', color: c.purple, bg: c.purpleBg },
          { icon: 'trophy-outline',   label: 'Tüm üniteler',   color: c.gold,   bg: c.goldBg   },
        ] as const).map((b) => (
          <View key={b.label} style={[styles.benefitItem, { backgroundColor: b.bg, borderColor: b.color }]}>
            <Ionicons name={b.icon} size={24} color={b.color} />
            <Text style={[styles.benefitLabel, { color: b.color }]}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* ⑦ SECONDARY — küçük, kasıtlı sönük */}
      <Pressable
        onPress={onGoHome}
        style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.ghostBtnText}>Hayır, ana ekrana döneyim</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    bgGlow: {
      position: 'absolute', top: '10%',
      width: 280, height: 280, borderRadius: 140,
      backgroundColor: c.red, opacity: 0.06,
    },

    // Streak uyarı kartı — kırmızı kenarlık, dikkat çekici
    streakWarningCard: {
      width: '100%',
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderWidth: 1.5, borderColor: c.red,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      overflow: 'hidden',
    },
    streakWarningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    streakFire: { fontSize: 28 },
    streakWarningTitle: { ...textStyles.bodyBold, color: c.red, fontSize: 14 },
    streakWarningDesc: { ...textStyles.body, color: c.textMed, fontSize: 12, marginTop: 2 },
    streakWarningHighlight: {
      position: 'absolute', top: 0, left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: 'rgba(239,68,68,0.3)',
    },

    // Kalp dairesi
    heartCircle: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderWidth: 2, borderColor: c.red,
      alignItems: 'center', justifyContent: 'center',
    },
    heartCircleInner: {
      position: 'absolute',
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: c.red, opacity: 0.1,
    },

    // Metin bloğu
    textBlock: { alignItems: 'center', gap: 4 },
    title: { ...textStyles.heading, color: c.textHigh, textAlign: 'center', fontSize: 24 },
    subtitle: { ...textStyles.body, color: c.textMed, textAlign: 'center', fontSize: 13, lineHeight: 20 },

    // Geri sayım — kasıtlı küçük tutuldu (dikkat dağıtmasın)
    timerCard: {
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
      backgroundColor: c.glassBg, borderRadius: radius.md,
      borderWidth: 1, borderColor: c.glassBorder,
    },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    timerLabel: { ...textStyles.body, color: c.textLow, fontSize: 12, flex: 1 },
    timerValue: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 16, fontVariant: ['tabular-nums'] },

    // Premium CTA — hero kart
    premiumCtaWrapper: { width: '100%', alignItems: 'center' },
    premiumCtaOuterGlow: {
      position: 'absolute',
      top: 12, left: -14, right: -14, bottom: -10,
      borderRadius: radius.lg + 14,
      backgroundColor: c.gold,
    },
    premiumCtaBadge: {
      backgroundColor: c.gold,
      paddingHorizontal: spacing.md, paddingVertical: 5,
      borderRadius: 20, marginBottom: -16, zIndex: 10,
      shadowColor: c.gold, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1, shadowRadius: 14, elevation: 12,
    },
    premiumCtaBadgeText: {
      ...textStyles.label, color: '#1a1a1a', fontSize: 10, letterSpacing: 1,
    },
    premiumCta: {
      width: '100%',
      backgroundColor: c.purple,
      borderRadius: radius.lg,
      borderWidth: 3.5, borderColor: c.gold,
      padding: spacing.base,
      paddingTop: spacing.base + 14,
      gap: spacing.sm, overflow: 'hidden',
      alignItems: 'center',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1, shadowRadius: 30, elevation: 18,
    },
    premiumCtaGoldBg: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: c.gold, opacity: 0.08,
    },
    premiumCtaHighlight: {
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 2, backgroundColor: c.gold, opacity: 0.6,
    },
    // Sweep shimmer — Animated.View ile translateX ile hareket eder
    premiumCtaShimmer: {
      position: 'absolute', top: -40,
      width: 55, height: 320,
      backgroundColor: 'rgba(255,255,255,0.13)',
    },
    premiumCtaHeader: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    },
    premiumCtaTitle: {
      ...textStyles.heading, color: c.white, fontSize: 24,
    },
    premiumCtaTagline: {
      ...textStyles.body, color: 'rgba(255,255,255,0.8)',
      fontSize: 13, textAlign: 'center',
    },
    premiumCtaPriceRow: {
      flexDirection: 'row', alignItems: 'flex-end',
      gap: spacing.xs, marginTop: spacing.xs,
    },
    premiumCtaPriceBig: {
      ...textStyles.display, color: c.gold, fontSize: 52, lineHeight: 56,
    },
    premiumCtaPriceRight: { paddingBottom: 6, gap: 1 },
    premiumCtaPriceUnit: { ...textStyles.bodyBold, color: c.gold, fontSize: 15 },
    premiumCtaPriceSub: {
      ...textStyles.body, color: 'rgba(255,255,255,0.45)', fontSize: 10,
    },
    premiumCtaInnerBtn: {
      width: '100%',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.gold,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 6,
      marginTop: spacing.xs,
    },
    premiumCtaInnerBtnText: {
      ...textStyles.button, color: '#1a1a1a', fontSize: 17, letterSpacing: 0.6,
    },
    ctaPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

    // Fayda özeti — renkli kartlar
    benefitRow: {
      flexDirection: 'row', gap: spacing.sm,
      width: '100%',
    },
    benefitItem: {
      flex: 1, alignItems: 'center', gap: spacing.xs,
      paddingVertical: spacing.sm + 4,
      borderRadius: radius.md,
      borderWidth: 1.5,
    },
    benefitLabel: { ...textStyles.bodyBold, fontSize: 11, textAlign: 'center' },

    // İkincil buton — kasıtlı soluk (kullanıcıyı premium'a yönlendir)
    ghostBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
    ghostBtnText: { ...textStyles.body, color: c.textLow, fontSize: 12 },
  });
}
