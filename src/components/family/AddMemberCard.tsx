import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemePalette, type ThemePalette } from '../../theme/useThemePalette';
import { useT } from '../../i18n';
import { generateInviteCode } from '../../services/family';

// ════════════════════════════════════════════════════════════════
// AddMemberCard — owner ekranında "Yeni üye davet et" CTA.
//
// 2 durum:
//   - Aktif kod yok: "Davet Kodu Üret" butonu
//   - Aktif kod var: kod gösterir + "Paylaş" + "Yeni Kod Üret"
// ════════════════════════════════════════════════════════════════

interface Props {
  currentCode: string | null;
  currentCodeExpiresAt: number | null;
  isFull: boolean; // 5/5 doluysa disable
  onCodeGenerated?: () => void;
}

export function AddMemberCard({
  currentCode,
  currentCodeExpiresAt,
  isFull,
  onCodeGenerated,
}: Props) {
  const c = useThemePalette();
  const styles = makeStyles(c);
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiryText = formatExpiry(currentCodeExpiresAt, t);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const result = await generateInviteCode();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCodeGenerated?.();
  }

  async function handleShare() {
    if (!currentCode) return;
    // https landing page → WhatsApp/SMS'te TIKLANABİLİR (vogel:// custom scheme
    // linke çevrilmiyordu). Sayfa kodu gösterir + "Vogel'i Aç" deep link + store linkleri.
    const link = `https://samettrm.github.io/Vogel/invite.html?code=${currentCode}`;
    const msg = t('family.shareMessage', {
      code: currentCode,
      link,
    });
    try {
      await Share.share({ message: msg });
    } catch {
      // Share dialog kapatıldı, sessiz geç
    }
  }

  if (isFull) {
    return (
      <View style={styles.fullCard}>
        <Ionicons name="checkmark-circle" size={28} color={c.correct} />
        <Text style={styles.fullText}>{t('family.full')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {currentCode ? (
        <>
          <Text style={styles.label}>{t('family.currentCode')}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{currentCode}</Text>
          </View>
          {expiryText && <Text style={styles.expiry}>{expiryText}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>{t('family.share')}</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={c.neon} />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color={c.neon} />
                  <Text style={styles.secondaryButtonText}>
                    {t('family.regenerate')}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{t('family.inviteTitle')}</Text>
          <Text style={styles.subtitle}>{t('family.inviteSubtitle')}</Text>

          <Pressable
            style={[styles.button, styles.primaryButton, styles.fullWidth]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  {t('family.inviteCta')}
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function formatExpiry(expiresAt: number | null, t: ReturnType<typeof useT>): string | null {
  if (!expiresAt) return null;
  const now = Date.now();
  if (expiresAt <= now) return t('family.expired');
  const hoursLeft = Math.floor((expiresAt - now) / (60 * 60 * 1000));
  if (hoursLeft >= 24) {
    const daysLeft = Math.floor(hoursLeft / 24);
    return t('family.daysLeft', { n: daysLeft });
  }
  return t('family.hoursLeft', { n: hoursLeft });
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    fullCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    fullText: {
      color: c.correct,
      fontSize: 15,
      fontWeight: '600',
    },
    title: {
      color: c.textHigh,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 4,
    },
    subtitle: {
      color: c.textMed,
      fontSize: 14,
      marginBottom: 16,
    },
    label: {
      color: c.textMed,
      fontSize: 13,
      marginBottom: 8,
    },
    codeRow: {
      backgroundColor: c.bg,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 6,
      alignItems: 'center',
    },
    code: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 6,
      color: c.neon,
      fontVariant: ['tabular-nums'],
    },
    expiry: {
      color: c.textMed,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 12,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
      flex: 1,
    },
    fullWidth: {
      flex: 0,
    },
    primaryButton: {
      backgroundColor: c.neon,
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
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
    error: {
      color: c.red,
      fontSize: 13,
      marginTop: 12,
      textAlign: 'center',
    },
  });
