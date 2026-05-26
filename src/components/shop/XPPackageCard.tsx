import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface XPPackageCardProps {
  title: string;
  amount: number;
  priceLabel: string;
  badge?: 'popular' | 'best';
  onPurchase: () => void;
}

export function XPPackageCard({
  title, amount, priceLabel, badge, onPurchase,
}: XPPackageCardProps) {
  const c = useThemeColors();
  const t = useT();

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      title,
      `${amount} XP satın al?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            onPurchase();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ],
    );
  };

  const badgeConfig =
    badge === 'popular'
      ? { label: t('shop.popular'), bg: c.purple, color: c.white }
      : badge === 'best'
        ? { label: t('shop.bestValue'), bg: c.gold, color: c.bg }
        : null;

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topHighlight} pointerEvents="none" />
      {badgeConfig ? (
        <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
          <Text style={[styles.badgeText, { color: badgeConfig.color }]}>{badgeConfig.label}</Text>
        </View>
      ) : null}

      <View style={styles.iconCircle}>
        <Ionicons name="flash" size={28} color={c.bg} />
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.amountRow}>
        <Text style={styles.amountValue}>+{amount}</Text>
        <Text style={styles.amountUnit}>{t('shop.walletXp')}</Text>
      </View>

      <View style={styles.priceButton}>
        <Text style={styles.priceText}>{priceLabel}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      flexBasis: '31%', flexGrow: 1, minWidth: 100,
      backgroundColor: c.glassBgStrong, borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.md,
      alignItems: 'center', gap: spacing.sm, overflow: 'hidden',
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.sm, right: spacing.sm,
      height: 1, backgroundColor: c.glassHighlight,
    },
    badge: {
      position: 'absolute', top: 8, right: 6,
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: radius.pill,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 6, elevation: 3,
    },
    badgeText: { ...textStyles.label, fontSize: 8, lineHeight: 10 },
    iconCircle: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: c.gold,
      alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs,
      shadowColor: c.gold, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 10, elevation: 6,
    },
    title: { ...textStyles.label, color: c.textMed, fontSize: 11, textAlign: 'center' },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    amountValue: { ...textStyles.display, color: c.gold, fontSize: 22, lineHeight: 26 },
    amountUnit: { ...textStyles.bodyBold, color: c.gold, fontSize: 12 },
    priceButton: {
      minWidth: 70, paddingHorizontal: spacing.sm, paddingVertical: 6,
      borderRadius: radius.md, backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 8, elevation: 4, marginTop: 2,
    },
    priceText: { ...textStyles.button, color: c.textOnNeon, fontSize: 12 },
  });
}
