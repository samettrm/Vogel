import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/useUserStore';
import {
  isNotificationsAvailable,
  requestNotificationPermission,
  sendTestNotification,
} from '../../utils/notifications';
import {
  disableSmartReminders,
  refreshSmartReminders,
} from '../../utils/smartReminders';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// REMINDER CARD — Akıllı Hatırlatmalar ayarı
//
// UX: Kullanıcı sadece bir switch'e dokunur. Saat seçmek YOK.
// Uygulama gün içinde random zamanlarda (sabah 9-12 ve akşam 18-22 arası)
// otomatik bildirim gönderir — bunaltmaz, tahmin edilemez.
//
// İçerir:
//   - Tek switch (Aç/Kapa)
//   - Test bildirimi butonu (5 sn sonra)
//   - Bilgi kutusu (Expo Go uyarısı veya paket eksikliği)
// ════════════════════════════════════════════════════════════════

export function ReminderCard() {
  const c = useThemeColors();
  const t = useT();

  const enabled = useUserStore((s) => s.reminderEnabled);
  const setReminderEnabled = useUserStore((s) => s.setReminderEnabled);
  const setLastReminderScheduledAt = useUserStore((s) => s.setLastReminderScheduledAt);

  const [packageAvailable] = useState(() => isNotificationsAvailable());
  const [testingSent, setTestingSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Uyarı mesajı: SADECE paket gerçekten kurulu değilse göster.
  // Expo Go'da bildirimler çalışıyor — gereksiz uyarı verme.
  const infoMessage = !packageAvailable
    ? { text: t('reminder.notInstalled'), tone: 'error' as const }
    : null;

  const handleToggle = async (next: boolean) => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});

    if (next) {
      // Açılıyor → izin al → smart reminder'ları planla
      if (!packageAvailable) {
        Alert.alert(t('reminder.title'), t('reminder.notInstalled'));
        return;
      }
      setBusy(true);
      try {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(t('reminder.title'), t('reminder.permissionDenied'));
          return;
        }
        await refreshSmartReminders();
        setLastReminderScheduledAt(Date.now());
        setReminderEnabled(true);
      } finally {
        setBusy(false);
      }
    } else {
      // Kapatılıyor → tüm planlı bildirimleri iptal et
      setBusy(true);
      try {
        await disableSmartReminders();
        setLastReminderScheduledAt(null);
        setReminderEnabled(false);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleTest = async () => {
    if (!packageAvailable) {
      Alert.alert(t('reminder.title'), t('reminder.notInstalled'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(t('reminder.title'), t('reminder.permissionDenied'));
      return;
    }

    const ok = await sendTestNotification();
    if (ok) {
      setTestingSent(true);
      setTimeout(() => setTestingSent(false), 6000);
    } else {
      Alert.alert(t('reminder.title'), t('reminder.testFailed'));
    }
  };

  const styles = makeStyles(c);

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />

      {/* Header — switch ile */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.titleIcon}>
            <Ionicons name="notifications" size={18} color={c.cyan} />
          </View>
          <View style={styles.titleText}>
            <Text style={styles.title}>{t('reminder.title')}</Text>
            <Text style={styles.subtitle}>{t('reminder.subtitle')}</Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: c.divider, true: c.neon }}
          thumbColor={enabled ? c.textOnNeon : c.textLow}
          disabled={!packageAvailable || busy}
        />
      </View>

      {/* Aktif durum mesajı */}
      {enabled ? (
        <Text style={styles.statusText}>{t('reminder.activeStatus')}</Text>
      ) : null}

      {/* Test butonu — paket varsa her zaman göster */}
      {packageAvailable ? (
        <Pressable
          onPress={handleTest}
          style={({ pressed }) => [
            styles.testButton,
            pressed && styles.testButtonPressed,
          ]}
        >
          <Text style={styles.testButtonText}>
            {testingSent ? '✓ ' + t('reminder.testSent') : t('reminder.testButton')}
          </Text>
        </Pressable>
      ) : null}

      {/* Uyarı kutusu — sadece paket yoksa */}
      {infoMessage ? (
        <View style={[styles.infoBox, styles.infoBoxError]}>
          <Ionicons name="warning" size={14} color={c.gold} />
          <Text style={styles.infoText}>{infoMessage.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      padding: spacing.base,
      gap: spacing.md,
      overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    titleCol: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    titleIcon: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.cyanBg,
      borderWidth: 1, borderColor: c.cyan,
      alignItems: 'center', justifyContent: 'center',
    },
    titleText: { flex: 1 },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    subtitle: { ...textStyles.body, color: c.textLow, fontSize: 11 },
    statusText: {
      ...textStyles.body,
      color: c.neonLight,
      fontSize: 12,
      textAlign: 'center',
      paddingVertical: spacing.xs,
    },
    testButton: {
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: c.purpleBg,
      borderWidth: 1, borderColor: c.purple,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing.md,
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 8, elevation: 3,
    },
    testButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    testButtonText: {
      ...textStyles.bodyBold,
      color: c.purpleLight,
      fontSize: 13,
      textAlign: 'center',
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
    },
    infoBoxError: {
      backgroundColor: c.goldBg,
      borderColor: c.gold,
    },
    infoText: { ...textStyles.body, color: c.textMed, fontSize: 11, flex: 1, lineHeight: 14 },
  });
}
