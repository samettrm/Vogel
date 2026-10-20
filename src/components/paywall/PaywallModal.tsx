import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
import { openManageSubscriptions } from '../../utils/manageSubscriptions';
import { openExternalUrl } from '../../utils/openExternalUrl';
import {
  fetchPremiumPackages,
  purchasePlan,
  isPurchasesConfigured,
  restorePurchases,
  type PremiumPackage,
} from '../../services/purchases';
import { ENTITLEMENT_PREMIUM } from '../../config/revenuecat';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { trackFunnel } from '../../services/funnel';

// ════════════════════════════════════════════════════════════════
// PAYWALL MODAL — BUSATER paywall standardı (değer anı teklifi)
//
// Dürüst ama satan: görünür 44pt kapat, faturalanan tutar birincil,
// fiyat mağazadan, Geri Yükle + EULA + Gizlilik ölçülü görünür.
// Uydurma sosyal kanıt / sahte indirim / gömülü fiyat YOK.
// ════════════════════════════════════════════════════════════════

// Titreşim hatası kullanıcıyı etkilemez; yine de sessiz yutulmaz.
const onHapticError = (e: unknown) => { if (__DEV__) console.warn('[paywall] haptics', e); };

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
}

// Fayda listesi — gerçek premium özelliklerine birebir bağlı (ANTI-SİSTEM 0.4k).
// En güçlü satış sebebi (sınav hazırlığı) EN ÜSTTE.
const FEATURES = [
  { text: '🎓  Goethe & telc sınav hazırlığı — tüm modüller' },
  { text: '♾️  Sınırsız can — hiç durmadan öğren' },
  { text: '📚  A1’den C1’e tüm dersler ve alıştırmalar' },
  { text: '🚫  Reklamsız, kesintisiz öğrenme' },
  { text: '👨‍👩‍👧  Aile paylaşımı (6 üyeye kadar)' },
] as const;

export function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const c = useThemeColors();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const makePremium = useUserStore((s) => s.makePremium);

  const [packages, setPackages] = useState<PremiumPackage[] | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Yıllık plan RC paketi + canlı fiyat (hardcoded fiyat YOK — App Store 3.1.2).
  const yearly = useMemo(
    () => packages?.find((p) => p.id === 'yearly') ?? null,
    [packages],
  );

  // Canlı fiyattan "aylık ~₺X" türet — priceString bayatlamaz, mağazayla eşleşir.
  const priceText = useMemo(() => {
    const pkg = yearly?.rcPackage?.product;
    if (!pkg) return null;
    const total = pkg.priceString; // örn "₺999,99"
    const num = typeof pkg.price === 'number' ? pkg.price : NaN;
    if (!Number.isFinite(num) || num <= 0) {
      return { total, perMonth: null as string | null };
    }
    const perMonthNum = num / 12;
    // Para birimi sembolünü priceString’ten al (rakam olmayan baş kısım).
    const symbolMatch = total.match(/^[^\d.,\s]+/);
    const symbol = symbolMatch ? symbolMatch[0] : '';
    const perMonth = `${symbol}${perMonthNum.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
    return { total, perMonth };
  }, [yearly]);

  // Paywall görünür olunca paketleri çek + funnel event.
  useEffect(() => {
    if (!visible) return;
    if (reloadKey === 0) trackFunnel('paywall.viewed');
    if (!isPurchasesConfigured()) return;
    let alive = true;
    setPriceError(false);
    fetchPremiumPackages().then(
      (pkgs) => { if (alive) { setPackages(pkgs); setPriceError(!pkgs); } },
      () => { if (alive) setPriceError(true); },
    );
    return () => { alive = false; };
  }, [visible, reloadKey]);

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

  // PRIMARY CTA — tek dokunuşta yıllık aboneliği başlat (en az sürtünme).
  // RC yapılandırılmamışsa / paket yoksa Shop'a düş (mağaza akışı orada).
  const handleCta = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(onHapticError);
    trackFunnel('paywall.plan_selected', { plan: 'yearly' });

    // Login zorunlu — premium HER ZAMAN hesaba bağlı olmalı (cihaz değişimi/restore).
    if (!user) {
      onDismiss();
      router.push('/login');
      return;
    }

    // Doğrudan satın alma mümkün değilse tüm planların olduğu Shop'a yönlendir.
    if (!isPurchasesConfigured() || !yearly?.rcPackage) {
      onDismiss();
      router.push('/(tabs)/shop');
      return;
    }

    if (purchasing) return;
    setPurchasing(true);
    try {
      const result = await purchasePlan(yearly.rcPackage);
      if (result.ok) {
        makePremium('yearly');
        trackFunnel('purchase.completed', { plan: 'yearly', source: 'paywall' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(onHapticError);
        onDismiss();
      } else if (!result.cancelled && result.message) {
        Alert.alert(t('shop.purchaseFailed'), result.message);
      }
    } finally {
      setPurchasing(false);
    }
  };

  // SECONDARY — tüm planları (aylık / aile) gör.
  const handleSeeAllPlans = () => {
    Haptics.selectionAsync().catch(onHapticError);
    onDismiss();
    router.push('/(tabs)/shop');
  };

  const handleDismiss = () => {
    Haptics.selectionAsync().catch(onHapticError);
    onDismiss();
  };

  // Geri Yükle — Apple 3.1.1: paywall'da gerçekten çalışan restore.
  const handleRestore = async () => {
    if (restoring) return;
    if (!isPurchasesConfigured()) {
      Alert.alert(t('shop.restoreNone'));
      return;
    }
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.ok) {
        if (result.customerInfo.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined) {
          makePremium();
          Alert.alert(t('shop.restoreSuccess'));
          onDismiss();
        } else {
          Alert.alert(t('shop.restoreNone'));
        }
      } else if (!result.cancelled) {
        Alert.alert(t('shop.restoreFailed'));
      }
    } finally {
      setRestoring(false);
    }
  };

  // Apple Guideline 3.1.2(c) — Privacy Policy + Terms of Use linkleri
  const handleOpenPrivacy = () => {
    Haptics.selectionAsync().catch(onHapticError);
    openExternalUrl(PRIVACY_POLICY_URL, t('paywall.privacyPolicy'));
  };

  const handleOpenTerms = () => {
    Haptics.selectionAsync().catch(onHapticError);
    openExternalUrl(TERMS_OF_USE_URL, t('paywall.termsOfUse'));
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

            {/* KAPAT — ilk kareden görünür, 44pt dokunma alanı */}
            <Pressable
              onPress={handleDismiss}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('paywall.close')}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={c.textMed} />
            </Pressable>

            {/* ① DEĞER İMZASI — kanıtlanamayan sayı/rating YOK (ANTI-SİSTEM).
                Gerçek ürün vaadine bağlı dürüst tek satır. */}
            <Animated.View entering={FadeIn.delay(60).duration(250)} style={styles.socialRow}>
              <Text style={styles.socialText}>🎯  Goethe & telc yolunda ciddi öğrenenler için</Text>
            </Animated.View>

            {/* ② MOMENTUM ROZETİ — "3. ders" başarı anı */}
            <Animated.View entering={FadeIn.delay(120).duration(300)} style={styles.badge}>
              <Text style={styles.badgeText}>{t('paywall.badge')}</Text>
            </Animated.View>

            {/* ③ BAŞLIK — kayıp değil, momentum dili */}
            <Animated.Text entering={FadeIn.delay(180).duration(300)} style={styles.title}>
              Gerçek öğrenme başlıyor
            </Animated.Text>
            <Animated.View entering={FadeIn.delay(240).duration(300)} style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Sınırsız can, tüm dersler ve sınav hazırlığı. </Text>
              {priceText ? (
                <Text style={styles.subtitleAccent}>
                  {priceText.total} / yıl{priceText.perMonth ? ` (ayda ~${priceText.perMonth})` : ''}
                </Text>
              ) : priceError ? (
                <Pressable onPress={() => setReloadKey((k) => k + 1)} hitSlop={12} accessibilityRole="button">
                  <Text style={styles.subtitleAccent}>
                    {t('paywall.priceUnavailable')} · {t('paywall.retry')}
                  </Text>
                </Pressable>
              ) : null}
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
                disabled={purchasing}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              >
                <View style={styles.ctaHighlight} pointerEvents="none" />
                {purchasing ? (
                  <ActivityIndicator color={c.white} />
                ) : (
                  <SpinningDiamondGem size={20} />
                )}
                <View style={styles.ctaTextBlock}>
                  <Text style={styles.ctaTitle}>
                    {yearly ? 'Vogel Plus’ı başlat' : t('paywall.cta')}
                  </Text>
                  <Text style={styles.ctaSub}>
                    {priceText?.total
                      ? `${priceText.total} / yıl · İptal: her zaman`
                      : 'İptal: her zaman'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.purpleLight} />
              </Pressable>
            </Animated.View>

            {/* ⑦ SECONDARY — tüm planlar + kapat (okunur, 44pt) */}
            <Animated.View entering={FadeIn.delay(500).duration(300)}>
              <Pressable onPress={handleSeeAllPlans} style={styles.dismissBtn}>
                <Text style={styles.seeAllText}>Aylık ve aile planlarını gör</Text>
              </Pressable>
              <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>{t('paywall.dismiss')}</Text>
              </Pressable>
            </Animated.View>

            {/* ⑧ LEGAL — Apple Guideline 3.1.2(c) gereği abonelik akışında zorunlu.
                Otomatik yenileme açıklaması + Privacy/EULA linkleri. */}
            <Animated.View entering={FadeIn.delay(560).duration(300)} style={styles.legalBlock}>
              <Text style={styles.legalNotice}>
                {Platform.OS === 'android' ? t('paywall.legalNoticeAndroid') : t('paywall.legalNotice')}
              </Text>
              <View style={styles.legalLinksRow}>
                <Pressable onPress={handleOpenTerms} hitSlop={12} accessibilityRole="link">
                  <Text style={styles.legalLink}>{t('paywall.termsOfUse')}</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={handleOpenPrivacy} hitSlop={12} accessibilityRole="link">
                  <Text style={styles.legalLink}>{t('paywall.privacyPolicy')}</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={openManageSubscriptions} hitSlop={12} accessibilityRole="link">
                  <Text style={styles.legalLink}>{t('paywall.manageSubscription')}</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={handleRestore} disabled={restoring} hitSlop={12} accessibilityRole="button">
                  <Text style={styles.legalLink}>{restoring ? '…' : t('paywall.restore')}</Text>
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

    // ⑦ Dismiss — okunur kontrast, 44pt dokunma alanı
    dismissBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    dismissText: { ...textStyles.body, color: c.textMed, fontSize: 14 },
    closeBtn: {
      position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 2,
      width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    },
    seeAllText: { ...textStyles.bodyBold, color: c.purpleLight, fontSize: 13 },

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
      color: c.textLow,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
    legalLinksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    legalLink: {
      ...textStyles.body,
      color: c.textHigh,
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    legalDot: { ...textStyles.body, color: c.textLow, fontSize: 13 },
  });
}
