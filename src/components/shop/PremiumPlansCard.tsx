import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { PremiumPackage, PlanId } from '../../services/purchases';

// ════════════════════════════════════════════════════════════════
// PREMIUM PLANS CARD — Psikolojik fiyat optimizasyonu
//
// Tetikleyiciler:
//   1. Fiyat çapalama    → Yıllık "Günde ₺1.4" (aylık ₺3.3 ile kıyasla)
//   2. Kayıp framing     → "%58 tasarruf" — aylık planın ucuzu
//   3. Çapa fiyat        → "₺99/ay" üstü çizili referans yıllık kartta
//   4. Seçim mimarisi    → Yıllık kahraman kart (büyük, mor), diğerleri küçük
//   5. Sosyal kanıt      → "EN ÇOK TERCİH EDİLEN" rozeti yıllık üzerinde
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
  const styles = useMemo(() => makeStyles(c), [c]);

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

  const yearlyPlan = STATIC_PLANS.find((p) => p.id === 'yearly')!;
  const otherPlans = STATIC_PLANS.filter((p) => p.id !== 'yearly');

  const yearlyRcPkg = packages?.find((p) => p.id === 'yearly');
  const yearlyPrice = yearlyRcPkg ? yearlyRcPkg.priceString : yearlyPlan.fallbackPrice;

  return (
    <View style={styles.container}>

      {/* BANNER — Vogel Plus başlık kartı */}
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

          {/* YILLIK KAHRAMAN KART — tam genişlik, büyük, seçim mimarisinin odağı */}
          <YearlyHeroCard
            c={c}
            t={t}
            plan={yearlyPlan}
            displayPrice={yearlyPrice}
            onPress={() => handlePress(yearlyPlan)}
          />

          {/* AYLLIK + ÖMÜR BOYU — ikincil seçenekler, yan yana küçük */}
          <View style={styles.secondaryRow}>
            {otherPlans.map((plan) => {
              const rcPkg = packages?.find((p) => p.id === plan.id);
              const displayPrice = rcPkg ? rcPkg.priceString : plan.fallbackPrice;
              return (
                <SecondaryPlanCard
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

        </View>
      ) : null}
    </View>
  );
}

// ─── YILLIK KAHRAMAN KART ────────────────────────────────────────────────────
// Büyük, cazip, fiyat çapalama + tasarruf rozeti + günlük fiyat framing
function YearlyHeroCard({
  c, t, plan, displayPrice, onPress,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  plan: StaticPlan;
  displayPrice: string;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.heroCard, pressed && styles.heroPressed]}
    >
      <View style={styles.heroHighlight} pointerEvents="none" />

      {/* "EN ÇOK TERCİH EDİLEN" rozeti */}
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>⭐  EN ÇOK TERCİH EDİLEN</Text>
      </View>

      <View style={styles.heroBody}>
        {/* Sol: fiyat bloğu */}
        <View style={styles.heroPriceBlock}>
          <Text style={styles.heroLabel}>{t(plan.titleKey)}</Text>

          {/* Günlük fiyat — ana odak */}
          <Text style={styles.heroPerDay}>Günde yalnızca</Text>
          <Text style={styles.heroPerDayPrice}>₺1.4</Text>

          {/* Yıllık toplam */}
          <Text style={styles.heroTotal}>{displayPrice}/yıl</Text>

          {/* Çapa fiyat — üstü çizili aylık referans */}
          <View style={styles.heroAnchorRow}>
            <Text style={styles.heroAnchorStrike}>₺99/ay</Text>
            <Text style={styles.heroAnchorVs}> yerine</Text>
          </View>
        </View>

        {/* Sağ: tasarruf + özellikler */}
        <View style={styles.heroRight}>
          {/* Tasarruf rozeti */}
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>%58</Text>
            <Text style={styles.savingsLabel}>tasarruf</Text>
          </View>

          {/* Özellik listesi */}
          <View style={styles.heroFeatures}>
            {plan.featureKeys.map((key, i) => (
              <View key={i} style={styles.heroFeatureRow}>
                <Ionicons name="checkmark-circle" size={13} color={c.white} />
                <Text style={styles.heroFeatureText}>
                  {t(FEATURE_KEYS[key] as 'shop.unlimitedHearts')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* CTA butonu */}
      <View style={styles.heroCta}>
        <View style={styles.heroCtaHighlight} pointerEvents="none" />
        <Ionicons name="diamond" size={16} color={c.purple} />
        <Text style={styles.heroCtaText}>HEMEN BAŞLA</Text>
        <Ionicons name="chevron-forward" size={14} color={c.purple} />
      </View>
    </Pressable>
  );
}

// ─── İKİNCİL PLAN KARTI ──────────────────────────────────────────────────────
// Aylık + Ömür Boyu için küçük, referans kartlar
function SecondaryPlanCard({
  c, t, plan, displayPrice, onPress,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  plan: StaticPlan;
  displayPrice: string;
  onPress: () => void;
}) {
  const isBest = plan.badge === 'best';
  const borderColor = isBest ? c.gold : c.glassBorderStrong;
  const accentColor = isBest ? c.gold : c.textHigh;
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryCard, { borderColor },
        pressed && styles.secondaryPressed,
      ]}
    >
      <View style={styles.secondaryHighlight} pointerEvents="none" />

      {isBest ? (
        <View style={[styles.secondaryBadge, { backgroundColor: c.gold }]}>
          <Text style={[styles.secondaryBadgeText, { color: c.bg }]}>
            {t('shop.bestValue')}
          </Text>
        </View>
      ) : null}

      <Text style={styles.secondaryTitle}>{t(plan.titleKey)}</Text>
      <Text style={[styles.secondaryPrice, { color: accentColor }]}>{displayPrice}</Text>
      {plan.perMonthKey && !displayPrice.includes('/') ? (
        <Text style={styles.secondaryPeriod}>{t(plan.perMonthKey)}</Text>
      ) : null}

      <View style={styles.secondaryFeatures}>
        {plan.featureKeys.map((key, i) => (
          <View key={i} style={styles.secondaryFeatureRow}>
            <Ionicons name="checkmark" size={10} color={accentColor} />
            <Text style={styles.secondaryFeatureText} numberOfLines={1}>
              {t(FEATURE_KEYS[key] as 'shop.unlimitedHearts')}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.secondaryCta, { backgroundColor: isBest ? c.gold : c.glassBg, borderColor }]}>
        <Text style={[styles.secondaryCtaText, { color: isBest ? c.bg : c.textMed }]}>
          {t('shop.select')}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { gap: spacing.sm },

    // ── Banner ──
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

    // ── Plan container ──
    plans: { gap: spacing.sm },

    // ── Yıllık kahraman kart ──
    heroCard: {
      width: '100%',
      backgroundColor: c.purple,
      borderRadius: radius.lg,
      paddingTop: spacing.lg + 4,
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.sm,
      overflow: 'hidden',
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 14, elevation: 8,
    },
    heroHighlight: {
      position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg,
      height: 1, backgroundColor: 'rgba(255,255,255,0.2)',
    },
    heroPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },

    heroBadge: {
      position: 'absolute', top: -1, alignSelf: 'center',
      backgroundColor: c.gold,
      paddingHorizontal: spacing.base, paddingVertical: 4,
      borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md,
    },
    heroBadgeText: { ...textStyles.label, color: c.bg, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    heroBody: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },

    heroPriceBlock: { flex: 1, gap: 2 },
    heroLabel: { ...textStyles.label, color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    heroPerDay: { ...textStyles.body, color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
    heroPerDayPrice: { ...textStyles.display, color: c.white, fontSize: 32, lineHeight: 36 },
    heroTotal: { ...textStyles.body, color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
    heroAnchorRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
    heroAnchorStrike: {
      ...textStyles.body, color: 'rgba(255,255,255,0.45)', fontSize: 12,
      textDecorationLine: 'line-through',
    },
    heroAnchorVs: { ...textStyles.body, color: 'rgba(255,255,255,0.45)', fontSize: 12 },

    heroRight: { alignItems: 'flex-end', gap: spacing.sm },
    savingsBadge: {
      backgroundColor: c.gold,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
      alignItems: 'center', minWidth: 52,
    },
    savingsText: { ...textStyles.display, color: c.bg, fontSize: 18, lineHeight: 22 },
    savingsLabel: { ...textStyles.label, color: c.bg, fontSize: 9 },

    heroFeatures: { gap: 4, alignItems: 'flex-end' },
    heroFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    heroFeatureText: { ...textStyles.body, color: 'rgba(255,255,255,0.85)', fontSize: 11 },

    heroCta: {
      marginTop: spacing.sm,
      backgroundColor: c.white,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: spacing.xs,
      overflow: 'hidden',
    },
    heroCtaHighlight: {
      position: 'absolute', top: 0, left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: 'rgba(255,255,255,0.6)',
    },
    heroCtaText: { ...textStyles.button, color: c.purple, fontSize: 13, letterSpacing: 1.2 },

    // ── İkincil plan satırı ──
    secondaryRow: { flexDirection: 'row', gap: spacing.sm },
    secondaryCard: {
      flex: 1, backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg, borderWidth: 1.5,
      paddingTop: spacing.lg + 4, paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm, overflow: 'visible', minHeight: 180,
    },
    secondaryHighlight: {
      position: 'absolute', top: 0,
      left: spacing.xs, right: spacing.xs,
      height: 1, backgroundColor: c.glassHighlight,
    },
    secondaryPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    secondaryBadge: {
      position: 'absolute', top: -8, alignSelf: 'center',
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: radius.pill, zIndex: 100, elevation: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4, shadowRadius: 4,
    },
    secondaryBadgeText: { ...textStyles.label, fontSize: 9, lineHeight: 11, fontWeight: '900' },
    secondaryTitle: { ...textStyles.label, color: c.textLow, textAlign: 'center', marginTop: 2 },
    secondaryPrice: { ...textStyles.display, fontSize: 20, lineHeight: 24, textAlign: 'center', marginTop: 4 },
    secondaryPeriod: { ...textStyles.body, color: c.textMuted, fontSize: 10, textAlign: 'center' },
    secondaryFeatures: { flex: 1, gap: 4, marginTop: spacing.sm, marginBottom: spacing.sm },
    secondaryFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    secondaryFeatureText: { ...textStyles.body, color: c.textMed, fontSize: 10, flex: 1 },
    secondaryCta: {
      width: '100%', minHeight: 32,
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    secondaryCtaText: { ...textStyles.button, fontSize: 11, letterSpacing: 1 },
  });
}
