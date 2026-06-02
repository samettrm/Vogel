import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { PremiumPlansCard } from '../../src/components/shop/PremiumPlansCard';
import { useUserStore } from '../../src/store/useUserStore';
import { useAuthStore } from '../../src/store/useAuthStore';
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
import { ENTITLEMENT_PREMIUM } from '../../src/config/revenuecat';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../src/config/legal';
import { openManageSubscriptions } from '../../src/utils/manageSubscriptions';
import { openExternalUrl } from '../../src/utils/openExternalUrl';
import type { PurchasesPackage } from 'react-native-purchases';

// ════════════════════════════════════════════════════════════════
// SHOP SCREEN — Full-Screen Paywall (Y Cosmic)
//
// XP ve can paketleri kaldırıldı — sadece premium abonelik.
// Tam ekran koyu uzay teması, plan seçimi + Vogel Plus CTA.
// ════════════════════════════════════════════════════════════════

// Kozmik arka plan renkleri (PremiumPlansCard ile eşleştirilmiş)
const SCREEN_BG = '#05020e';

export default function ShopScreen() {
  const c = useThemeColors();
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const makePremium = useUserStore((s) => (s as { makePremium?: (planId?: PlanId) => void }).makePremium);

  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[] | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Restore butonu pulse animasyonu (yükleme sırasında)
  const restorePulse = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isPurchasesConfigured()) return;
    fetchPremiumPackages().then(setPremiumPackages).catch(() => {});
  }, []);

  // ─── Premium plan satın alma ─────────────────────────────────────
  // 🔒 LOGIN ZORUNLU — Premium satın alma için kullanıcı login olmalı.
  // Aksi halde anonim RC user'a bağlanır, cihaz değişiminde / reinstall'da
  // satın alma kaybolur. Login olmayan kullanıcıyı /login'e yönlendir.
  const handleSelectPlan = useCallback(async (
    planId: PlanId,
    rcPackage?: PurchasesPackage,
  ) => {
    // Login kontrolü — premium HER ZAMAN hesaba bağlı olmalı
    if (!user) {
      Alert.alert(
        'Giriş gerekli',
        'Premium üyeliğin kaybolmaması için önce hesap oluşturman veya giriş yapman gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş yap', onPress: () => router.push('/login') },
        ],
      );
      return;
    }

    if (!isPurchasesConfigured() || !rcPackage) {
      if (typeof makePremium === 'function') makePremium(planId);
      return;
    }
    const result = await purchasePlan(rcPackage);
    if (result.ok) {
      if (typeof makePremium === 'function') makePremium(planId);
      // Family planı satın alındıysa Firestore'da family doc oluştur
      if (planId === 'family') {
        const { ensureFamilyOwner } = await import('../../src/services/family');
        ensureFamilyOwner().catch(() => {});
      }
    } else if (!result.cancelled && result.message) {
      Alert.alert(t('shop.purchaseFailed'), result.message);
    }
  }, [user, router, makePremium, t]);

  // ─── Satın almaları geri yükle ───────────────────────────────────
  const handleRestore = useCallback(async () => {
    if (isRestoring) return;

    if (!isPurchasesConfigured()) {
      Alert.alert(t('shop.restoreNone'));
      return;
    }

    // Yükleniyor animasyonu başlat
    setIsRestoring(true);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(restorePulse, { toValue: 0.55, duration: 600, useNativeDriver: true }),
        Animated.timing(restorePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();

    try {
      const result = await rcRestorePurchases();
      if (result.ok) {
        const hasPremium =
          result.customerInfo.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
        if (hasPremium) {
          if (typeof makePremium === 'function') makePremium();
          Alert.alert('✅  ' + t('shop.restoreSuccess'));
        } else {
          Alert.alert(t('shop.restoreNone'));
        }
      } else if (!result.cancelled) {
        Alert.alert(t('shop.restoreFailed'));
      }
    } finally {
      pulseLoop.current?.stop();
      restorePulse.setValue(1);
      setIsRestoring(false);
    }
  }, [isRestoring, makePremium, restorePulse, t]);

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
          {/* Satın almaları geri yükle — iOS + Android */}
          <TouchableOpacity
            onPress={handleRestore}
            style={styles.restoreBtn}
            activeOpacity={0.6}
            disabled={isRestoring}
          >
            <Animated.View style={{ opacity: restorePulse, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {isRestoring ? (
                <ActivityIndicator size={12} color="rgba(255,255,255,0.35)" />
              ) : (
                <Ionicons name="refresh-outline" size={12} color="rgba(255,255,255,0.25)" />
              )}
              <Text style={styles.restoreText}>{t('shop.restorePurchases')}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* ── YASAL — Apple Guideline 3.1.2(c) gereği abonelik akışında zorunlu ── */}
          <Text style={styles.legalNotice}>
            {t('shop.legalNotice')}
          </Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              onPress={() => openExternalUrl(TERMS_OF_USE_URL, t('shop.termsOfUse'))}
              hitSlop={10}
              accessibilityRole="link"
            >
              <Text style={styles.legalLink}>{t('shop.termsOfUse')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity
              onPress={() => openExternalUrl(PRIVACY_POLICY_URL, t('shop.privacyPolicy'))}
              hitSlop={10}
              accessibilityRole="link"
            >
              <Text style={styles.legalLink}>{t('shop.privacyPolicy')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            {/* Apple Guideline 3.1.2(b) — Aboneliği Yönet linki */}
            <TouchableOpacity
              onPress={openManageSubscriptions}
              hitSlop={10}
              accessibilityRole="link"
            >
              <Text style={styles.legalLink}>{t('shop.manageSubscription')}</Text>
            </TouchableOpacity>
          </View>

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
  // ── Yasal — Apple Guideline 3.1.2(c) ──
  legalNotice: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  legalLink: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});
