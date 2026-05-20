import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dark, spacing, radius, textStyles } from '../../theme';

// ════════════════════════════════════════════════════════════════
// STAT PILL
// Üst bar'da XP, kalp, streak vb. tek değer gösteren cam pill.
// ════════════════════════════════════════════════════════════════

export type StatPillVariant = 'gold' | 'red' | 'streak' | 'cyan' | 'purple' | 'primary';
export type StatPillSize = 'sm' | 'md';

interface StatPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  variant?: StatPillVariant;
  size?: StatPillSize;
  label?: string;
  onPress?: () => void;
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: { paddingV: 4, paddingH: spacing.sm, fontSize: 13, iconSize: 16, labelSize: 10 },
  md: { paddingV: 6, paddingH: spacing.md, fontSize: 15, iconSize: 20, labelSize: 11 },
} as const;

function getIconColor(variant: StatPillVariant, dimmed: boolean): string {
  if (dimmed) return dark.textMuted;
  switch (variant) {
    case 'gold': return dark.gold;
    case 'red': return dark.red;
    case 'streak': return dark.gold;
    case 'cyan': return dark.cyan;
    case 'purple': return dark.purple;
    case 'primary': return dark.neon;
    default: return dark.textHigh;
  }
}

export function StatPill({
  icon,
  value,
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  dimmed = false,
  style,
}: StatPillProps) {
  const sz = SIZES[size];
  const iconColor = getIconColor(variant, dimmed);

  const content = (
    <View
      style={[
        styles.pill,
        { paddingVertical: sz.paddingV, paddingHorizontal: sz.paddingH },
        style,
      ]}
    >
      <Ionicons name={icon} size={sz.iconSize} color={iconColor} />
      <Text style={[styles.value, { fontSize: sz.fontSize }, dimmed && styles.dimmed]}>
        {value}
      </Text>
      {label && (
        <Text style={[styles.label, { fontSize: sz.labelSize }, dimmed && styles.dimmed]}>
          {label}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${value} ${label ?? ''}`.trim()}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: dark.glassBg,
    borderWidth: 1,
    borderColor: dark.glassBorder,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  value: { ...textStyles.bodyBold, color: dark.textHigh },
  label: { ...textStyles.label, color: dark.textLow, marginLeft: 2 },
  dimmed: { color: dark.textMuted },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
