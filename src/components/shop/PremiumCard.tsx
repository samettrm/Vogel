import React, { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { dark, radius, spacing, textStyles } from '../../theme';
import { SpinningDiamondGem } from '../shared/SpinningDiamondGem';

// ════════════════════════════════════════════════════════════════
// PREMIUM CARD
// Vogel Plus banner. Aktifse "Aktif Üye" görünür. Değilse "Yükselt"
// → makePremium store fonksiyonunu çağırır (RC purchase'ından sonra).
// ════════════════════════════════════════════════════════════════

interface PremiumCardProps {
  isPremium: boolean;
  onUpgrade: () => void; // store.makePremium çağıracak
}

export function PremiumCard({ isPremium, onUpgrade }: PremiumCardProps) {
  // Crown ve glow nabız animasyonu
  const pulse = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!isPremium) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      cancelAnimation(shimmer);
      pulse.value = 1;
      shimmer.value = 0;
    }
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(shimmer);
    };
  }, [isPremium, pulse, shimmer]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));

  const handlePress = () => {
    if (isPremium) {
      Alert.alert(
        '👑 Vogel Plus',
        'Premium üyeliğin aktif. Sınırsız can ve özel içerikler kullanılabilir.',
      );
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      '👑 Vogel Plus',
      'Aylık ₺199 — sınırsız can, tüm seviyeler, özel dersler.\nAboneliği istediğin zaman iptal edebilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam Et',
          onPress: () => {
            onUpgrade();
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        isPremium && styles.cardActive,
        pressed && styles.pressed,
      ]}
    >
      {/* Üst parlak çizgi */}
      <View style={styles.topHighlight} pointerEvents="none" />

      {/* Animasyonlu shimmer arka katman */}
      {!isPremium ? (
        <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
      ) : null}

      <View style={styles.row}>
        <Animated.View style={pulseStyle}>
          <SpinningDiamondGem size={44} />
        </Animated.View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Vogel Plus</Text>
            {isPremium ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>AKTİF</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {isPremium
              ? 'Sınırsız can, tüm seviyeler, özel dersler.'
              : 'Sınırsız can, tüm seviyeler, aylık ₺199.'}
          </Text>
        </View>
      </View>

      {/* Aksiyon — alt buton */}
      <View
        style={[
          styles.ctaButton,
          isPremium && styles.ctaButtonActive,
        ]}
      >
        <Ionicons
          name={isPremium ? 'checkmark-circle' : 'arrow-up-circle'}
          size={18}
          color={isPremium ? dark.gold : dark.bg}
        />
        <Text
          style={[
            styles.ctaText,
            isPremium && styles.ctaTextActive,
          ]}
        >
          {isPremium ? 'AKTİF ÜYESİN' : 'PREMIUM\'A YÜKSELT'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dark.purpleBg,
    borderWidth: 1.5,
    borderColor: dark.purple,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.base,
    overflow: 'hidden',
    shadowColor: dark.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  cardActive: {
    backgroundColor: dark.goldBg,
    borderColor: dark.gold,
    shadowColor: dark.gold,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 1,
    backgroundColor: dark.glassHighlight,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: dark.purple,
    opacity: 0.15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...textStyles.subheading,
    color: dark.purpleLight,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: dark.gold,
  },
  activeBadgeText: {
    ...textStyles.label,
    color: dark.bg,
    fontSize: 9,
  },
  description: {
    ...textStyles.body,
    color: dark.textMed,
    fontSize: 13,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: dark.gold,
    paddingHorizontal: spacing.base,
    shadowColor: dark.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonActive: {
    backgroundColor: dark.glassBgStrong,
    borderWidth: 1,
    borderColor: dark.gold,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    ...textStyles.button,
    color: dark.bg,
    fontSize: 14,
  },
  ctaTextActive: {
    color: dark.gold,
  },
});
