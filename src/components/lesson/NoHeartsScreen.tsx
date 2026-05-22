import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { radius, shadows, spacing, textStyles, useThemeColors } from '../../theme';

// ════════════════════════════════════════════════════════════════
// NO HEARTS SCREEN — Canı bitince gösterilen ekran
// Uygulamanın dark temasıyla tam uyumlu: glassBg, neon, kırmızı parıltı
// ════════════════════════════════════════════════════════════════

type Props = {
  nextHeartAt: number | null;
  onGoHome: () => void;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function NoHeartsScreen({ nextHeartAt, onGoHome }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (nextHeartAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextHeartAt]);

  const remaining = nextHeartAt === null ? 0 : Math.max(0, nextHeartAt - now);

  return (
    <View style={styles.container}>

      {/* Arka plan kırmızı ışıma */}
      <View style={styles.bgGlow} pointerEvents="none" />

      {/* Kalp ikonu — büyük kırmızı daire */}
      <View style={styles.heartCircleWrap}>
        <View style={[styles.heartCircle, shadows.glowRed]}>
          <View style={styles.heartCircleInner} />
          <Ionicons name="heart-dislike" size={56} color={c.red} />
        </View>
      </View>

      {/* Başlık */}
      <Text style={styles.title}>Canın bitti!</Text>
      <Text style={styles.subtitle}>
        Yeni bir can kazanmak için biraz beklemen gerekiyor veya premium'a geçebilirsin.
      </Text>

      {/* Geri sayım kutusu */}
      {nextHeartAt !== null && (
        <View style={styles.timerCard}>
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={22} color={c.red} />
            <Text style={styles.timerLabel}>Sonraki can:</Text>
            <Text style={styles.timerValue}>{formatRemaining(remaining)}</Text>
          </View>
          <View style={styles.timerHighlight} pointerEvents="none" />
        </View>
      )}

      {/* Can göstergesi */}
      <View style={styles.heartsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name="heart"
            size={28}
            color={i === 0 ? c.red : c.glassBorder}
          />
        ))}
      </View>

      {/* Ana ekrana dön */}
      <Pressable
        onPress={onGoHome}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
      >
        <View style={styles.primaryButtonHighlight} pointerEvents="none" />
        <Ionicons name="home" size={18} color={c.textOnNeon} />
        <Text style={styles.primaryButtonText}>ANA EKRANA DÖN</Text>
      </Pressable>

      {/* Premium bağlantısı */}
      <Pressable
        onPress={() => router.push('/(tabs)/shop')}
        style={({ pressed }) => [styles.premiumRow, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name="diamond-outline" size={16} color={c.purple} />
        <Text style={styles.premiumText}>Sınırsız can için Premium al</Text>
        <Ionicons name="chevron-forward" size={14} color={c.purple} />
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
      paddingHorizontal: spacing.xl,
      gap: spacing.lg,
    },
    bgGlow: {
      position: 'absolute',
      top: '15%',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: c.red,
      opacity: 0.07,
    },
    heartCircleWrap: {
      marginBottom: spacing.sm,
    },
    heartCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: c.redBg,
      borderWidth: 2,
      borderColor: c.red,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heartCircleInner: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.red,
      opacity: 0.12,
    },
    title: {
      ...textStyles.display,
      color: c.textHigh,
      textAlign: 'center',
    },
    subtitle: {
      ...textStyles.body,
      color: c.textMed,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 22,
    },
    timerCard: {
      width: '100%',
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: c.red,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      overflow: 'hidden',
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    timerHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: c.glassHighlight,
    },
    timerLabel: {
      ...textStyles.body,
      color: c.textMed,
      flex: 1,
    },
    timerValue: {
      ...textStyles.heading,
      color: c.red,
      fontSize: 22,
      fontVariant: ['tabular-nums'],
    },
    heartsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginVertical: spacing.xs,
    },
    primaryButton: {
      width: '100%',
      minHeight: 56,
      backgroundColor: c.neon,
      borderRadius: radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      overflow: 'hidden',
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 6,
    },
    primaryButtonHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.lg,
      right: spacing.lg,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.4)',
    },
    primaryButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
      ...textStyles.button,
      color: c.textOnNeon,
      fontSize: 16,
    },
    premiumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    premiumText: {
      ...textStyles.body,
      color: c.purple,
      fontSize: 14,
    },
  });
}
