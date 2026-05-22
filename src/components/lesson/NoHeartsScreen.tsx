import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { radius, shadows, spacing, textStyles, useThemeColors } from '../../theme';
import { useUserStore } from '../../store/useUserStore';

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

      {/* ⑤ PRİMARY CTA — PREMIUM (büyük, cazip) */}
      <Pressable
        onPress={() => { router.push('/(tabs)/shop'); }}
        style={({ pressed }) => [styles.premiumCta, pressed && styles.ctaPressed]}
      >
        <View style={styles.premiumCtaHighlight} pointerEvents="none" />
        <View style={styles.premiumCtaLeft}>
          <Ionicons name="diamond" size={22} color={c.bg} />
          <View>
            <Text style={styles.premiumCtaTitle}>Vogel Plus'a Geç</Text>
            <Text style={styles.premiumCtaSub}>Günde yalnızca ₺3.3 · Sınırsız can</Text>
          </View>
        </View>
        <View style={styles.premiumCtaArrow}>
          <Ionicons name="chevron-forward" size={18} color={c.purpleLight} />
        </View>
      </Pressable>

      {/* ⑥ FAYDA ÖZETİ */}
      <View style={styles.benefitRow}>
        {[
          { icon: 'infinite-outline', label: 'Sınırsız can' },
          { icon: 'ban-outline', label: 'Reklamsız' },
          { icon: 'trophy-outline', label: 'Tüm üniteler' },
        ].map((b) => (
          <View key={b.label} style={styles.benefitItem}>
            <Ionicons name={b.icon as 'infinite-outline'} size={16} color={c.purple} />
            <Text style={styles.benefitLabel}>{b.label}</Text>
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

    // Premium CTA — birincil buton, altın/mor, büyük
    premiumCta: {
      width: '100%',
      backgroundColor: c.purple,
      borderRadius: radius.lg,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
      gap: spacing.sm, overflow: 'hidden',
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 14, elevation: 8,
    },
    premiumCtaHighlight: {
      position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg,
      height: 1, backgroundColor: 'rgba(255,255,255,0.25)',
    },
    premiumCtaLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    premiumCtaTitle: { ...textStyles.button, color: c.white, fontSize: 15 },
    premiumCtaSub: { ...textStyles.body, color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
    premiumCtaArrow: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    ctaPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

    // Fayda özeti — 3 madde yatay
    benefitRow: {
      flexDirection: 'row', gap: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    benefitItem: { flex: 1, alignItems: 'center', gap: 3 },
    benefitLabel: { ...textStyles.caption, color: c.textLow, fontSize: 10, textAlign: 'center' },

    // İkincil buton — kasıtlı soluk (kullanıcıyı premium'a yönlendir)
    ghostBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
    ghostBtnText: { ...textStyles.body, color: c.textLow, fontSize: 12 },
  });
}
