import React, { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AvatarCard } from '../../src/components/profile/AvatarCard';
import { StatRow } from '../../src/components/profile/StatRow';
import { StreakCalendar } from '../../src/components/profile/StreakCalendar';
import { GoalsCard } from '../../src/components/profile/GoalsCard';
import { AchievementsSummary } from '../../src/components/achievements/AchievementsSummary';
import { useUserStore } from '../../src/store/useUserStore';
import { spacing, textStyles, useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';
import { SpinningDiamondGem } from '../../src/components/shared/SpinningDiamondGem';

// ════════════════════════════════════════════════════════════════
// PROFIL — Sadeleştirilmiş yapı
//
// ÖNCEKİ: 8 farklı blok (Avatar, XP, DailyGoal, Stats 2x2, Banner,
// Achievements, Quests, Streak Calendar) → kullanıcıyı yoruyordu.
//
// YENİ HİYERARŞİ:
//   1. Header (Profil + ayarlar)
//   2. AvatarCard (kim/ne)
//   3. ProgressCard (XP + günlük hedef tek karta birleşti)
//   4. StatRow (3'lü compact: streak, can, tamamlanan)
//   5. AchievementsSummary (rozet özeti)
//   6. StreakCalendar (en altta)
//
// NOT: DailyQuestPanel (günlük 3 görev) kaldırıldı — kullanıcı gereksiz buldu.
// Store'daki quest sistemi arka planda kalmaya devam eder (silinmedi) — ileride
// gerekirse geri açabiliriz. ProgressCard'daki "Günlük Hedef" barı hâlâ çalışır
// çünkü earnXp quest'ini arka planda izliyor.
//
// RENK DİSİPLİNİ:
//   - Neon yeşil → ana renk (XP, level, completed)
//   - Altın     → sadece streak
//   - Kırmızı   → sadece kalp/can
//   - Cyan      → günlük hedef (devam ederken)
//   - Mor       → sadece achievements
// ════════════════════════════════════════════════════════════════

const XP_PER_LEVEL = 100;

export default function ProfileScreen() {
  const c = useThemeColors();
  const t = useT();
  const xp = useUserStore((s) => s.xp);
  const hearts = useUserStore((s) => s.hearts);
  const maxHearts = useUserStore((s) => s.maxHearts);
  const streak = useUserStore((s) => s.streak);
  const completedLessons = useUserStore((s) => s.completedLessons);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;

  // ✨ Premium banner shimmer — soldan sağa süpürme
  const shimmerX = useRef(new Animated.Value(-120)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, { toValue: 420, duration: 1600, useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    ).start();
  }, [shimmerX]);

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 🚀 PERF: Background glow View'ları kaldırıldı — Android'de
          büyük blur efektleri her frame composit ediliyor, pahalı. */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — başlık + ayarlar */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.settingsButtonPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
          >
            <Ionicons name="settings-sharp" size={20} color={c.textHigh} />
          </Pressable>
        </View>

        {/* 🚀 PERF: FadeInDown chain'i kaldırıldı — 5 paralel spring animasyon
            her thaw/mount'ta tetikleniyordu. Şimdi anında görünür. */}
        <AvatarCard
          level={level}
          xpInLevel={xpInLevel}
          xpForNext={XP_PER_LEVEL}
        />

        <StatRow
          streak={streak}
          hearts={hearts}
          maxHearts={maxHearts}
          isPremium={isPremium}
          completedCount={completedLessons.size}
        />

        {/* 💎 PREMIUM UPSELL — sadece free kullanıcılara, ışıltılı CTA */}
        {!isPremium ? (
          <Pressable
            onPress={() => router.push('/(tabs)/shop')}
            style={({ pressed }) => [styles.premiumBanner, pressed && styles.premiumBannerPressed]}
          >
            {/* Arka plan glow'ları */}
            <View style={styles.pBannerGlowL} pointerEvents="none" />
            <View style={styles.pBannerGlowR} pointerEvents="none" />
            {/* Üst ışık çizgisi */}
            <View style={styles.premiumBannerHighlight} pointerEvents="none" />
            {/* Shimmer süpürme */}
            <Animated.View
              style={[styles.pBannerShimmer, { transform: [{ translateX: shimmerX }] }]}
              pointerEvents="none"
            />
            {/* Dekoratif kıvılcımlar */}
            <Text style={styles.pSpark1} pointerEvents="none">✦</Text>
            <Text style={styles.pSpark2} pointerEvents="none">✦</Text>
            <Text style={styles.pSpark3} pointerEvents="none">✦</Text>
            <Text style={styles.pSpark4} pointerEvents="none">✦</Text>
            {/* Üst rozet çubuğu */}
            <View style={styles.pBannerTopBadge} pointerEvents="none">
              <Text style={styles.pBannerTopBadgeText}>✦ 3 GÜN ÜCRETSİZ DENEMELİ ✦</Text>
            </View>
            {/* İçerik */}
            <View style={styles.pBannerContent}>
              <SpinningDiamondGem size={46} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.premiumBannerTitle}>Vogel Plus'a Geç</Text>
                <Text style={styles.premiumBannerSub}>Sınırsız can · Reklamsız · Goethe & TELC</Text>
              </View>
              <View style={styles.premiumBannerArrow}>
                <Ionicons name="chevron-forward" size={16} color={c.gold} />
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* 🎯 Hedeflerin — onboarding'de seçilen motivasyonlar */}
        <GoalsCard />

        <AchievementsSummary />

        <StreakCalendar streak={streak} />

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    bgGlow: {
      position: 'absolute', top: -60, right: -100,
      width: 280, height: 280, borderRadius: 140,
      backgroundColor: c.neon, opacity: 0.05,
    },
    scrollContent: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingVertical: spacing.sm,
    },
    title: { ...textStyles.display, color: c.textHigh },
    settingsButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center',
    },
    settingsButtonPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
    // ✨ Premium upsell — cosmic ışıltılı CTA
    premiumBanner: {
      width: '100%',
      backgroundColor: '#07021a',
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: c.gold,
      overflow: 'hidden',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.65,
      shadowRadius: 20,
      elevation: 10,
    },
    pBannerTopBadge: {
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(245,158,11,0.2)',
      backgroundColor: 'rgba(245,158,11,0.07)',
    },
    pBannerTopBadgeText: {
      ...textStyles.label,
      color: c.gold,
      fontSize: 10,
      fontWeight: '800' as const,
      letterSpacing: 1.6,
    },
    pBannerContent: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.base, paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    pBannerGlowL: {
      position: 'absolute', top: -24, left: -24,
      width: 110, height: 110, borderRadius: 55,
      backgroundColor: 'rgba(168,85,247,0.28)',
    },
    pBannerGlowR: {
      position: 'absolute', bottom: -20, right: 10,
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: 'rgba(245,158,11,0.22)',
    },
    premiumBannerHighlight: {
      position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg,
      height: 1, backgroundColor: 'rgba(255,220,80,0.55)',
    },
    pBannerShimmer: {
      position: 'absolute', top: 0, bottom: 0,
      width: 80,
      backgroundColor: 'rgba(255,255,255,0.07)',
    },
    pSpark1: { position: 'absolute', top: 32,  right: 60, fontSize: 10, color: c.gold,                    opacity: 0.9 },
    pSpark2: { position: 'absolute', top: 46,  right: 42, fontSize: 7,  color: '#c084fc',                  opacity: 0.8 },
    pSpark3: { position: 'absolute', bottom: 16, left: 100, fontSize: 8, color: c.gold,                    opacity: 0.7 },
    pSpark4: { position: 'absolute', top: 28,  left: 140, fontSize: 6,  color: 'rgba(255,255,255,0.6)',     opacity: 0.6 },
    premiumBannerTitle: { ...textStyles.button, color: c.gold, fontSize: 19, fontWeight: '900' as const, letterSpacing: 0.3 },
    premiumBannerSub: { ...textStyles.body, color: 'rgba(255,255,255,0.65)', fontSize: 13 },
    premiumBannerArrow: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: 'rgba(245,158,11,0.18)',
      borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    premiumBannerPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  });
}
