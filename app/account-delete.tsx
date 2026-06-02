import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';
import { useAuthStore } from '../src/store/useAuthStore';
import { deleteAccount } from '../src/services/auth';
import { clearLocalProgress } from '../src/services/sync';
import { openManageSubscriptions } from '../src/utils/manageSubscriptions';

// ════════════════════════════════════════════════════════════════
// ACCOUNT DELETE — Apple Guideline 5.1.1(v)
//
// Sign-up sunan uygulamalar app İÇİNDE hesap silme sunmak ZORUNDA.
// Akış:
//   1. Sadece giriş yapmış kullanıcı görür (yoksa /login'e atılır)
//   2. Kalıcı silme + veri kaybı uyarısı
//   3. Abonelik OTOMATİK iptal olmaz uyarısı + "Aboneliği Yönet" linki
//   4. Onay checkbox (zorunlu) → buton aktifleşir
//   5. 2. adım: destructive confirm Alert
//   6. deleteAccount() → Firebase deleteUser + RC logOut + Google signOut
//   7. requires-recent-login → net mesaj (yeniden giriş gerekir)
// ════════════════════════════════════════════════════════════════

export default function AccountDeleteScreen() {
  const c = useThemeColors();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Giriş yoksa bu ekran görünmemeli — defansif redirect
  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);

  const styles = useMemo(() => makeStyles(c), [c]);

  const performDelete = async () => {
    setBusy(true);
    const res = await deleteAccount();
    if (res.ok) {
      try { await clearLocalProgress(); } catch {}
      setBusy(false);
      Alert.alert(t('accountDelete.successTitle'), t('accountDelete.successBody'));
      router.replace('/login');
      return;
    }
    setBusy(false);
    if (res.code === 'requires-recent-login') {
      Alert.alert(t('accountDelete.reauthTitle'), res.message);
    } else if (res.code !== 'no-user') {
      Alert.alert(t('accountDelete.title'), res.message);
    }
  };

  const onDeletePress = () => {
    if (!confirmed || busy) return;
    // 2 adımlı onay — kazara silmeyi engelle
    Alert.alert(
      t('accountDelete.confirmTitle'),
      t('accountDelete.confirmBody'),
      [
        { text: t('accountDelete.confirmCancel'), style: 'cancel' },
        { text: t('accountDelete.confirmDelete'), style: 'destructive', onPress: performDelete },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={c.textHigh} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('accountDelete.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={32} color={c.red} />
        </View>

        <Text style={styles.heading}>{t('accountDelete.heading')}</Text>
        <Text style={styles.warning}>{t('accountDelete.warning')}</Text>

        {/* Abonelik uyarısı — store sub OTOMATİK iptal olmaz */}
        <View style={styles.subBox}>
          <Text style={styles.subTitle}>{t('accountDelete.subWarningTitle')}</Text>
          <Text style={styles.subBody}>{t('accountDelete.subWarningBody')}</Text>
          <Pressable onPress={openManageSubscriptions} hitSlop={10} accessibilityRole="link">
            <Text style={styles.subLink}>{t('accountDelete.manageSubLink')}</Text>
          </Pressable>
        </View>

        {/* Onay checkbox — zorunlu */}
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setConfirmed((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
          </View>
          <Text style={styles.checkboxLabel}>{t('accountDelete.confirmCheckbox')}</Text>
        </Pressable>

        {/* Sil butonu — destructive, checkbox onaylanana kadar pasif */}
        <Pressable
          onPress={onDeletePress}
          disabled={!confirmed || busy}
          style={[styles.deleteBtn, (!confirmed || busy) && styles.deleteBtnDisabled]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteBtnText}>{t('accountDelete.deleteButton')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { ...textStyles.subheading, color: c.textHigh },
    headerSpacer: { width: 40 },
    content: { padding: spacing.base, gap: spacing.md, alignItems: 'center', paddingBottom: spacing.xxl },
    iconWrap: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: c.redBg, alignItems: 'center', justifyContent: 'center',
      marginTop: spacing.md,
    },
    heading: { ...textStyles.subheading, color: c.textHigh, fontSize: 20, textAlign: 'center' },
    warning: { ...textStyles.body, color: c.textMed, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    subBox: {
      width: '100%', backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong, borderRadius: radius.lg,
      padding: spacing.base, gap: 6, marginTop: spacing.sm,
    },
    subTitle: { ...textStyles.bodyBold, color: c.gold, fontSize: 14 },
    subBody: { ...textStyles.body, color: c.textMed, fontSize: 13, lineHeight: 18 },
    subLink: { ...textStyles.bodyBold, color: c.cyan, fontSize: 14, textDecorationLine: 'underline', marginTop: 4 },
    checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '100%', marginTop: spacing.sm },
    checkbox: {
      width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: c.textLow,
      alignItems: 'center', justifyContent: 'center', marginTop: 1,
    },
    checkboxChecked: { backgroundColor: c.red, borderColor: c.red },
    checkboxLabel: { ...textStyles.body, color: c.textMed, fontSize: 14, flex: 1, lineHeight: 20 },
    deleteBtn: {
      width: '100%', backgroundColor: c.red, borderRadius: radius.lg,
      paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
    },
    deleteBtnDisabled: { opacity: 0.4 },
    deleteBtnText: { ...textStyles.button, color: '#fff', fontSize: 16, fontWeight: '800' },
  });
}
