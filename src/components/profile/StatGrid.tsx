import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface StatGridProps {
  streak: number;
  hearts: number;
  maxHearts: number;
  isPremium?: boolean;
  accuracy: number;
  completedCount: number;
}

export function StatGrid({
  streak,
  hearts,
  maxHearts,
  isPremium = false,
  accuracy,
  completedCount,
}: StatGridProps) {
  const c = useThemeColors();
  const t = useT();
  const styles = makeStyles(c);

  // Streak / dersler için "gün" / "tamamlandı" suffix'leri i18n'den
  const daysSuffix = t('profile.streakDays', { n: streak }).replace(/^\d+\s*/, '');
  const completedSuffix = t('profile.completed').toLowerCase();

  return (
    <View style={styles.grid}>
      <StatTile c={c} index={0} icon="flame" tone={c.gold} toneBg={c.goldBg}
        label={t('profile.streak')} value={`${streak}`} suffix={daysSuffix} />
      <StatTile c={c} index={1} icon="heart" tone={c.red} toneBg={c.redBg}
        label={t('profile.hearts')}
        value={isPremium ? '∞' : `${hearts}`}
        suffix={isPremium ? 'Premium' : `/ ${maxHearts}`} />
      <StatTile c={c} index={2} icon="checkmark-circle" tone={c.neon} toneBg={c.neonBg}
        label={t('profile.accuracy')} value={`%${accuracy}`} />
      <StatTile c={c} index={3} icon="book" tone={c.purpleLight} toneBg={c.purpleBg}
        label={t('profile.completed')} value={`${completedCount}`} suffix={completedSuffix} />
    </View>
  );
}

interface StatTileProps {
  c: ReturnType<typeof useThemeColors>;
  index: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneBg: string;
  label: string;
  value: string;
  suffix?: string;
}

function StatTile({ c, index, icon, tone, toneBg, label, value, suffix }: StatTileProps) {
  const styles = makeStyles(c);
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(360).springify().damping(14)}
      style={[styles.tile, { borderColor: tone }]}
    >
      <View style={styles.tileTopHighlight} pointerEvents="none" />
      <View style={styles.tileHeader}>
        <View style={[styles.iconWrap, { backgroundColor: toneBg, borderColor: tone }]}>
          <Ionicons name={icon} size={16} color={tone} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {suffix ? <Text style={styles.suffix} numberOfLines={1}>{suffix}</Text> : null}
      </View>
    </Animated.View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: {
      flexBasis: '48%', flexGrow: 1,
      backgroundColor: c.glassBg,
      borderRadius: radius.lg, borderWidth: 1,
      padding: spacing.base, gap: spacing.sm, overflow: 'hidden',
    },
    tileTopHighlight: {
      position: 'absolute', top: 0,
      left: spacing.sm, right: spacing.sm,
      height: 1, backgroundColor: c.glassHighlight,
    },
    tileHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconWrap: {
      width: 24, height: 24, borderRadius: 6,
      borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    label: { ...textStyles.label, color: c.textLow, fontSize: 11 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    value: { ...textStyles.display, fontSize: 26, lineHeight: 30 },
    suffix: { ...textStyles.body, color: c.textMuted, fontSize: 12, flexShrink: 1 },
  });
}
