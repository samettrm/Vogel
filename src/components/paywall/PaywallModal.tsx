import React, { useEffect, useMemo } from 'react';
import {
  Linking,
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
import * as Haptics from '../../utils/haptics';
import { router } from 'expo-router';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { SpinningDiamondGem } from '../shared/SpinningDiamondGem';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../config/legal';

// ════════════════════════════════════════════════════════════════
// PAYWALL MODAL — Psikolojik dönüşüm optimizasyonu
//
// Tetikleyiciler:
//   1. Sosyal kanıt     → "10.000+ öğrenci kullanıyor"
//   2. Momentum rozeti  → "3. dersinizi bitirdiniz 🎉"
//   3. Kayıp dili       → "Durmak zorunda değilsin"
//   4. Fiyat framing    → "Günde yalnızca ₺3.3"
//   5. Güven sinyalleri → "İptal her zaman · Güvenli ödeme"
//   6. Buton hiyerarşi  → CTA büyük/mor/nabızsayor, dismiss küçük/soluk
// ════════════════════════════════════════════════════════════════

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const FEATURES = [
  { text: '♾️  Sınırsız ders — hiç durma' },
  { text: '📖  Tüm alıştırmalar açık' },
  { text: '📊  Detaylı istatistikler' },
  { text: '📡  Çevrimdışı erişim' },
  { text: '⚡  Öncelikli destek' },
  { text: '👨‍👩‍👧  Aile paylaşımı (6 üyeye kadar)' },
] as const;

export function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const c = useThemeColors();
  const t = useT();

  // Nabız animasyonu — CTA butonu dikkat çekiyor
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
    shadowOpacity: glow.value * 0.65,
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

  // Apple Guideline 3.1.2(c) — Privacy Policy + Terms of Use linkleri
  const handleOpenPrivacy = () => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
  };

  const handleOpenTerms = () => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(TERMS_OF_USE_URL).catch(() => {});
  };

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

            {/* ① SOSYAL KANIT — ilk göz vuruşu, güven inşa eder */}
            <Animated.View entering={FadeIn.delay(60).duration(250)} style={styles.socialRow}>
              <Text style={styles.socialStars}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.socialText}>10.000+ öğrenci Vogel Plus kullanıyor</Text>
            </Animated.View>

            {/* ② MOMENTUM ROZETİ — "3. ders" başarı anı */}
            <Animated.View entering={FadeIn.delay(120).duration(300)} style={styles.badge}>
              <Text style={styles.badgeText}>{t('paywall.badge')}</Text>
            </Animated.View>

            {/* ③ BAŞLIK — kayıp değil, momentum dili */}
            <Animated.Text entering={FadeIn.delay(180).duration(300)} style={styles.title}>
              Durmak zorunda değilsin
            </Animated.Text>
            <Animated.View entering={FadeIn.delay(240).duration(300)} style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Sınırsız can, reklamsız öğrenme. </Text>
              <Text style={styles.subtitleAccent}>Günde yalnızca ₺3.3.</Text>
            </Animated.View>

            {/* ④ FAYDA LİSTESİ */}
            <Animated.View entering={FadeIn.delay(320).duration(300)} style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={c.neon} />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </Animated.View>

            {/* ⑤ GÜVEN SİNYALLERİ */}
            <Animated.View entering={FadeIn.delay(380).duration(250)} style={styles.trustRow}>
              <Text style={styles.trustItem}>🔒 Güvenli ödeme</Text>
              <Text style={styles.trustDot}>·</Text>
              <Text style={styles.trustItem}>İptal: her zaman</Text>
              <Text style={styles.trustDot}>·</Text>
              <Text style={styles.trustItem}>Anında etkin</Text>
            </Animated.View>

            {/* ⑥ PRIMARY CTA — büyük, cazip, nabız atar */}
            <Animated.View
              entering={FadeIn.delay(420).duration(300)}
              style={[styles.ctaGlow, glowStyle]}
            >
              <Pressable
                onPress={handleCta}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              >
                <View style={styles.ctaHighlight} pointerEvents="none" />
                <SpinningDiamondGem size={20} />
                <View style={styles.ctaTextBlock}>
                  <Text style={styles.ctaTitle}>{t('paywall.cta')}</Text>
                  <Text style={styles.ctaSub}>Günde ₺3.3 · İptal: her zaman</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.purpleLight} />
              </Pressable>
            </Animated.View>

            {/* ⑦ SECONDARY — kasıtlı küçük ve soluk */}
            <Animated.View entering={FadeIn.delay(500).duration(300)}>
              <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>{t('paywall.dismiss')}</Text>
              </Pressable>
            </Animated.View>

            {/* ⑧ LEGAL — Apple Guideline 3.1.2(c) gereği abonelik akışında zorunlu.
                Otomatik yenileme açıklaması + Privacy/EULA linkleri. */}
            <Animated.View entering={FadeIn.delay(560).duration(300)} style={styles.legalBlock}>
              <Text style={styles.legalNotice}>{t('paywall.legalNotice')}</Text>
              <View style={styles.legalLinksRow}>
                <Pressable onPress={handleOpenTerms} hitSlop={8} accessibilityRole="link">
                  <Text style={styles.legalLink}>{t('paywall.termsOfUse')}</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={handleOpenPrivacy} hitSlop={8} accessibilityRole="link">
                  <Text style={styles.legalLink}>{t('paywall.privacyPolicy')}</Text>
                </Pressable>
              </View>
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
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-end',
    },
    sheetWrapper: { width: '100%' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
      borderTopWidth: 1.5,
      borderColor: c.glassBorderStrong,
    },

    // ① Sosyal kanıt
    socialRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    socialStars: { fontSize: 11 },
    socialText: { ...textStyles.body, color: c.textMed, fontSize: 12 },

    // ② Momentum rozeti
    badge: {
      alignSelf: 'center',
      backgroundColor: c.neonBg,
      borderWidth: 1, borderColor: c.neon,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.base, paddingVertical: 4,
    },
    badgeText: { ...textStyles.bodyBold, color: c.neon, fontSize: 12 },

    // ③ Başlık
    title: {
      ...textStyles.display,
      color: c.textHigh, textAlign: 'center', fontSize: 26,
    },
    subtitleRow: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', alignItems: 'baseline',
    },
    subtitle: { ...textStyles.body, color: c.textMed, fontSize: 14 },
    subtitleAccent: { ...textStyles.bodyBold, color: c.purple, fontSize: 14 },

    // ④ Fayda listesi
    featureList: {
      gap: spacing.sm,
      backgroundColor: c.glassBg,
      borderRadius: radius.md,
      padding: spacing.base,
      borderWidth: 1, borderColor: c.glassBorder,
      marginTop: spacing.xs,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...textStyles.body, color: c.textHigh, fontSize: 14, flex: 1 },

    // ⑤ Güven sinyalleri
    trustRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: spacing.xs, flexWrap: 'wrap',
    },
    trustItem: { ...textStyles.body, color: c.textLow, fontSize: 11 },
    trustDot: { ...textStyles.body, color: c.textMuted, fontSize: 11 },

    // ⑥ CTA — pulsing purple
    ctaGlow: {
      borderRadius: radius.lg,
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 18, elevation: 10,
      marginTop: spacing.xs,
    },
    ctaButton: {
      backgroundColor: c.purple,
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 4,
      paddingHorizontal: spacing.base,
      flexDirection: 'row', alignItems: 'center',
      gap: spacing.md, overflow: 'hidden',
    },
    ctaHighlight: {
      position: 'absolute', top: 0,
      left: spacing.lg, right: spacing.lg,
      height: 1, backgroundColor: 'rgba(255,255,255,0.25)',
    },
    ctaPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    ctaTextBlock: { flex: 1 },
    ctaTitle: { ...textStyles.button, color: c.white, fontSize: 16 },
    ctaSub: { ...textStyles.body, color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 },

    // ⑦ Dismiss — kasıtlı küçük
    dismissBtn: { alignItems: 'center', paddingVertical: spacing.sm },
    dismissText: { ...textStyles.body, color: c.textLow, fontSize: 12 },

    // ⑧ Legal — Apple 3.1.2(c) zorunlu blok
    legalBlock: {
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.glassBorder,
      gap: 6,
    },
    legalNotice: {
      ...textStyles.body,
      color: c.textMuted,
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
    legalLinksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    legalLink: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 11,
      textDecorationLine: 'underline',
    },
    legalDot: { ...textStyles.body, color: c.textMuted, fontSize: 11 },
  });
}
