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
import { dark, spacing, radius, textStyles, shadows } from '../../theme';

// ════════════════════════════════════════════════════════════════
// PRIMARY BUTTON
// Ana eylem butonu — neon yeşil zemin + glow gölge.
// ════════════════════════════════════════════════════════════════

export type PrimaryButtonSize = 'sm' | 'md' | 'lg';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: PrimaryButtonSize;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  noGlow?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: PressableProps['accessibilityLabel'];
}

const HEIGHTS: Record<PrimaryButtonSize, number> = { sm: 40, md: 52, lg: 60 };

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = true,
  size = 'md',
  iconLeft,
  iconRight,
  noGlow = false,
  style,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const isInactive = disabled || loading;
  const height = HEIGHTS[size];

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
        !noGlow && !isInactive && shadows.glowPrimary,
        pressed && !isInactive && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.surface,
          { height },
          isInactive && styles.surfaceDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={dark.textOnNeon} />
        ) : (
          <View style={styles.content}>
            {iconLeft && (
              <Ionicons
                name={iconLeft}
                size={20}
                color={isInactive ? dark.textMuted : dark.textOnNeon}
              />
            )}
            <Text
              style={[
                styles.label,
                isInactive && styles.labelDisabled,
                size === 'sm' && { fontSize: 13 },
                size === 'lg' && { fontSize: 17 },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {iconRight && (
              <Ionicons
                name={iconRight}
                size={20}
                color={isInactive ? dark.textMuted : dark.textOnNeon}
              />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.md },
  fullWidth: { width: '100%' },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.92 },
  surface: {
    backgroundColor: dark.neon,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  surfaceDisabled: { backgroundColor: dark.surfaceHigh },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...textStyles.button, color: dark.textOnNeon },
  labelDisabled: { color: dark.textMuted },
});
