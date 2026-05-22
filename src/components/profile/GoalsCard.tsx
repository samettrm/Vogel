import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useUserStore } from '../../store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { getMotivationMeta } from '../../services/personalization';

// ════════════════════════════════════════════════════════════════
// GOALS CARD — Profil'de "Hedeflerin" kartı
//
// Onboarding'de seçilen motivasyonları (travel, work, family, vs.)
// güzel bir kartta gösterir. Boşsa CTA ile Settings'e yönlendirir.
//
// Tıklanınca → Settings'te "Hedeflerin" bölümüne kaydırma yapar.
// (router.push ile settings'e gider; orada kullanıcı düzenleyebilir.)
// ════════════════════════════════════════════════════════════════

export function GoalsCard() {
  const c = useThemeColors();
  const t = useT();
  const learningMotivations = useUserStore((s) => s.learningMotivations);

  const styles = makeStyles(c);

  const hasGoals = learningMotivations && learningMotivations.length > 0;

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('profile.goalsCardTitle')}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Ionicons name="flag" size={18} color={c.purple} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>{t('profile.goalsCardTitle')}</Text>
          <Text style={styles.subtitle}>
            {hasGoals ? t('profile.goalsCardEdit') : t('profile.goalsCardEmpty')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textLow} />
      </View>

      {hasGoals ? (
        <View style={styles.chipsRow}>
          {learningMotivations.map((motivationId) => {
            const meta = getMotivationMeta(motivationId);
            if (!meta) return null;
            return (
              <View key={motivationId} style={styles.chip}>
                <Text style={styles.chipEmoji}>{meta.emoji}</Text>
                <Text style={styles.chipLabel}>{t(meta.labelKey)}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintText}>
            {t('profile.goalsCardEmptyHint')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: c.purple,
      borderRadius: radius.lg,
      padding: spacing.base,
      gap: spacing.md,
    },
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.purpleBg,
      borderWidth: 1,
      borderColor: c.purple,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 15,
    },
    subtitle: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 12,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: c.purpleBg,
      borderWidth: 1,
      borderColor: c.purple,
      borderRadius: radius.pill,
    },
    chipEmoji: {
      fontSize: 14,
    },
    chipLabel: {
      ...textStyles.bodyBold,
      color: c.purpleLight,
      fontSize: 12,
    },
    emptyHint: {
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    emptyHintText: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 12,
      textAlign: 'center',
    },
  });
}
