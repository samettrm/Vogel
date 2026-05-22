import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeInDown,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// PAYWALL MODAL
//
// Kullanım: 3. ders tamamlandığında (free kullanıcı için) gösterilir.
// "Vogel Plus'ı Gör" → shop tab'ına yönlendirir.
// "Hayır teşekkürler" → dismiss eder, bir daha gösterilmez.
// ════════════════════════════════════════════════════════════════

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const FEATURES = [
  'paywall.feature1',
  'paywall.feature2',
  'paywall.feature3',
  'paywall.feature4',
] as const;

export function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const c = useThemeColors();
  const t = useT();

  // Hafif nabız animasyonu — CTA butonu
  // 🚀 PERF: modal kapanınca animasyonu iptal et; aksi takdirde arka planda worklet çalışmaya devam eder
  const glow = useSharedValue(0.5);
  useEffect(() => {
    if (!visible) {
      cancelAnimation(glow);
      glow.value = 0.5;
      return;
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.5, { duration: 900 }),
      ),
      -1,
      true,
    );
    return () => { cancelAnimation(glow); };
  }, [visible, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value * 0.6,
  }));

  const handleCta = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onDismiss();
    router.push('/(tabs)/shop');
  };

  const handleDismiss = () => {
    Haptics.selectionAsync().catch(() => {});
    onDismiss();
  };

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={FadeInDown.springify().damping(18).stiffness(160)} style={styles.sheet}>

            {/* Badge */}
            <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.badge}>
              <Text style={styles.badgeText}>{t('paywall.badge')}</Text>
            </Animated.View>

            {/* Başlık */}
            <Animated.Text entering={FadeIn.delay(180).duration(300)} style={styles.title}>
              {t('paywall.title')}
            </Animated.Text>
            <Animated.Text entering={FadeIn.delay(240).duration(300)} style={styles.subtitle}>
              {t('paywall.subtitle')}
            </Animated.Text>

            {/* Özellik listesi */}
            <Animated.View entering={FadeIn.delay(320).duration(300)} style={styles.featureList}>
              {FEATURES.map((key, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={c.neon} />
                  <Text style={styles.featureText}>{t(key)}</Text>
                </View>
              ))}
            </Animated.View>

            {/* CTA */}
            <Animated.View
              entering={FadeIn.delay(420).duration(300)}
              style={[styles.ctaGlow, glowStyle]}
            >
              <Pressable
                onPress={handleCta}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              >
                <Ionicons name="diamond" size={18} color={c.bg} />
                <Text style={styles.ctaText}>{t('paywall.cta')}</Text>
              </Pressable>
            </Animated.View>

            {/* Dismiss */}
            <Animated.View entering={FadeIn.delay(500).duration(300)}>
              <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>{t('paywall.dismiss')}</Text>
              </Pressable>
            </Animated.View>

          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    sheetWrapper: { width: '100%' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderColor: c.glassBorderStrong,
    },
    badge: {
      alignSelf: 'center',
      backgroundColor: c.neonBg,
      borderWidth: 1,
      borderColor: c.neon,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.base,
      paddingVertical: 4,
      marginBottom: spacing.xs,
    },
    badgeText: { ...textStyles.bodyBold, color: c.neon, fontSize: 12 },
    title: {
      ...textStyles.display,
      color: c.textHigh,
      textAlign: 'center',
      fontSize: 26,
    },
    subtitle: {
      ...textStyles.body,
      color: c.textMed,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
    },
    featureList: {
      gap: spacing.sm,
      backgroundColor: c.glassBg,
      borderRadius: radius.md,
      padding: spacing.base,
      borderWidth: 1,
      borderColor: c.glassBorder,
      marginTop: spacing.xs,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...textStyles.body, color: c.textHigh, fontSize: 14, flex: 1 },
    ctaGlow: {
      borderRadius: radius.md,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 16,
      elevation: 8,
      marginTop: spacing.xs,
    },
    ctaButton: {
      backgroundColor: c.neon,
      borderRadius: radius.md,
      paddingVertical: spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    ctaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    ctaText: { ...textStyles.button, color: c.textOnNeon, fontSize: 16 },
    dismissBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    dismissText: { ...textStyles.body, color: c.textLow, fontSize: 13 },
  });
}
