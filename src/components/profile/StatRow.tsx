import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// STAT ROW — Sade 3'lü kompakt istatistik şeridi
//
// Öncesi: 2x2 grid (Streak, Hearts, Accuracy, Completed) — fazla
// Şimdi: tek satır 3 kart (Streak, Hearts, Completed)
//
// "Doğruluk" kaldırıldı — kullanıcı zaten her ders sonunda + Achievements
// ekranında bu bilgiyi görüyor; profilde tekrar olmaması daha sade.
// ════════════════════════════════════════════════════════════════

interface StatRowProps {
  streak: number;
  hearts: number;
  maxHearts: number;
  isPremium?: boolean;
  completedCount: number;
}

export function StatRow({
  streak,
  hearts,
  maxHearts,
  isPremium = false,
  completedCount,
}: StatRowProps) {
  const c = useThemeColors();
  const t = useT();
  const styles = makeStyles(c);

  return (
    <View style={styles.row}>
      <Tile
        c={c}
        icon="flame"
        color={streak > 0 ? c.gold : c.textMuted}
        label={t('profile.streak')}
        value={`${streak}`}
        suffix={streak === 0 ? '' : t('profile.streakDays', { n: streak }).replace(/^\d+\s*/, '')}
      />
      <Tile
        c={c}
        icon="heart"
        color={c.red}
        label={t('profile.hearts')}
        value={isPremium ? '∞' : `${hearts}`}
        suffix={isPremium ? '' : `/${maxHearts}`}
      />
      <Tile
        c={c}
        icon="book"
        color={c.neon}
        label={t('profile.completed')}
        value={`${completedCount}`}
      />
    </View>
  );
}

function Tile({
  c,
  icon,
  color,
  label,
  value,
  suffix,
}: {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
  suffix?: string;
}) {
  const styles = makeStyles(c);
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={styles.textCol}>
        <Text style={[styles.value, { color }]} numberOfLines={1}>
          {value}
          {suffix ? <Text style={styles.suffix}> {suffix}</Text> : null}
        </Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    tile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    textCol: { flex: 1, gap: 0 },
    value: { ...textStyles.bodyBold, fontSize: 18, lineHeight: 22 },
    suffix: { ...textStyles.body, color: c.textMuted, fontSize: 11, fontWeight: '500' },
    label: { ...textStyles.label, color: c.textLow, fontSize: 9, letterSpacing: 0.3 },
  });
}
