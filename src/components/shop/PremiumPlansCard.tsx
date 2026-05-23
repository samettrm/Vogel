import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { SpinningDiamondGem } from '../shared/SpinningDiamondGem';
import { useUserStore } from '../../store/useUserStore';
import { FamilyShareGuide } from './FamilyShareGuide';
import type { PremiumPackage, PlanId } from '../../services/purchases';

// ════════════════════════════════════════════════════════════════
// PREMIUM PLANS CARD — Y Cosmic Tasarım
//
// Duolingo-ilham: koyu gradient hero + bulut dalgası + plan kartları
// Holografik çizgiler, mor/mavi glow, cam efekti kartlar
// Seçili kart: mor gradient border (wrapper trick ile)
// Tüm planlar: 3 gün ücretsiz deneme
// Aile planı: 2–5 üye
// ════════════════════════════════════════════════════════════════

interface PremiumPlansCardProps {
  isPremium: boolean;
  packages: PremiumPackage[] | null;
  onSelectPlan: (planId: PlanId, rcPackage?: PremiumPackage['rcPackage']) => void;
}

// ─── Plan tanımları ──────────────────────────────────────────────
interface PlanDef {
  id: PlanId;
  label: string;
  sublabel?: string;
  price: string;
  perMonth: string;
  savings?: string;
  badgeText: string;
  badgeColor: string;
}

const PLANS: PlanDef[] = [
  {
    id: 'yearly',
    label: '12 Aylık',
    price: '₺969,99',
    perMonth: '₺80,83 / ay',
    savings: '%42',
    badgeText: '⭐ En Popüler',
    badgeColor: '#a855f7',
  },
  {
    id: 'family',
    label: 'Aile Planı',
    sublabel: '2–6 üye',
    price: '₺1.199,99',
    perMonth: '₺99,99 / ay',
    badgeText: '👨‍👩‍👧 Aile',
    badgeColor: '#3b82f6',
  },
  {
    id: 'monthly',
    label: 'Aylık',
    price: '₺199',
    perMonth: '/ ay',
    badgeText: 'Aylık',
    badgeColor: '#64748b',
  },
];

const SCREEN_H = Dimensions.get('window').height;

// ─── Premium perk listesi ────────────────────────────────────────
const PERKS: {
  icon: React.ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
  color: string;
  label: string;
  desc: string;
}[] = [
  { icon: 'school-outline',   color: '#14b8a6', label: 'Goethe & TELC',        desc: 'Sınav hazırlığına sınırsız erişim' },
  { icon: 'heart',            color: '#ef4444', label: 'Sınırsız Can',         desc: 'Hiç can endişesi olmadan öğren' },
  { icon: 'eye-off-outline',  color: '#f59e0b', label: 'Reklamsız',             desc: 'Kesintisiz öğrenme deneyimi' },
  { icon: 'star',             color: '#a855f7', label: 'Özel Dersler',          desc: 'Premium içeriklere tam erişim' },
];

// Holografik arka plan çizgileri (dekoratif, absolute)
function HoloLines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: i * 80 + 10,
            width: 1,
            backgroundColor: i % 2 === 0
              ? 'rgba(168,85,247,0.08)'
              : 'rgba(59,130,246,0.06)',
          }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i * 60 + 20,
            height: 1,
            backgroundColor: 'rgba(168,85,247,0.05)',
          }}
        />
      ))}
    </View>
  );
}

// ─── Plan görüntü bilgileri ──────────────────────────────────────
const PLAN_META: Record<string, { name: string; renewal: string; highlight: string }> = {
  monthly:  { name: 'Aylık Plan',   renewal: 'Her ay yenilenir',    highlight: '#6366f1' },
  yearly:   { name: '12 Aylık',     renewal: 'Her yıl yenilenir',   highlight: '#a855f7' },
  lifetime: { name: 'Aile Planı',   renewal: 'Tek seferlik ödeme',  highlight: '#f59e0b' },
  family:   { name: 'Aile Planı',   renewal: 'Her yıl yenilenir',   highlight: '#3b82f6' },
};
const DEFAULT_PLAN_META = { name: 'Premium',  renewal: 'Abonelik aktif',       highlight: '#a855f7' };

// Seçili kart wrapper: gradient border efekti (wrap trick)
function SelectedWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.selectedWrapper}>
      {children}
    </View>
  );
}

export function PremiumPlansCard({
  isPremium,
  packages,
  onSelectPlan,
}: PremiumPlansCardProps) {
  const c = useThemeColors();
  const t = useT();
  const [selectedId, setSelectedId] = useState<PlanId>('yearly');
  const [showFamilyGuide, setShowFamilyGuide] = useState(false);
  const activePlanId = useUserStore((s) => s.activePlanId);

  // ─── İşleyiciler ────────────────────────────────────────────────
  const handleCardPress = (plan: PlanDef) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedId(plan.id);
  };

  const handleCta = () => {
    if (isPremium) {
      Alert.alert('👑 Vogel Plus', 'Premium üyeliğin zaten aktif!');
      return;
    }
    const plan = PLANS.find((p) => p.id === selectedId)!;
    const rcPkg = packages?.find((p) => p.id === selectedId);

    Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      `Vogel Plus — ${plan.label}`,
      `${plan.price}\n3 gün ücretsiz, sonra otomatik yenilenir.\n\n(Mock satın alma — gerçek ödeme yok)`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: '3 Günü Ücretsiz Başlat',
          onPress: () => {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
            onSelectPlan(plan.id, rcPkg?.rcPackage);
          },
        },
      ],
    );
  };

  // ─── Aktif üye görünümü — Design A: Üyelik Kartı ───────────────
  if (isPremium) {
    const meta = (activePlanId ? PLAN_META[activePlanId] : null) ?? DEFAULT_PLAN_META;

    return (
      <View style={styles.premiumRoot}>
        <HoloLines />
        <View style={styles.glowTopLeft} pointerEvents="none" />
        <View style={styles.glowTopRight} pointerEvents="none" />
        <View style={styles.glowPremiumBottom} pointerEvents="none" />

        <View style={styles.premiumInner}>

          {/* ── ÜYELİK KARTI ──────────────────────────────────── */}
          <View style={[styles.memberCard, { borderColor: meta.highlight + '70' }]}>
            {/* Üst parlaklık çizgisi */}
            <View style={[styles.memberCardShine, {
              backgroundColor: meta.highlight,
            }]} pointerEvents="none" />

            {/* Başlık satırı: plan adı + AKTİF badge */}
            <View style={styles.memberCardTop}>
              <View>
                <Text style={styles.memberCardEyebrow}>Mevcut Plan</Text>
                <Text style={[styles.memberCardPlanName, { color: '#fff' }]}>
                  {meta.name}
                </Text>
              </View>
              <View style={styles.memberActiveBadge}>
                <View style={styles.memberActiveDot} />
                <Text style={styles.memberActiveBadgeText}>AKTİF</Text>
              </View>
            </View>

            {/* Orta: gem + Vogel Premium */}
            <View style={styles.memberCardMid}>
              <SpinningDiamondGem size={36} />
              <View style={styles.memberMidText}>
                <Text style={styles.memberMidTitle}>Vogel Premium</Text>
                <Text style={styles.memberMidSub}>Tüm özelliklere tam erişim</Text>
              </View>
            </View>

            {/* Alt: yenileme bilgisi */}
            <View style={styles.memberCardBottom}>
              <Text style={styles.memberRenewalText}>{meta.renewal}</Text>
              <View style={[styles.memberRenewalChip, { borderColor: meta.highlight + '55', backgroundColor: meta.highlight + '18' }]}>
                <Text style={[styles.memberRenewalChipText, { color: meta.highlight }]}>
                  {'Abonelik'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── AİLE PAYLAŞIM KARTI ────────────────────────────── */}
          {activePlanId === 'family' && (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowFamilyGuide(true);
              }}
              style={({ pressed }) => [
                styles.familyCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.familyCardGlow} pointerEvents="none" />
              <View style={styles.familyCardTop}>
                <View style={styles.familyCardIconRing}>
                  <Ionicons name="people" size={26} color="#60a5fa" />
                </View>
                <View style={styles.familyCardBadge}>
                  <Text style={styles.familyCardBadgeText}>AİLE PLANI</Text>
                </View>
              </View>
              <Text style={styles.familyCardTitle}>Üyeliğini Aileyle Paylaş</Text>
              <Text style={styles.familyCardSub}>
                2–6 kişi aynı planı kullanabilir. Adım adım nasıl ekleyeceğini gösterelim.
              </Text>
              <View style={styles.familyCardCta}>
                <Text style={styles.familyCardCtaText}>Paylaşım Rehberini Aç</Text>
                <Ionicons name="arrow-forward" size={14} color="#60a5fa" />
              </View>
            </Pressable>
          )}

          {/* ── AVANTAJLAR LİSTESİ ─────────────────────────────── */}
          <View style={styles.perksCard}>
            <Text style={styles.perksCardTitle}>Avantajların</Text>
            {PERKS.map((perk, idx) => (
              <View
                key={perk.label}
                style={[
                  styles.perkRow,
                  idx === PERKS.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.perkIconWrap, { backgroundColor: perk.color + '22' }]}>
                  <Ionicons name={perk.icon} size={18} color={perk.color} />
                </View>
                <View style={styles.perkText}>
                  <Text style={styles.perkLabel}>{perk.label}</Text>
                  <Text style={styles.perkDesc}>{perk.desc}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
              </View>
            ))}
          </View>

          <Text style={styles.premiumManageText}>
            Google Play'den aboneliğini yönetebilirsin
          </Text>
        </View>

        <FamilyShareGuide
          visible={showFamilyGuide}
          onClose={() => setShowFamilyGuide(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>

      {/* ── HERO — Cosmic arka plan ─────────────────────────────── */}
      <View style={styles.hero}>
        <HoloLines />

        {/* Glow orb sol üst */}
        <View style={styles.glowTopLeft} pointerEvents="none" />
        {/* Glow orb sağ üst */}
        <View style={styles.glowTopRight} pointerEvents="none" />

        {/* PLUS rozeti */}
        <View style={styles.heroNav}>
          <View style={styles.plusBadge}>
            <SpinningDiamondGem size={14} />
            <Text style={styles.plusBadgeText}>PLUS</Text>
          </View>
        </View>

        {/* Başlık */}
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Sınırsız öğren,{'\n'}
            <Text style={styles.heroTitleEm}>hiç durma</Text>
          </Text>
          <Text style={styles.heroSub}>
            3 gün ücretsiz dene — istersen iptal et
          </Text>

          {/* Mini fiyat özetleri */}
          <View style={styles.heroPills}>
            {PLANS.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => handleCardPress(plan)}
                style={[
                  styles.heroPill,
                  selectedId === plan.id && styles.heroPillSelected,
                ]}
              >
                <Text style={[
                  styles.heroPillPrice,
                  selectedId === plan.id && styles.heroPillPriceSelected,
                ]}>
                  {plan.price}
                </Text>
                <Text style={styles.heroPillLabel}>{plan.label}</Text>
                {plan.savings ? (
                  <Text style={styles.heroPillSavings}>{plan.savings}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* ── BULUT DALGASI ───────────────────────────────────────── */}
      <View style={styles.waveWrapper}>
        <Svg
          width="100%"
          height={52}
          viewBox="0 0 375 52"
          preserveAspectRatio="none"
          style={styles.waveSvg}
        >
          <Path
            d="M0,52 L0,30 Q18,8 44,20 Q62,28 80,14 Q98,2 120,16 Q142,30 164,12 Q186,0 208,14 Q230,28 252,10 Q274,-4 298,14 Q318,26 340,14 Q360,4 375,18 L375,52 Z"
            fill={HERO_BG}
          />
        </Svg>
      </View>

      {/* ── PLAN KARTLARI ───────────────────────────────────────── */}
      <View style={styles.cardsArea}>

        {/* "3 GÜN ÜCRETSİZ DENEMELİ" etiketi */}
        <View style={styles.trialRow}>
          <View style={styles.trialLine} />
          <Text style={styles.trialLabel}>3 GÜN ÜCRETSİZ DENEMELİ</Text>
          <View style={styles.trialLine} />
        </View>

        {/* Plan kartları */}
        {PLANS.map((plan) => {
          const isSelected = selectedId === plan.id;
          const cardContent = (
            <Pressable
              onPress={() => handleCardPress(plan)}
              style={[
                styles.planCard,
                isSelected ? styles.planCardSelected : styles.planCardDefault,
              ]}
            >
              {/* Rozet */}
              <View style={[styles.planBadge, { backgroundColor: plan.badgeColor + '22', borderColor: plan.badgeColor + '66' }]}>
                <Text style={[styles.planBadgeText, { color: plan.badgeColor }]}>
                  {plan.badgeText}
                </Text>
              </View>

              {/* Seçim tiki */}
              {isSelected ? (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : (
                <View style={styles.uncheckCircle} />
              )}

              {/* Plan adı + alt başlık */}
              <Text style={[styles.planName, { color: isSelected ? '#fff' : '#cbd5e1' }]}>
                {plan.label}
                {plan.sublabel ? (
                  <Text style={styles.planSublabel}>  {plan.sublabel}</Text>
                ) : null}
                {plan.savings ? (
                  <Text style={styles.planSavingInline}>  {plan.savings} indirim</Text>
                ) : null}
              </Text>

              {/* Toplam fiyat + üstü çizili  */}
              <Text style={[styles.planTotal, { color: isSelected ? 'rgba(255,255,255,0.45)' : 'rgba(148,163,184,0.6)' }]}>
                {plan.id === 'yearly' ? (
                  <Text>
                    <Text style={styles.planStrike}>₺3.359 </Text>
                    {plan.price}
                  </Text>
                ) : plan.price}
              </Text>

              {/* Aylık fiyat */}
              <Text style={[styles.planPerMonth, { color: isSelected ? 'rgba(255,255,255,0.55)' : 'rgba(148,163,184,0.5)' }]}>
                {plan.perMonth}
              </Text>
            </Pressable>
          );

          return isSelected ? (
            <SelectedWrapper key={plan.id}>{cardContent}</SelectedWrapper>
          ) : (
            <View key={plan.id} style={styles.unselectedWrapper}>
              {cardContent}
            </View>
          );
        })}

        {/* ── CTA butonu ─────────────────────────────────────────── */}
        <View style={styles.ctaArea}>
          {Platform.OS === 'android' ? (
            <Text style={styles.ctaNote}>
              Google Play'den istediğin zaman iptal edebilirsin
            </Text>
          ) : null}
          <Pressable
            onPress={handleCta}
            style={({ pressed }) => [
              styles.ctaBtn,
              pressed && styles.ctaBtnPressed,
            ]}
          >
            <Text style={styles.ctaBtnText}>₺0,00 ÖDEYEREK DENE</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}

// ─── Sabitler ────────────────────────────────────────────────────
const HERO_BG   = '#05020e';   // Cosmic hero arka planı (siyah-mor)
const AREA_BG   = '#0d0320';   // Kart alanı arka planı (koyu mor)
const CARD_BG_SEL = '#130630'; // Seçili kart iç arka planı

// ─── Stiller ─────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: { overflow: 'hidden', borderRadius: radius.xl ?? radius.lg },

  // ── Premium tam ekran kutlama ──────────────────────────────────
  premiumRoot: {
    minHeight: SCREEN_H - 100,
    backgroundColor: HERO_BG,
    overflow: 'hidden',
    paddingBottom: 32,
  },
  premiumHero: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: spacing.base,
    gap: 14,
  },
  // Gem etrafındaki çift halka
  gemRingOuter: {
    width: 136, height: 136, borderRadius: 68,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
    marginBottom: 4,
  },
  gemRingInner: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Canlı yeşil "AKTİF" pill
  premiumActivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  premiumActiveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  premiumActivePillText: {
    ...textStyles.label, color: '#10b981', fontSize: 12, fontWeight: '800', letterSpacing: 1.2,
  },
  premiumTitle: {
    ...textStyles.display, color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 0.5,
    textShadowColor: 'rgba(168,85,247,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  premiumSubtitle: {
    ...textStyles.body, color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', lineHeight: 20,
  },
  // Alt glow orb
  glowPremiumBottom: {
    position: 'absolute', bottom: 80, alignSelf: 'center', left: '25%',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.08)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 60,
  },
  // Aile paylaşım kartı (öne çıkarılmış)
  familyCard: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(30,58,138,0.35)',
    borderWidth: 1.5, borderColor: 'rgba(96,165,250,0.35)',
    borderRadius: 20,
    padding: spacing.base,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  familyCardGlow: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  familyCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  familyCardIconRing: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(96,165,250,0.4)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10,
  },
  familyCardBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.45)',
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
  },
  familyCardBadgeText: {
    ...textStyles.label, color: '#93c5fd', fontSize: 11, fontWeight: '800', letterSpacing: 1,
  },
  familyCardTitle: {
    ...textStyles.subheading, color: '#bfdbfe', fontSize: 17, fontWeight: '800',
  },
  familyCardSub: {
    ...textStyles.body, color: 'rgba(191,219,254,0.55)', fontSize: 13, lineHeight: 19,
  },
  familyCardCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(96,165,250,0.15)',
  },
  familyCardCtaText: {
    ...textStyles.bodyBold, color: '#60a5fa', fontSize: 13, fontWeight: '700',
  },

  // Perk kartı
  perksCard: {
    marginHorizontal: spacing.base,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)',
    borderRadius: 20,
    padding: spacing.base,
    gap: 4,
  },
  perksCardTitle: {
    ...textStyles.label, color: 'rgba(168,85,247,0.65)', fontSize: 11,
    fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  perkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  perkIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  perkText: { flex: 1, gap: 2 },
  perkLabel: { ...textStyles.bodyBold, color: '#fff', fontSize: 14, fontWeight: '700' },
  perkDesc: { ...textStyles.body, color: 'rgba(255,255,255,0.38)', fontSize: 12 },
  // Alt yönetim notu
  premiumManageText: {
    ...textStyles.body, color: 'rgba(255,255,255,0.2)', fontSize: 12,
    textAlign: 'center', marginTop: 20, paddingHorizontal: spacing.base,
  },

  // ── Design A: Üyelik Kartı ─────────────────────────────────────
  premiumInner: {
    paddingHorizontal: spacing.base,
    paddingTop: 28,
    gap: 14,
  },
  memberCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: spacing.base,
    gap: 14,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  memberCardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  memberCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberCardEyebrow: {
    ...textStyles.label,
    color: 'rgba(168,85,247,0.65)',
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  memberCardPlanName: {
    ...textStyles.display,
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  memberActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  memberActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  memberActiveBadgeText: {
    ...textStyles.label,
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
  },
  memberCardMid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  memberMidText: {
    flex: 1,
    gap: 3,
  },
  memberMidTitle: {
    ...textStyles.bodyBold,
    color: '#fff',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  memberMidSub: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
  },
  memberCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberRenewalText: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  memberRenewalChip: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberRenewalChipText: {
    ...textStyles.label,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
  },

  // ── Hero ──
  hero: {
    backgroundColor: HERO_BG,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  glowTopLeft: {
    position: 'absolute', top: -40, left: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(168,85,247,0.18)',
    // iOS shadow for glow
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  glowTopRight: {
    position: 'absolute', top: 10, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.15)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 35,
  },

  heroNav: {
    flexDirection: 'row', justifyContent: 'flex-end',
    padding: spacing.base, paddingBottom: 0,
  },
  plusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 5,
  },
  plusBadgeText: {
    ...textStyles.label, color: '#c084fc', fontSize: 11, fontWeight: '800', letterSpacing: 1,
  },

  heroContent: { padding: spacing.base, paddingTop: spacing.sm, gap: 6 },
  heroTitle: { ...textStyles.display, color: '#fff', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  heroTitleEm: { color: '#c084fc' },
  heroSub: { ...textStyles.body, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12 },

  heroPills: { flexDirection: 'row', gap: 8, paddingBottom: spacing.sm },
  heroPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 10, alignItems: 'center',
  },
  heroPillSelected: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderColor: 'rgba(168,85,247,0.55)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  heroPillPrice: { ...textStyles.bodyBold, color: '#fff', fontSize: 15 },
  heroPillPriceSelected: { color: '#e9d5ff' },
  heroPillLabel: { ...textStyles.body, color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },
  heroPillSavings: { ...textStyles.label, color: '#c084fc', fontSize: 9, fontWeight: '700', marginTop: 2 },

  // ── Bulut dalgası ──
  // waveWrapper bg = kart alanı rengi; SVG path fill = hero rengi
  // → hero'nun wavy alt kenarı oluşur
  waveWrapper: { marginTop: -1, backgroundColor: AREA_BG },
  waveSvg: { display: 'flex' },

  // ── Kartlar alanı ──
  cardsArea: { backgroundColor: AREA_BG, paddingHorizontal: spacing.base, paddingBottom: spacing.base },

  trialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm, marginTop: 4 },
  trialLine: { flex: 1, height: 1, backgroundColor: 'rgba(168,85,247,0.18)' },
  trialLabel: { ...textStyles.label, color: 'rgba(168,85,247,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' as const },

  // Seçili kart wrapper (gradient border efekti)
  selectedWrapper: {
    backgroundColor: '#a855f7', // gradient border rengi
    borderRadius: 20,
    padding: 2,
    marginBottom: 10,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  unselectedWrapper: {
    marginBottom: 10,
  },

  planCard: {
    borderRadius: 18,
    padding: spacing.base,
    position: 'relative',
    minHeight: 90,
  },
  planCardSelected: {
    backgroundColor: CARD_BG_SEL,
  },
  planCardDefault: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  planBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 8,
  },
  planBadgeText: { ...textStyles.label, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  checkCircle: {
    position: 'absolute', top: spacing.base, right: spacing.base,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#a855f7',
    alignItems: 'center', justifyContent: 'center',
  },
  uncheckCircle: {
    position: 'absolute', top: spacing.base, right: spacing.base,
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },

  planName: { ...textStyles.bodyBold, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  planSublabel: { ...textStyles.body, fontSize: 13, fontWeight: '400', color: 'rgba(148,163,184,0.7)' },
  planSavingInline: { fontSize: 13, fontWeight: '700', color: '#c084fc' },
  planTotal: { ...textStyles.body, fontSize: 13, marginBottom: 1 },
  planStrike: { textDecorationLine: 'line-through' as const, color: 'rgba(255,255,255,0.2)' },
  planPerMonth: { ...textStyles.body, fontSize: 13 },

  // ── CTA ──
  ctaArea: { gap: spacing.sm, marginTop: spacing.sm },
  ctaNote: { ...textStyles.body, color: 'rgba(255,255,255,0.28)', fontSize: 12, textAlign: 'center' },
  ctaBtn: {
    backgroundColor: '#a855f7',
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaBtnPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  ctaBtnText: { ...textStyles.button, color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  ctaAllPlans: { ...textStyles.label, color: '#c084fc', fontSize: 13, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
});
