import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { PremiumPackage, PlanId } from '../../services/purchases';

// ════════════════════════════════════════════════════════════════
// PREMIUM PLANS CARD
//
// - packages: RevenueCat'tan gelen gerçek paketler (fiyat dahil).
//   null ise sabit fiyatlar gösterilir (RC yapılandırılmamış / yükleniyor).
// - onSelectPlan: ebeveyn (shop.tsx) satın alma işlemini yürütür.
// ════════════════════════════════════════════════════════════════

interface PremiumPlansCardProps {
  isPremium: boolean;
  packages: PremiumPackage[] | null;
  onSelectPlan: (planId: PlanId, rcPackage?: PremiumPackage['rcPackage']) => void;
}

type StaticPlan = {
  id: PlanId;
  titleKey: 'shop.monthly' | 'shop.yearly' | 'shop.lifetime';
  fallbackPrice: string;
  perMonthKey?: 'shop.perMonth' | 'shop.perYear';
  badge?: 'popular' | 'best';
  featureKeys: (keyof typeof FEATURE_KEYS)[];
};

const FEATURE_KEYS = {
  unlimitedHearts: 'shop.unlimitedHearts',
  noAds: 'shop.noAds',
  specialLessons: 'shop.specialLessons',
  allFeatures: 'shop.allFeatures',
  oneTime: 'shop.oneTime',
} as const;

const STATIC_PLANS: StaticPlan[] = [
  {
    id: 'monthly',
    titleKey: 'shop.monthly',
    fallbackPrice: '₺99',
    perMonthKey: 'shop.perMonth',
    featureKeys: ['unlimitedHearts', 'noAds'],
  },
  {
    id: 'yearly',
    titleKey: 'shop.yearly',
    fallbackPrice: '₺499',
    perMonthKey: 'shop.perYear',
    badge: 'popular',
    featureKeys: ['unlimitedHearts', 'noAds', 'specialLessons'],
  },
  {
    id: 'lifetime',
    titleKey: 'shop.lifetime',
    fallbackPrice: '₺1499',
    badge: 'best',
    featureKeys: ['allFeatures', 'oneTime'],
  },
];

export function PremiumPlansCard({ isPremium, packages, onSelectPlan }: PremiumPlansCardProps) {
  const c = useThemeColors();
  const t = useT();

  const handlePress = (plan: StaticPlan) => {
    if (isPremium) {
      Alert.alert(t('shop.vogelPlus'), t('shop.vogelPlusActive'));
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    const rcPkg = packages?.find((p) => p.id === plan.id);
    const priceDisplay = rcPkg
      ? rcPkg.priceString
      : `${plan.fallbackPrice}${plan.perMonthKey ? t(plan.perMonthKey) : ''}`;

    Alert.alert(
      `${t('shop.vogelPlus')} — ${t(plan.titleKey)}`,
      priceDisplay,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onSelectPlan(plan.id, rcPkg?.rcPackage);
          },
        },
      ],
    );
  };

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={[styles.banner, isPremium && styles.bannerActive]}>
        <View style={styles.topHighlight} pointerEvents="none" />
        <View style={styles.bannerLeft}>
          <View style={[styles.crownIcon, isPremium && styles.crownActive]}>
            <Ionicons name={isPremium ? 'diamond' : 'star'} size={24} color={c.bg} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{t('shop.vogelPlus')}</Text>
            <Text style={styles.bannerSubtitle}>
              {isPremium ? t('shop.vogelPlusActive') : t('shop.vogelPlusDesc')}
            </Text>
          </View>
        </View>
        {isPremium ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{t('shop.active')}</Text>
          </View>
        ) : null}
      </View>

      {!isPremium ? (
        <View style={styles.plans}>
          {STATIC_PLANS.map((plan) => {
            const rcPkg = packages?.find((p) => p.id === plan.id);
            const displayPrice = rcPkg ? rcPkg.priceString : plan.fallbackPrice;
            return (
              <PlanCard
                key={plan.id}
                c={c}
                t={t}
                plan={plan}
                displayPrice={displayPrice}
                onPress={() => handlePress(plan)}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function PlanCard({
  c, t, plan, displayPrice, onPress,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  plan: StaticPlan;
  displayPrice: string;
  onPress: () => void;
}) {
  const isPopular = plan.badge === 'popular';
  const isBest = plan.badge === 'best';

  const borderColor = isPopular ? c.purple : isBest ? c.gold : c.glassBorderStrong;
  const accentColor = isPopular ? c.purpleLight : isBest ? c.gold : c.textHigh;
  const ctaColor = isPopular ? c.purple : isBest ? c.gold : c.neon;
  const ctaTextColor = isPopular ? c.white : c.bg;

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard, { borderColor },
        (isPopular || isBest) && styles.planCardHighlighted,
        pressed && styles.planPressed,
      ]}
    >
      <View style={styles.planTopHighlight} pointerEvents="none" />
      {plan.badge ? (
        <View style={[styles.badge, { backgroundColor: isPopular ? c.purple : c.gold }]}>
          <Text style={[styles.badgeText, { color: isPopular ? c.white : c.bg }]}>
            {isPopular ? t('shop.popular') : t('shop.bestValue')}
          </Text>
        </View>
      ) : null}

      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{t(plan.titleKey)}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.planPrice, { color: accentColor }]}>{displayPrice}</Text>
          {plan.perMonthKey && !displayPrice.includes('/') ? (
            <Text style={styles.planPerMonth}>{t(plan.perMonthKey)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.featuresList}>
        {plan.featureKeys.map((key, idx) => (
          <View key={idx} style={styles.feature}>
            <Ionicons name="checkmark" size={12} color={accentColor} />
            <Text style={styles.featureText} numberOfLines={1}>
              {t(FEATURE_KEYS[key] as 'shop.unlimitedHearts')}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.cta, { backgroundColor: ctaColor }]}>
        <Text style={[styles.ctaText, { color: ctaTextColor }]}>{t('shop.select')}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    banner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.purpleBg, borderWidth: 1.5, borderColor: c.purple,
      borderRadius: radius.lg, padding: spacing.base, overflow: 'hidden',
      shadowColor: c.purple, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
    },
    bannerActive: { backgroundColor: c.goldBg, borderColor: c.gold, shadowColor: c.gold },
    topHighlight: {
      position: 'absolute', top: 0, left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    crownIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: c.gold,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.gold, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
    },
    crownActive: { backgroundColor: c.gold },
    bannerText: { flex: 1, gap: 2 },
    bannerTitle: { ...textStyles.subheading, color: c.purpleLight },
    bannerSubtitle: { ...textStyles.body, color: c.textMed, fontSize: 12 },
    activeBadge: {
      paddingHorizontal: spacing.sm, paddingVertical: 4,
      borderRadius: radius.pill, backgroundColor: c.gold,
    },
    activeBadgeText: { ...textStyles.label, color: c.bg, fontSize: 10 },
    plans: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
    planCard: {
      flex: 1, backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg, borderWidth: 1.5,
      paddingTop: spacing.lg, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm,
      overflow: 'visible', minHeight: 200,
    },
    planCardHighlighted: { backgroundColor: c.glassBg },
    planTopHighlight: {
      position: 'absolute', top: 0,
      left: spacing.xs, right: spacing.xs,
      height: 1, backgroundColor: c.glassHighlight,
    },
    planPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    badge: {
      position: 'absolute', top: -8, alignSelf: 'center',
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: radius.pill, zIndex: 100, elevation: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4, shadowRadius: 4,
    },
    badgeText: { ...textStyles.label, fontSize: 9, lineHeight: 11, fontWeight: '900' },
    planHeader: { alignItems: 'center', gap: 2 },
    planTitle: { ...textStyles.label, color: c.textLow, marginTop: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
    planPrice: { ...textStyles.display, fontSize: 20, lineHeight: 24 },
    planPerMonth: { ...textStyles.body, color: c.textMuted, fontSize: 10 },
    featuresList: {
      flex: 1, width: '100%', gap: 4,
      marginTop: spacing.sm, marginBottom: spacing.sm,
      justifyContent: 'flex-start',
    },
    feature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    featureText: { ...textStyles.body, color: c.textMed, fontSize: 10, flex: 1 },
    cta: {
      width: '100%', minHeight: 32,
      borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    },
    ctaText: { ...textStyles.button, fontSize: 11, letterSpacing: 1 },
  });
}
