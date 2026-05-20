import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { ACHIEVEMENTS } from '../../data/achievements';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS SUMMARY — Profil ekranında özet kart
// "5/18 rozet açıldı" + ilk 4 rozet önizleme + "Tümünü gör"
// ════════════════════════════════════════════════════════════════

export function AchievementsSummary() {
  const c = useThemeColors();
  const t = useT();
  const router = useRouter();
  const unlocked = useUserStore((s) => s.achievementsUnlocked);

  const unlockedCount = unlocked.size;
  const totalCount = ACHIEVEMENTS.length;

  // İlk 4 rozet: önce açıklar, sonra kilitliler
  const preview = [...ACHIEVEMENTS].sort((a, b) => {
    const aOpen = unlocked.has(a.id) ? 1 : 0;
    const bOpen = unlocked.has(b.id) ? 1 : 0;
    return bOpen - aOpen;
  }).slice(0, 4);

  const styles = makeStyles(c);

  return (
    <Pressable
      onPress={() => router.push('/achievements')}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topHighlight} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="trophy" size={18} color={c.gold} />
          <Text style={styles.title}>{t('achievements.title')}</Text>
        </View>
        <Text style={styles.summary}>
          {t('achievements.summary', { unlocked: unlockedCount, total: totalCount })}
        </Text>
      </View>

      <View style={styles.previewRow}>
        {preview.map((ach) => {
          const isUnlocked = unlocked.has(ach.id);
          const accent =
            ach.color === 'gold' ? c.gold
            : ach.color === 'purple' ? c.purple
            : ach.color === 'cyan' ? c.cyan
            : c.neon;

          return (
            <View
              key={ach.id}
              style={[
                styles.badge,
                isUnlocked ? { borderColor: accent } : styles.badgeLocked,
              ]}
            >
              <Ionicons
                name={ach.iconName as keyof typeof Ionicons.glyphMap}
                size={20}
                color={isUnlocked ? accent : c.textMuted}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.viewAll}>{t('achievements.viewAll')}</Text>
        <Ionicons name="chevron-forward" size={16} color={c.neonLight} />
      </View>
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      padding: spacing.base,
      gap: spacing.md,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    summary: { ...textStyles.label, color: c.gold, fontSize: 12 },
    previewRow: { flexDirection: 'row', gap: spacing.sm },
    badge: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center',
    },
    badgeLocked: { borderColor: c.divider, opacity: 0.4 },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 4,
    },
    viewAll: { ...textStyles.label, color: c.neonLight, fontSize: 12 },
  });
}
