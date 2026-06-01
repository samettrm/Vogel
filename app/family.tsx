import { useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePalette, type ThemePalette } from '../src/theme/useThemePalette';
import { useT } from '../src/i18n';
import { useUserStore } from '../src/store/useUserStore';
import { useFamilyStore } from '../src/store/useFamilyStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { ensureFamilyOwner, leaveFamily } from '../src/services/family';
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
  const activePlanId = useUserStore((s) => s.activePlanId);
  const isPremium = useUserStore((s) => s.isPremium);

  const familyDoc = useFamilyStore((s) => s.familyDoc);
  const role = useFamilyStore((s) => s.role);

  const isOwner = role === 'owner';
  const isMember = role === 'member';

  // Owner ise ensureFamilyOwner çağrısı (idempotent, family doc oluştur)
  useEffect(() => {
    if (isPremium && activePlanId === 'family' && user) {
      ensureFamilyOwner().catch(() => {});
    }
  }, [isPremium, activePlanId, user]);

  // ─── Hiçbir aileye dahil değil ───
  if (!isOwner && !isMember) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('family.title') }} />
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={80} color={c.textMed} />
          <Text style={styles.emptyTitle}>{t('family.notInFamily')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('family.notInFamilySubtitle')}
          </Text>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/(tabs)/shop')}
          >
            <Text style={styles.primaryButtonText}>
              {t('family.needFamilyPlanCta')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Member görünümü ───
  if (isMember && familyDoc) {
    const owner = familyDoc.members.find((m) => m.role === 'owner');
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: t('family.title') }} />
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
        <Stack.Screen options={{ title: t('family.title') }} />
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

function confirmLeave(t: ReturnType<typeof useT>) {
  Alert.alert(t('family.leave.cta'), t('family.leave.confirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('family.leave.cta'),
      style: 'destructive',
      onPress: async () => {
        const result = await leaveFamily();
        if (result.ok) {
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
  });
