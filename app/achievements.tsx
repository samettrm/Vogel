import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../src/store/useUserStore';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';

// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS SCREEN — Tüm rozetler grid
// Kilitli rozetler soluk + gri, açık rozetler renkli + glow
// ════════════════════════════════════════════════════════════════

export default function AchievementsScreen() {
  const c = useThemeColors();
  const t = useT();
  const router = useRouter();
  const unlocked = useUserStore((s) => s.achievementsUnlocked);

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgGlow1} pointerEvents="none" />
      <View style={styles.bgGlow2} pointerEvents="none" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.textHigh} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('achievements.title')}</Text>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryText}>
            {unlocked.size}/{ACHIEVEMENTS.length}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((ach, idx) => {
            const isUnlocked = unlocked.has(ach.id);
            const accent =
              ach.color === 'gold' ? c.gold
              : ach.color === 'purple' ? c.purple
              : ach.color === 'cyan' ? c.cyan
              : c.neon;

            return (
              <Animated.View
                key={ach.id}
                entering={FadeInDown.delay(idx * 30).duration(280).springify().damping(14)}
                style={[
                  styles.card,
                  isUnlocked
                    ? { borderColor: accent, shadowColor: accent }
                    : styles.cardLocked,
                ]}
              >
                <View style={styles.cardTopHighlight} pointerEvents="none" />
                <View
                  style={[
                    styles.iconCircle,
                    {
                      borderColor: isUnlocked ? accent : c.divider,
                      backgroundColor: isUnlocked ? c.surface : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={ach.iconName as keyof typeof Ionicons.glyphMap}
                    size={28}
                    color={isUnlocked ? accent : c.textMuted}
                  />
                  {!isUnlocked ? (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={12} color={c.textMuted} />
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.cardTitle,
                    !isUnlocked && styles.cardTitleLocked,
                  ]}
                  numberOfLines={2}
                >
                  {t(ach.titleKey)}
                </Text>
                <Text
                  style={[
                    styles.cardDesc,
                    !isUnlocked && styles.cardDescLocked,
                  ]}
                  numberOfLines={2}
                >
                  {t(ach.descKey)}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    bgGlow1: {
      position: 'absolute', top: 80, left: -100,
      width: 220, height: 220, borderRadius: 110,
      backgroundColor: c.gold, opacity: 0.06,
    },
    bgGlow2: {
      position: 'absolute', bottom: 100, right: -120,
      width: 240, height: 240, borderRadius: 120,
      backgroundColor: c.purple, opacity: 0.08,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    backButton: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { ...textStyles.heading, color: c.textHigh, fontSize: 20, flex: 1 },
    summaryPill: {
      backgroundColor: c.goldBg,
      borderWidth: 1, borderColor: c.gold,
      paddingHorizontal: spacing.md, paddingVertical: 6,
      borderRadius: radius.pill,
    },
    summaryText: { ...textStyles.bodyBold, color: c.gold, fontSize: 13 },
    scroll: { paddingHorizontal: spacing.base, paddingTop: spacing.sm },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: 'space-between',
    },
    card: {
      width: '47%',
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
    },
    cardLocked: {
      borderColor: c.divider,
      shadowOpacity: 0,
      opacity: 0.5,
    },
    cardTopHighlight: {
      position: 'absolute', top: 0,
      left: spacing.sm, right: spacing.sm,
      height: 1, backgroundColor: c.glassHighlight,
    },
    iconCircle: {
      width: 52, height: 52, borderRadius: 26,
      borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.xs,
    },
    lockOverlay: {
      position: 'absolute',
      bottom: -2, right: -2,
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 13,
      textAlign: 'center',
    },
    cardTitleLocked: { color: c.textMed },
    cardDesc: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 10,
      textAlign: 'center',
      lineHeight: 14,
    },
    cardDescLocked: { color: c.textMuted },
  });
}
