import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { PremiumPlansCard } from '../../src/components/shop/PremiumPlansCard';
import { useUserStore } from '../../src/store/useUserStore';
import { useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';
import {
  isPurchasesConfigured,
  fetchPremiumPackages,
  purchasePlan,
  restorePurchases as rcRestorePurchases,
  type PremiumPackage,
  type PlanId,
} from '../../src/services/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

// ════════════════════════════════════════════════════════════════
// SHOP SCREEN — Full-Screen Paywall (Y Cosmic)
//
// XP ve can paketleri kaldırıldı — sadece premium abonelik.
// Tam ekran koyu uzay teması, plan seçimi + ücretsiz deneme CTA.
// ════════════════════════════════════════════════════════════════

// Kozmik arka plan renkleri (PremiumPlansCard ile eşleştirilmiş)
const SCREEN_BG = '#05020e';

export default function ShopScreen() {
  const c = useThemeColors();
  const t = useT();
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const makePremium = useUserStore((s) => (s as { makePremium?: (planId?: PlanId) => void }).makePremium);

  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[] | null>(null);

  useEffect(() => {
    if (!isPurchasesConfigured()) return;
    fetchPremiumPackages().then(setPremiumPackages).catch(() => {});
  }, []);

  // ─── Premium plan satın alma ─────────────────────────────────────
  const handleSelectPlan = useCallback(async (
    planId: PlanId,
    rcPackage?: PurchasesPackage,
  ) => {
    if (!isPurchasesConfigured() || !rcPackage) {
      if (typeof makePremium === 'function') makePremium(planId);
      return;
    }
    const result = await purchasePlan(rcPackage);
    if (result.ok) {
      if (typeof makePremium === 'function') makePremium(planId);
    } else if (!result.cancelled && result.message) {
      Alert.alert(t('shop.purchaseFailed'), result.message);
    }
  }, [makePremium, t]);

  // ─── Satın almaları geri yükle ───────────────────────────────────
  const handleRestore = useCallback(async () => {
    if (!isPurchasesConfigured()) {
      Alert.alert(t('shop.restoreNone'));
      return;
    }
    const result = await rcRestorePurchases();
    if (result.ok) {
      const hasPremium = result.customerInfo.entitlements.active['premium'] !== undefined;
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── TAM EKRAN PREMIUM KART ─────────────────────────────── */}
        <PremiumPlansCard
          isPremium={isPremium}
          packages={premiumPackages}
          onSelectPlan={handleSelectPlan}
        />

        {/* ── ALT ÇUBUK ─────────────────────────────────────────── */}
        <View style={styles.footer}>
          {/* Satın almaları geri yükle — yalnızca iOS */}
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              onPress={handleRestore}
              style={styles.restoreBtn}
              activeOpacity={0.6}
            >
              <Ionicons name="refresh-outline" size={12} color="rgba(255,255,255,0.25)" />
              <Text style={styles.restoreText}>Satın almaları geri yükle</Text>
            </TouchableOpacity>
          ) : null}

          {/* Yalnızca mock modda göster */}
          {!isPurchasesConfigured() ? (
            <View style={styles.mockNote}>
              <Ionicons name="flask-outline" size={12} color="rgba(168,85,247,0.5)" />
              <Text style={styles.mockText}>Geliştirici modu — gerçek ödeme yok</Text>
            </View>
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  scroll: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  content: {
    flexGrow: 1,
  },
  footer: {
    backgroundColor: SCREEN_BG,
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
    alignItems: 'center',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restoreText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  mockNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mockText: {
    fontSize: 11,
    color: 'rgba(168,85,247,0.45)',
  },
});
