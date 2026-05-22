import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';

interface HeartPackageCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  variant?: 'refill' | 'disabled' | 'premium';
  onPurchase: () => void;
}

export function HeartPackageCard({
  title, description, ctaLabel, variant = 'refill', onPurchase,
}: HeartPackageCardProps) {
  const c = useThemeColors();
  const isDisabled = variant === 'disabled';
  const isPremium = variant === 'premium';

  const handlePress = () => {
    if (isDisabled || isPremium) {
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    onPurchase();
  };

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.iconBox}>
        <Ionicons name="heart" size={28} color={c.red} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>
      <Pressable
        onPress={handlePress}
        disabled={isDisabled || isPremium}
        style={({ pressed }) => [
          styles.button,
          isDisabled && styles.buttonDisabled,
          isPremium && styles.buttonPremium,
          pressed && !isDisabled && !isPremium && styles.buttonPressed,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            isDisabled && styles.buttonTextDisabled,
            isPremium && styles.buttonTextPremium,
          ]}
        >{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.lg, padding: spacing.base, overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    iconBox: {
      width: 56, height: 56, borderRadius: radius.md,
      backgroundColor: c.redBg, borderWidth: 1, borderColor: c.red,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    info: { flex: 1, gap: 2 },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    description: { ...textStyles.body, color: c.textLow, fontSize: 12 },
    button: {
      minWidth: 70, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: radius.md, backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
    },
    buttonDisabled: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      shadowOpacity: 0, elevation: 0,
    },
    buttonPremium: { backgroundColor: c.gold, shadowColor: c.gold },
    buttonPressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
    buttonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 13 },
    buttonTextDisabled: { color: c.textMuted },
    buttonTextPremium: { color: c.bg },
  });
}
