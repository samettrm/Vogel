import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePalette, type ThemePalette } from '../src/theme/useThemePalette';
import { useT } from '../src/i18n';
import { useFamilyStore } from '../src/store/useFamilyStore';
import { useUserStore } from '../src/store/useUserStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { acceptInvite, ensureFamilyOwner, leaveFamily } from '../src/services/family';
import { AddMemberCard } from '../src/components/family/AddMemberCard';
import { MemberListItem } from '../src/components/family/MemberListItem';

// ════════════════════════════════════════════════════════════════
// Aile Planı ekranı — 3 görünüm:
//
//   1. Owner (kendi family planı satın aldı):
//      - Status card (X/5 üye, status, geçerlilik tarihi)
//      - AddMemberCard (kod üret + paylaş)
//      - Üye listesi
//
//   2. Member (başka birinin aile planına dahil):
//      - "X'in aile planının üyesisin" başlık
//      - Üye listesi (kendisi dahil)
//      - "Aileden Ayrıl" CTA
//
//   3. Hiçbir aile yok (kullanıcı premium ama family değil veya hiç premium değil):
//      - "Aile planı satın al" CTA → /shop
// ════════════════════════════════════════════════════════════════

export default function FamilyScreen() {
  const c = useThemePalette();
  const styles = makeStyles(c);
  const t = useT();

  const user = useAuthStore((s) => s.user);

  const familyDoc = useFamilyStore((s) => s.familyDoc);
  const role = useFamilyStore((s) => s.role);

  const isOwner = role === 'owner';
  const isMember = role === 'member';

  // ─── Davet kodu ile katılma (davet edilen kişi — premium olması gerekmez) ───
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4 || joining) return;
    setJoinError(null);
    setJoinSuccess(null);
    setJoining(true);
    const result = await acceptInvite(code);
    setJoining(false);
    if (!result.ok) {
      if (result.reason === 'expired') setJoinError(t('family.accept.errors.expired'));
      else if (result.reason === 'full') setJoinError(t('family.accept.errors.full'));
      else if (result.reason === 'already-in') setJoinError(t('family.accept.errors.alreadyIn'));
      else setJoinError(result.error || t('family.accept.errors.unknown'));
      return;
    }
    setJoinSuccess(t('family.accept.success'));
    // Firestore listener'ları role'ü 'member' yapınca görünüm otomatik geçer.
    setTimeout(() => router.replace('/family'), 1200);
  }

  // ⚠️ EXPONENTIAL-PREMIUM FIX: family doc'u SADECE GERÇEK RC aile aboneliği
  // sahibi oluşturabilir. Üye (family-derived premium) veya ex-member ASLA
  // ensureFamilyOwner çağırmamalı — yoksa üye kendi ailesini açıp 5 kişi daha
  // davet eder, 1 abonelik katlanarak çoğalır. RC'den GERÇEK plan sorgulanır
  // (store activePlanId'ye GÜVENİLMEZ — PremiumSyncer üyeye de 'family' yazıyor).
  useEffect(() => {
    if (!user || isMember) return;
    let alive = true;
    (async () => {
      try {
        const { getActivePlanId } = await import('../src/services/purchases');
        const rcPlan = await getActivePlanId(); // RC entitlement'ından gerçek plan
        if (alive && rcPlan === 'family') {
          await ensureFamilyOwner();
        }
      } catch {
        // RC yok / ağ hatası → owner doc'u zaten satın alma anında (shop.tsx) oluşturuldu
      }
    })();
    return () => { alive = false; };
  }, [user, isMember]);

  // ─── Hiçbir aileye dahil değil → DAVET KODU GİR veya kendi planını al ───
  if (!isOwner && !isMember) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('family.title'), headerShown: false }} />
        <FamilyHeader c={c} title={t('family.title')} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <Ionicons name="people-outline" size={56} color={c.textMed} />
            <Text style={styles.headerTitle}>{t('family.notInFamily')}</Text>
            <Text style={styles.headerSubtitle}>{t('family.notInFamilySubtitle')}</Text>
          </View>

          {/* DAVET KODU GİR — davet edilen kişi için (premium gerekmez) */}
          <View style={styles.joinCard}>
            <Text style={styles.joinTitle}>{t('family.join.title')}</Text>
            <Text style={styles.joinSubtitle}>{t('family.join.subtitle')}</Text>

            {user ? (
              <>
                <TextInput
                  style={styles.codeInput}
                  value={joinCode}
                  onChangeText={(v) => {
                    setJoinCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                    if (joinError) setJoinError(null);
                  }}
                  placeholder={t('family.join.placeholder')}
                  placeholderTextColor={c.textMed}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  returnKeyType="done"
                  onSubmitEditing={handleJoin}
                  editable={!joinSuccess}
                />

                {joinError ? (
                  <View style={styles.joinMsgBox}>
                    <Ionicons name="alert-circle" size={18} color={c.red} />
                    <Text style={[styles.joinMsgText, { color: c.red }]}>{joinError}</Text>
                  </View>
                ) : null}
                {joinSuccess ? (
                  <View style={styles.joinMsgBox}>
                    <Ionicons name="checkmark-circle" size={18} color={c.correct} />
                    <Text style={[styles.joinMsgText, { color: c.correct }]}>{joinSuccess}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (joinCode.length < 4 || joining || !!joinSuccess) && styles.buttonDisabled,
                  ]}
                  onPress={handleJoin}
                  disabled={joinCode.length < 4 || joining || !!joinSuccess}
                >
                  {joining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('family.join.cta')}</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.joinSubtitle}>{t('family.join.loginRequired')}</Text>
                <Pressable
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.primaryButtonText}>{t('family.join.loginCta')}</Text>
                </Pressable>
              </>
            )}
          </View>

          <Text style={styles.orText}>{t('family.join.or')}</Text>

          {/* KENDİ AİLE PLANINI AL */}
          <View style={styles.joinCard}>
            <Text style={styles.joinTitle}>{t('family.buyOwnTitle')}</Text>
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <Text style={styles.secondaryButtonText}>{t('family.needFamilyPlanCta')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Member görünümü ───
  if (isMember && familyDoc) {
    const owner = familyDoc.members.find((m) => m.role === 'owner');
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('family.title'), headerShown: false }} />
        <FamilyHeader c={c} title={t('family.title')} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerCard}>
            <Ionicons name="people-circle" size={48} color={c.neon} />
            <Text style={styles.headerTitle}>
              {t('family.memberOf', { ownerName: owner?.displayName || '—' })}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('family.memberCount', {
                count: familyDoc.members.length,
                max: familyDoc.memberLimit,
              })}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>{t('family.membersTitle')}</Text>
          {familyDoc.members.map((m) => (
            <MemberListItem
              key={m.uid}
              member={m}
              isCurrentUser={m.uid === user?.uid}
            />
          ))}

          <Pressable
            style={[styles.button, styles.dangerButton]}
            onPress={() => confirmLeave(t)}
          >
            <Ionicons name="exit-outline" size={20} color={c.red} />
            <Text style={styles.dangerButtonText}>{t('family.leave.cta')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Owner görünümü ───
  if (isOwner && familyDoc) {
    const memberCount = familyDoc.members.length;
    const isFull = memberCount >= familyDoc.memberLimit;

    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('family.title'), headerShown: false }} />
        <FamilyHeader c={c} title={t('family.title')} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerCard}>
            <Ionicons name="people-circle" size={48} color={c.neon} />
            <Text style={styles.headerTitle}>{t('family.ownerStatus')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('family.memberCount', {
                count: memberCount,
                max: familyDoc.memberLimit,
              })}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {familyDoc.status === 'active'
                  ? t('family.statusActive')
                  : familyDoc.status === 'expired'
                    ? t('family.statusExpired')
                    : t('family.statusPaused')}
              </Text>
            </View>
          </View>

          <AddMemberCard
            currentCode={familyDoc.currentInviteCode}
            currentCodeExpiresAt={familyDoc.currentInviteExpiresAt}
            isFull={isFull}
          />

          <Text style={styles.sectionTitle}>{t('family.membersTitle')}</Text>
          {familyDoc.members.map((m) => (
            <MemberListItem
              key={m.uid}
              member={m}
              isCurrentUser={m.uid === user?.uid}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Loading state (familyDoc null, role hesaplanmamış)
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('family.title') }} />
      <View style={styles.emptyState}>
        <Text style={styles.emptySubtitle}>{t('family.loading')}</Text>
      </View>
    </SafeAreaView>
  );
}

// Geri butonlu basit header — her aile görünümünün üstünde (native header gizli).
function FamilyHeader({ c, title }: { c: ThemePalette; title: string }) {
  const styles = makeStyles(c);
  return (
    <View style={styles.navHeader}>
      <Pressable
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)');
        }}
        hitSlop={10}
        style={styles.navBack}
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color={c.textHigh} />
      </Pressable>
      <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

function confirmLeave(t: ReturnType<typeof useT>) {
  Alert.alert(t('family.leave.cta'), t('family.leave.confirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('family.leave.cta'),
      style: 'destructive',
      onPress: async () => {
        const result = await leaveFamily();
        if (result.ok) {
          // ⚠️ ANINDA reaksiyon: Firestore listener'ını beklemeden family premium'u
          // proaktif düşür → kilitli özellikler + Market anında premiumsuza döner.
          // (Kendi gerçek RC aboneliği olan biri için PremiumSyncer ~anında geri yükler.)
          useFamilyStore.getState().clearFamily();
          useUserStore.getState().setPremium(false);
          useUserStore.setState({ activePlanId: null });
          router.replace('/(tabs)');
        } else {
          Alert.alert('Hata', result.error);
        }
      },
    },
  ]);
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    navBack: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
      flex: 1,
      color: c.textHigh,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    navSpacer: {
      width: 40,
    },
    scroll: {
      padding: 16,
      paddingBottom: 32,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 12,
    },
    emptyTitle: {
      color: c.textHigh,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptySubtitle: {
      color: c.textMed,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
    },
    headerCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
      gap: 6,
    },
    headerTitle: {
      color: c.textHigh,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    headerSubtitle: {
      color: c.textMed,
      fontSize: 14,
    },
    statusBadge: {
      backgroundColor: c.correct + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    statusBadgeText: {
      color: c.correct,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionTitle: {
      color: c.textHigh,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginTop: 16,
    },
    primaryButton: {
      backgroundColor: c.neon,
      paddingHorizontal: 24,
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    dangerButton: {
      backgroundColor: c.red + '15',
      borderWidth: 1,
      borderColor: c.red,
    },
    dangerButtonText: {
      color: c.red,
      fontWeight: '700',
      fontSize: 15,
    },
    // ── Davet kodu gir (not-in-family görünümü) ──
    joinCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      gap: 10,
    },
    joinTitle: {
      color: c.textHigh,
      fontSize: 16,
      fontWeight: '700',
    },
    joinSubtitle: {
      color: c.textMed,
      fontSize: 13,
      lineHeight: 18,
    },
    codeInput: {
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      color: c.neon,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 4,
      textAlign: 'center',
    },
    joinMsgBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    joinMsgText: {
      fontSize: 13,
      flex: 1,
    },
    orText: {
      color: c.textMed,
      fontSize: 13,
      textAlign: 'center',
      marginVertical: 4,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    secondaryButton: {
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.neon,
    },
    secondaryButtonText: {
      color: c.neon,
      fontWeight: '700',
      fontSize: 15,
    },
  });
