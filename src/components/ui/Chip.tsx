import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dark, spacing, radius, textStyles } from '../../theme';

// ════════════════════════════════════════════════════════════════
// CHIP
// Çok amaçlı küçük etiket — kelime havuzu, kategori, filtre.
// ════════════════════════════════════════════════════════════════

export type ChipVariant = 'default' | 'primary' | 'purple' | 'solid';
export type ChipSize = 'sm' | 'md' | 'lg';

interface ChipProps {
  label: string;
  onPress?: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  disabled?: boolean;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: { paddingV: spacing.xs, paddingH: spacing.sm, fontSize: 12, iconSize: 14 },
  md: { paddingV: spacing.sm, paddingH: spacing.md, fontSize: 14, iconSize: 16 },
  lg: { paddingV: spacing.md, paddingH: spacing.base, fontSize: 16, iconSize: 18 },
} as const;

function getVariantStyles(variant: ChipVariant, disabled: boolean) {
  if (disabled) {
    return { bg: dark.surface, border: dark.border, text: dark.textMuted };
  }
  switch (variant) {
    case 'primary':
      return { bg: dark.neonBg, border: dark.neon, text: dark.neonLight };
    case 'purple':
      return { bg: dark.purpleBg, border: dark.purple, text: dark.purpleLight };
    case 'solid':
      return { bg: dark.neon, border: dark.neon, text: dark.textOnNeon };
    case 'default':
    default:
      return { bg: dark.glassBg, border: dark.glassBorderStrong, text: dark.textHigh };
  }
}

export function Chip({
  label,
  onPress,
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
}: ChipProps) {
  const effectiveVariant: ChipVariant = selected ? 'primary' : variant;
  const sz = SIZES[size];
  const v = getVariantStyles(effectiveVariant, disabled);

  const inner = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: sz.paddingV,
          paddingHorizontal: sz.paddingH,
        },
        style,
      ]}
    >
      {iconLeft && <Ionicons name={iconLeft} size={sz.iconSize} color={v.text} />}
      <Text
        style={[styles.label, { color: v.text, fontSize: sz.fontSize }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {iconRight && <Ionicons name={iconRight} size={sz.iconSize} color={v.text} />}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled }}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { ...textStyles.bodyBold },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
