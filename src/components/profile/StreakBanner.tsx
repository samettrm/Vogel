import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// STREAK BANNER — Profile'da streak > 0 ise gösterilir
// "🔥 Serini koru!" + gün sayısı
// ════════════════════════════════════════════════════════════════

interface Props {
  streak: number;
}

export function StreakBanner({ streak }: Props) {
  const c = useThemeColors();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.banner}>
      <View style={styles.topHighlight} pointerEvents="none" />
      <Text style={styles.title}>{t('streakBanner.keepIt')}</Text>
      <Text style={styles.subtitle}>{t('streakBanner.days', { n: streak })}</Text>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    banner: {
      backgroundColor: c.goldBg,
      borderWidth: 1, borderColor: c.gold,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      gap: 4,
      overflow: 'hidden',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    title: { ...textStyles.bodyBold, color: c.gold, fontSize: 15 },
    subtitle: { ...textStyles.body, color: c.textMed, fontSize: 12 },
  });
}
