import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { dark, spacing, radius, shadows } from '../../theme';

// ════════════════════════════════════════════════════════════════
// GLASS CARD
// Glassmorphism kart — semi-transparent koyu zemin + ince üst
// highlight çizgisi + yumuşak gölge.
// ════════════════════════════════════════════════════════════════

export type GlassCardVariant = 'default' | 'strong' | 'flat';
export type GlassCardPadding = 'none' | 'sm' | 'md' | 'lg';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  padding?: GlassCardPadding;
  onPress?: () => void;
  glowColor?: string;
  style?: StyleProp<ViewStyle>;
  noHighlight?: boolean;
}

const PADDINGS: Record<GlassCardPadding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.base,
  lg: spacing.lg,
};

function getVariantBg(variant: GlassCardVariant): string {
  switch (variant) {
    case 'strong': return dark.glassBgStrong;
    case 'flat': return dark.surface;
    case 'default':
    default: return dark.glassBg;
  }
}

export function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  glowColor,
  style,
  noHighlight = false,
}: GlassCardProps) {
  const pad = PADDINGS[padding];
  const bg = getVariantBg(variant);

  const glowStyle: ViewStyle | undefined = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
      }
    : undefined;

  const cardContent = (pressed = false) => (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, padding: pad },
        pressed && styles.pressed,
      ]}
    >
      {!noHighlight && <View style={styles.topHighlight} />}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.wrapper, glowStyle, shadows.card, style]}>
        {({ pressed }) => cardContent(pressed)}
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrapper, glowStyle, shadows.card, style]}>
      {cardContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: dark.glassBorder,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 1,
    backgroundColor: dark.glassHighlight,
  },
});
