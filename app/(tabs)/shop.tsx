import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { HeartPackageCard } from '../../src/components/shop/HeartPackageCard';
import { PremiumPlansCard } from '../../src/components/shop/PremiumPlansCard';
import { XPPackageCard } from '../../src/components/shop/XPPackageCard';
import { useUserStore } from '../../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function ShopScreen() {
  const c = useThemeColors();
  const t = useT();
  const xp = useUserStore((s) => s.xp);
  const hearts = useUserStore((s) => s.hearts);
  const maxHearts = useUserStore((s) => s.maxHearts);
  const buyKupa = useUserStore((s) => s.buyKupaPackage);
  const refill = useUserStore((s) => s.refillHearts);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const makePremium = useUserStore((s) => (s as { makePremium?: () => void }).makePremium);

  const heartsFull = hearts >= maxHearts;
  const heartVariant: 'refill' | 'disabled' | 'premium' = isPremium
    ? 'premium'
    : heartsFull ? 'disabled' : 'refill';

  const styles = makeStyles(c);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 🚀 PERF: Background glow View'ları kaldırıldı — Android blur composite pahalı. */}

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

        {/* 🚀 PERF: FadeInDown.springify chain'leri kaldırıldı — 3 paralel
            spring animasyon mount'u kilitliyordu. Şimdi anında görünür. */}

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
            onUpgrade={() => {
              if (typeof makePremium === 'function') makePremium();
            }}
          />
        </View>

        {/* XP PAKETLERI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: c.goldBg, borderColor: c.gold }]}>
              <Ionicons name="flash" size={14} color={c.gold} />
            </View>
            <Text style={styles.sectionTitle}>{t('shop.xpPackages')}</Text>
          </View>

          <View style={styles.xpRow}>
            <XPPackageCard title={t('shop.xpSmall')} amount={100} priceLabel="₺19.99" onPurchase={() => buyKupa(100)} />
            <XPPackageCard title={t('shop.xpMedium')} amount={500} priceLabel="₺49.99" badge="popular" onPurchase={() => buyKupa(500)} />
            <XPPackageCard title={t('shop.xpLarge')} amount={1500} priceLabel="₺99.99" badge="best" onPurchase={() => buyKupa(1500)} />
          </View>
        </View>

        {/* CAN PAKETLERI */}
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
            onPurchase={() => {
              refill();
              Alert.alert(t('common.ok'), '✓');
            }}
          />

          <HeartPackageCard
            title={t('shop.extraHearts')}
            description={t('shop.extraHeartsDesc')}
            ctaLabel="₺19.99"
            onPurchase={() => {
              Alert.alert(t('shop.mockNote'), '', [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.confirm'),
                  onPress: () => {
                    refill();
                    Alert.alert(t('common.ok'), '✓');
                  },
                },
              ]);
            }}
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={16} color={c.textLow} />
          <Text style={styles.noteText}>{t('shop.mockNote')}</Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    bgGlowGold: {
      position: 'absolute', top: -80, left: -120,
      width: 320, height: 320, borderRadius: 160,
      backgroundColor: c.gold, opacity: 0.06,
    },
    bgGlowPurple: {
      position: 'absolute', top: 200, right: -100,
      width: 280, height: 280, borderRadius: 140,
      backgroundColor: c.purple, opacity: 0.08,
    },
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
    noteCard: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.divider,
      borderRadius: radius.md,
    },
    noteText: { ...textStyles.body, color: c.textLow, fontSize: 12, flex: 1 },
  });
}
