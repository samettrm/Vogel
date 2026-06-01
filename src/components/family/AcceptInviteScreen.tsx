import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemePalette, type ThemePalette } from '../../theme/useThemePalette';
import { useT } from '../../i18n';
import { acceptInvite } from '../../services/family';

// ════════════════════════════════════════════════════════════════
// AcceptInviteScreen — davet kodu kabul ekranı.
//
// Bu component app/invite/[code].tsx içinde render edilir. Kullanıcı
// auth olmuş olmalı (route guard).
//
// Flow:
//   1. "X seni Vogel Premium ailesine davet ediyor" başlık
//   2. Kabul Et butonu
//   3. acceptInvite callable → success → router.replace('/family') + toast
//   4. Hata durumlarında akıllı mesaj (expired, full, alreadyIn, alreadyPremium)
// ════════════════════════════════════════════════════════════════

interface Props {
  code: string;
  onSuccess?: () => void;
}

export function AcceptInviteScreen({ code, onSuccess }: Props) {
  const c = useThemePalette();
  const styles = makeStyles(c);
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const result = await acceptInvite(code);
    setLoading(false);

    if (!result.ok) {
      // Akıllı hata mapping
      if (result.reason === 'expired') setError(t('family.accept.errors.expired'));
      else if (result.reason === 'full') setError(t('family.accept.errors.full'));
      else if (result.reason === 'already-in') setError(t('family.accept.errors.alreadyIn'));
      else setError(t('family.accept.errors.unknown'));
      return;
    }

    setSuccess(t('family.accept.success'));
    onSuccess?.();
    // 1 saniye sonra family ekranına yönlendir
    setTimeout(() => {
      router.replace('/family');
    }, 1200);
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="people-circle" size={80} color={c.neon} />
      </View>

      <Text style={styles.title}>{t('family.accept.title')}</Text>
      <Text style={styles.subtitle}>{t('family.accept.subtitle')}</Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>{t('family.currentCode')}</Text>
        <Text style={styles.code}>{code}</Text>
      </View>

      {success && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color={c.correct} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={c.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={handleAccept}
        disabled={loading || !!success}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{t('family.accept.cta')}</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.secondaryButtonText}>{t('family.accept.skip')}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      padding: 24,
      justifyContent: 'center',
    },
    iconWrap: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      color: c.textHigh,
      fontSize: 24,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      color: c.textMed,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 24,
    },
    codeBox: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    codeLabel: {
      color: c.textMed,
      fontSize: 12,
      marginBottom: 8,
    },
    code: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: 8,
      color: c.neon,
      fontVariant: ['tabular-nums'],
    },
    successBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.correct + '15',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    successText: {
      color: c.correct,
      fontSize: 14,
      flex: 1,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.red + '15',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    errorText: {
      color: c.red,
      fontSize: 14,
      flex: 1,
    },
    button: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: c.neon,
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
    },
    secondaryButtonText: {
      color: c.textMed,
      fontWeight: '600',
      fontSize: 14,
    },
  });
