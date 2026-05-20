import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useUserStore } from '../../store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// REVIEW BANNER — Map ekranında "Tekrar Sırası" CTA'sı
//
// SM-2 algoritmasının zamanı gelen kelimelerini saydırır.
// Eğer >= 3 kelime tekrar bekliyorsa banner görünür.
// Tıklanınca /review'a gider.
//
// Performans:
//   - reviewItems Record'una abone — değişimleri yakalar
//   - useMemo ile due count hesabı
//   - Eğer due count < 3 ise render etmez (null döner)
// ════════════════════════════════════════════════════════════════

const MIN_DUE_FOR_BANNER = 3;

export function ReviewBanner() {
  const c = useThemeColors();
  const t = useT();
  const reviewItems = useUserStore((s) => s.reviewItems);

  const dueCount = useMemo(() => {
    const now = Date.now();
    let count = 0;
    for (const item of Object.values(reviewItems)) {
      if (item.nextReviewAt <= now) count += 1;
    }
    return count;
  }, [reviewItems]);

  if (dueCount < MIN_DUE_FOR_BANNER) return null;

  const styles = makeStyles(c);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        router.push('/review');
      }}
      style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
      accessibilityRole="button"
      accessibilityLabel={t('review.bannerCta', { count: dueCount })}
    >
      <View style={styles.iconBox}>
        <Ionicons name="refresh" size={20} color={c.purpleLight} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t('review.bannerTitle', { count: dueCount })}</Text>
        <Text style={styles.subtitle}>{t('review.bannerSubtitle')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.purpleLight} />
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.purpleBg,
      borderWidth: 1.5,
      borderColor: c.purple,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      marginHorizontal: spacing.base,
      marginVertical: spacing.sm,
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    bannerPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    iconBox: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.purple,
      alignItems: 'center', justifyContent: 'center',
    },
    textCol: { flex: 1, gap: 2 },
    title: {
      ...textStyles.bodyBold,
      color: c.purpleLight,
      fontSize: 14,
    },
    subtitle: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 12,
    },
  });
}
