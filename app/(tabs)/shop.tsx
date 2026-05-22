import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { HeartPackageCard } from '../../src/components/shop/HeartPackageCard';
import { PremiumPlansCard } from '../../src/components/shop/PremiumPlansCard';
import { XPPackageCard } from '../../src/components/shop/XPPackageCard';
import { useUserStore } from '../../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';
import { PRODUCT_IDS } from '../../src/config/revenuecat';
import {
  isPurchasesConfigured,
  fetchPremiumPackages,
  purchasePlan,
  purchaseProduct,
  restorePurchases as rcRestorePurchases,
  type PremiumPackage,
  type PlanId,
} from '../../src/services/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

// ════════════════════════════════════════════════════════════════
// SHOP SCREEN
//
// RC yapılandırılmışsa → gerçek IAP (App Store)
// RC yapılandırılmamışsa → mock mod (geliştirme / Expo Go)
// ════════════════════════════════════════════════════════════════

export default function ShopScreen() {
  const c = useThemeColors();
  const t = useT();
  const xp = useUserStore((s) => s.xp);
  const hearts = useUserStore((s) => s.hearts);
  const maxHearts = useUserStore((s) => s.maxHearts);
  const buyKupa = useUserStore((s) => s.buyKupaPackage);
  const refill = useUserStore((s) => s.refillHearts);
  const addHearts = useUserStore((s) => s.addHearts);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const makePremium = useUserStore((s) => (s as { makePremium?: () => void }).makePremium);

  const heartsFull = hearts >= maxHearts;
  const heartVariant: 'refill' | 'disabled' | 'premium' = isPremium
    ? 'premium'
    : heartsFull ? 'disabled' : 'refill';

  // RC premium paketleri (gerçek fiyatlar)
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[] | null>(null);

  useEffect(() => {
    if (!isPurchasesConfigured()) return;
    fetchPremiumPackages().then(setPremiumPackages).catch(() => {});
  }, []);

  // ────────────────────────────────────────────────────────────────
  // PREMIUM PLAN SEÇİMİ
  // ────────────────────────────────────────────────────────────────
  const handleSelectPlan = useCallback(async (
    planId: PlanId,
    rcPackage?: PurchasesPackage,
  ) => {
    if (!isPurchasesConfigured() || !rcPackage) {
      // Mock mod
      if (typeof makePremium === 'function') makePremium();
      return;
    }
    const result = await purchasePlan(rcPackage);
    if (result.ok) {
      if (typeof makePremium === 'function') makePremium();
    } else if (!result.cancelled && result.message) {
      Alert.alert(t('shop.purchaseFailed'), result.message);
    }
  }, [makePremium, t]);

  // ────────────────────────────────────────────────────────────────
  // XP PAKETİ SATINALMA
  // ────────────────────────────────────────────────────────────────
  const handleBuyXp = useCallback(async (productId: string, amount: number) => {
    if (!isPurchasesConfigured()) {
      // Mock mod
      buyKupa(amount);
      return;
    }
    const result = await purchaseProduct(productId);
    if (result.ok) {
      buyKupa(amount);
    } else if (!result.cancelled && result.message) {
      Alert.alert(t('shop.purchaseFailed'), result.message);
    }
  }, [buyKupa, t]);

  // ────────────────────────────────────────────────────────────────
  // CAN DOLDURMA (XP ile — ücretsiz)
  // ────────────────────────────────────────────────────────────────
  const handleRefillHearts = useCallback(() => {
    refill();
    Alert.alert(t('common.ok'), '✓');
  }, [refill, t]);

  // ────────────────────────────────────────────────────────────────
  // EKSTRA CAN SATINALMA (₺19.99 → 5 can)
  // ────────────────────────────────────────────────────────────────
  const handleBuyExtraHearts = useCallback(async () => {
    if (!isPurchasesConfigured()) {
      // Mock mod
      Alert.alert(t('shop.mockNote'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            addHearts(5);
            Alert.alert(t('common.ok'), '✓');
          },
        },
      ]);
      return;
    }
    const result = await purchaseProduct(PRODUCT_IDS.hearts5);
    if (result.ok) {
      addHearts(5);
      Alert.alert(t('common.ok'), '✓');
    } else if (!result.cancelled && result.message) {
      Alert.alert(t('shop.purchaseFailed'), result.message);
    }
  }, [addHearts, t]);

  // ────────────────────────────────────────────────────────────────
  // SATIN ALMALARI GERİ YÜKLE
  // ────────────────────────────────────────────────────────────────
  const handleRestore = useCallback(async () => {
    if (!isPurchasesConfigured()) {
      Alert.alert(t('shop.restoreNone'));
      return;
    }
    const result = await rcRestorePurchases();
    if (result.ok) {
      // RC entitlement'ı kontrol et — premium geri yüklenmiş mi?
      const hasPremium =
        result.customerInfo.entitlements.active['premium'] !== undefined;
      if (hasPremium) {
        if (typeof makePremium === 'function') makePremium();
        Alert.alert(t('shop.restoreSuccess'));
      } else {
        Alert.alert(t('shop.restoreNone'));
      }
    } else if (!result.cancelled) {
      Alert.alert(t('shop.restoreFailed'));
    }
  }, [makePremium, t]);

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('shop.title')}</Text>
            <Text style={styles.subtitle}>
              {isPremium ? t('shop.subtitlePremium') : t('shop.subtitle')}
            </Text>
          </View>
          <View style={styles.walletBadge}>
            <Ionicons name="flash" size={16} color={c.gold} />
            <Text style={styles.walletText}>{xp}</Text>
          </View>
        </View>

        {/* VOGEL PLUS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
              <Ionicons name="diamond" size={14} color={c.purpleLight} />
            </View>
            <Text style={styles.sectionTitle}>{t('shop.vogelPlus')}</Text>
          </View>
          <PremiumPlansCard
            isPremium={isPremium}
            packages={premiumPackages}
            onSelectPlan={handleSelectPlan}
          />
        </View>

        {/* XP PAKETLERİ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: c.goldBg, borderColor: c.gold }]}>
              <Ionicons name="flash" size={14} color={c.gold} />
            </View>
            <Text style={styles.sectionTitle}>{t('shop.xpPackages')}</Text>
          </View>

          <View style={styles.xpRow}>
            <XPPackageCard
              title={t('shop.xpSmall')} amount={100} priceLabel="₺19.99"
              onPurchase={() => handleBuyXp(PRODUCT_IDS.xp100, 100)}
            />
            <XPPackageCard
              title={t('shop.xpMedium')} amount={500} priceLabel="₺49.99" badge="popular"
              onPurchase={() => handleBuyXp(PRODUCT_IDS.xp500, 500)}
            />
            <XPPackageCard
              title={t('shop.xpLarge')} amount={1500} priceLabel="₺99.99" badge="best"
              onPurchase={() => handleBuyXp(PRODUCT_IDS.xp1500, 1500)}
            />
          </View>
        </View>

        {/* CAN PAKETLERİ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: c.redBg, borderColor: c.red }]}>
              <Ionicons name="heart" size={14} color={c.red} />
            </View>
            <Text style={styles.sectionTitle}>{t('shop.heartPackages')}</Text>
          </View>

          <HeartPackageCard
            title={t('shop.refillHearts')}
            description={
              isPremium
                ? t('shop.refillHeartsPremium')
                : heartsFull
                  ? t('shop.refillHeartsFull', { n: hearts, max: maxHearts })
                  : t('shop.refillHeartsCurrent', { n: hearts, max: maxHearts })
            }
            ctaLabel={isPremium ? t('shop.premium') : heartsFull ? t('shop.full') : '450 XP'}
            variant={heartVariant}
            onPurchase={handleRefillHearts}
          />

          <HeartPackageCard
            title={t('shop.extraHearts')}
            description={t('shop.extraHeartsDesc')}
            ctaLabel="₺19.99"
            onPurchase={handleBuyExtraHearts}
          />
        </View>

        {/* SATIN ALMALARI GERİ YÜKLE */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreRow} activeOpacity={0.7}>
          <Ionicons name="refresh" size={14} color={c.textLow} />
          <Text style={styles.restoreText}>{t('shop.restorePurchases')}</Text>
        </TouchableOpacity>

        {/* NOT (mock modda gösterilir, RC yapılandırılınca kaybolur) */}
        {!isPurchasesConfigured() ? (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={16} color={c.textLow} />
            <Text style={styles.noteText}>{t('shop.mockNote')}</Text>
          </View>
        ) : null}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    scrollContent: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.sm,
      gap: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    title: { ...textStyles.display, color: c.textHigh },
    subtitle: { ...textStyles.body, color: c.textLow, fontSize: 13, marginTop: 2 },
    walletBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: spacing.sm, paddingVertical: 6,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.gold,
      borderRadius: radius.pill,
    },
    walletText: { ...textStyles.bodyBold, color: c.gold, fontSize: 14 },
    section: { gap: spacing.sm },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
    sectionIcon: {
      width: 22, height: 22, borderRadius: 6,
      borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 16 },
    xpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    restoreRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: spacing.sm,
    },
    restoreText: { ...textStyles.body, color: c.textLow, fontSize: 12 },
    noteCard: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.divider,
      borderRadius: radius.md,
    },
    noteText: { ...textStyles.body, color: c.textLow, fontSize: 12, flex: 1 },
  });
}
