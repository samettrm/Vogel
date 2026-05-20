import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dark, radius, shadows } from '../../theme';

// ════════════════════════════════════════════════════════════════
// ICON BUTTON
// Sadece ikon içeren dairesel/kare buton.
// Kullanım: kapatma (X), sesli oynatma, geri, ayarlar vb.
// ════════════════════════════════════════════════════════════════

export type IconButtonVariant = 'glass' | 'primary' | 'purple' | 'ghost' | 'solid';
export type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconButtonShape = 'circle' | 'square';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  disabled?: boolean;
  iconColor?: string;
  noGlow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

const SIZES: Record<IconButtonSize, { box: number; icon: number }> = {
  sm: { box: 32, icon: 16 },
  md: { box: 44, icon: 22 },
  lg: { box: 56, icon: 28 },
  xl: { box: 72, icon: 36 },
};

function getVariantStyles(variant: IconButtonVariant, disabled: boolean) {
  if (disabled) {
    return { bg: dark.surface, border: dark.border, icon: dark.textMuted, glow: undefined as ViewStyle | undefined };
  }
  switch (variant) {
    case 'primary':
      return { bg: dark.neon, border: dark.neon, icon: dark.textOnNeon, glow: shadows.glowPrimary as ViewStyle | undefined };
    case 'purple':
      return { bg: dark.purple, border: dark.purple, icon: dark.white, glow: shadows.glowPurple as ViewStyle | undefined };
    case 'ghost':
      return { bg: 'transparent', border: 'transparent', icon: dark.textMed, glow: undefined as ViewStyle | undefined };
    case 'solid':
      return { bg: dark.surfaceElevated, border: dark.border, icon: dark.textHigh, glow: undefined as ViewStyle | undefined };
    case 'glass':
    default:
      return { bg: dark.glassBg, border: dark.glassBorderStrong, icon: dark.textHigh, glow: undefined as ViewStyle | undefined };
  }
}

export function IconButton({
  icon,
  onPress,
  variant = 'glass',
  size = 'md',
  shape = 'circle',
  disabled = false,
  iconColor,
  noGlow = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const sz = SIZES[size];
  const v = getVariantStyles(variant, disabled);
  const borderRadius = shape === 'circle' ? sz.box / 2 : radius.md;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.wrapper,
        { width: sz.box, height: sz.box, borderRadius },
        !noGlow && !disabled && v.glow,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      hitSlop={8}
    >
      <View
        style={[
          styles.surface,
          {
            backgroundColor: v.bg,
            borderColor: v.border,
            borderRadius,
            borderWidth: variant === 'ghost' ? 0 : 1,
          },
        ]}
      >
        <Ionicons name={icon} size={sz.icon} color={iconColor ?? v.icon} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  surface: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.92 }] },
});
