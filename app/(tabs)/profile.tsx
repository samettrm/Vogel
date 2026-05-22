import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AvatarCard } from '../../src/components/profile/AvatarCard';
import { ProgressCard } from '../../src/components/profile/ProgressCard';
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
        <AvatarCard level={level} />

        <ProgressCard
          level={level}
          xpInLevel={xpInLevel}
          xpForNext={XP_PER_LEVEL}
          totalXp={xp}
        />

        <StatRow
          streak={streak}
          hearts={hearts}
          maxHearts={maxHearts}
          isPremium={isPremium}
          completedCount={completedLessons.size}
        />

        {/* 💎 PREMIUM UPSELL — sadece free kullanıcılara, güçlü CTA */}
        {!isPremium ? (
          <Pressable
            onPress={() => router.push('/(tabs)/shop')}
            style={({ pressed }) => [styles.premiumBanner, pressed && styles.premiumBannerPressed]}
          >
            <View style={styles.premiumBannerHighlight} pointerEvents="none" />
            <View style={styles.premiumBannerLeft}>
              <SpinningDiamondGem size={30} />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumBannerTitle}>Vogel Plus'a Geç</Text>
                <Text style={styles.premiumBannerSub}>Sınırsız can · Reklamsız · Günde ₺3.3</Text>
              </View>
            </View>
            <View style={styles.premiumBannerArrow}>
              <Ionicons name="chevron-forward" size={16} color={c.purpleLight} />
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
    // Premium upsell — altın yaldızlı CTA
    premiumBanner: {
      width: '100%',
      backgroundColor: c.purple,
      borderRadius: 16,
      borderWidth: 2, borderColor: c.gold,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
      gap: spacing.md, overflow: 'hidden',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 16, elevation: 8,
    },
    premiumBannerHighlight: {
      position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg,
      height: 1.5, backgroundColor: 'rgba(255,220,80,0.4)',
    },
    premiumBannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    premiumBannerTitle: { ...textStyles.button, color: c.gold, fontSize: 16, letterSpacing: 0.2 },
    premiumBannerSub: { ...textStyles.body, color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 1 },
    premiumBannerArrow: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    premiumBannerPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  });
}
