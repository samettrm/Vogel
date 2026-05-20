import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dark, spacing, radius, textStyles } from '../../theme';

// ════════════════════════════════════════════════════════════════
// SECONDARY BUTTON
// İkincil eylem — mor ya da glass outline buton.
// ════════════════════════════════════════════════════════════════

export type SecondaryButtonVariant = 'purple' | 'glass' | 'ghost';
export type SecondaryButtonSize = 'sm' | 'md' | 'lg';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: SecondaryButtonVariant;
  size?: SecondaryButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  accessibilityLabel?: PressableProps['accessibilityLabel'];
}

const HEIGHTS: Record<SecondaryButtonSize, number> = { sm: 40, md: 52, lg: 60 };

function getVariantStyles(variant: SecondaryButtonVariant, disabled: boolean) {
  if (disabled) {
    return { bg: dark.surface, border: dark.border, text: dark.textMuted };
  }
  switch (variant) {
    case 'purple':
      return { bg: dark.purpleBg, border: dark.purple, text: dark.purpleLight };
    case 'glass':
      return { bg: dark.glassBg, border: dark.glassBorderStrong, text: dark.textHigh };
    case 'ghost':
    default:
      return { bg: 'transparent', border: dark.borderStrong, text: dark.textMed };
  }
}

export function SecondaryButton({
  label,
  onPress,
  variant = 'purple',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  iconLeft,
  iconRight,
  style,
  accessibilityLabel,
}: SecondaryButtonProps) {
  const isInactive = disabled || loading;
  const height = HEIGHTS[size];
  const v = getVariantStyles(variant, isInactive);

  return (
    <Pressable
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.wrapper,
        fullWidth && styles.fullWidth,
        pressed && !isInactive && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.surface,
          { height, backgroundColor: v.bg, borderColor: v.border },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <View style={styles.content}>
            {iconLeft && <Ionicons name={iconLeft} size={20} color={v.text} />}
            <Text
              style={[
                styles.label,
                { color: v.text },
                size === 'sm' && { fontSize: 13 },
                size === 'lg' && { fontSize: 17 },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {iconRight && <Ionicons name={iconRight} size={20} color={v.text} />}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.md },
  fullWidth: { width: '100%' },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.85 },
  surface: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...textStyles.button },
});
