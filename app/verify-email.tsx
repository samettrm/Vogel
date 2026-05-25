import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useThemeColors, spacing, radius } from '@/src/theme';
import {
  sendVerificationEmail,
  reloadCurrentUser,
  signOut,
} from '@/src/services/auth';
import { useAuthStore } from '@/src/store/useAuthStore';
import { downloadAndReplaceProgress } from '@/src/services/sync';

// ════════════════════════════════════════════════════════════════
// E-POSTA DOĞRULAMA EKRANI
//
// Sign-up sonrası veya emailVerified=false ile login yapıldığında açılır.
//
// • Auto-poll: her 3 sn'de bir reload + emailVerified kontrolü
// • Resend: 60 sn cooldown ile tekrar gönder
// • Farklı hesap: signOut + login ekranına dön
//
// Apple/Google kullanıcıları emailVerified=true ile gelir → bu ekranı GÖRMEZ.
// Sadece email/password sign-up'ı bu ekrandan geçmek zorunda.
// ════════════════════════════════════════════════════════════════

const BG = '#05020e';
const POLL_INTERVAL_MS = 3000;
const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen() {
  const c        = useThemeColors();
  const insets   = useSafeAreaInsets();
  const user     = useAuthStore((s) => s.user);
  const setUser  = useAuthStore((s) => s.setUser);

  const [cooldown, setCooldown]       = useState(RESEND_COOLDOWN_S);
  const [sending, setSending]         = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Cooldown sayacı ────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      return;
    }
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldown]);

  // ─── Auto-poll: 3 sn'de bir verify durumu kontrolü ──────────────
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const verified = await reloadCurrentUser();
      if (verified) {
        // Sunucu onayladı → store'u tazele, sync başlat, ana ekrana dön
        setVerifying(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        // setUser ile store'u yenile (reload sonrası mevcut user objesi güncel)
        if (user) setUser({ ...user, emailVerified: true } as typeof user);
        try {
          await downloadAndReplaceProgress(user.uid);
        } catch {}
        // Ana ekrana yönlendir
        router.replace('/');
      }
    };
    // İlk kontrol hemen, sonra interval
    check();
    pollTimerRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [user, setUser]);

  // ─── Yeniden gönder ────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    const result = await sendVerificationEmail();
    setSending(false);
    if (result.ok) {
      setCooldown(RESEND_COOLDOWN_S);
      Alert.alert('Gönderildi', 'Doğrulama e-postası tekrar gönderildi.');
    } else {
      Alert.alert('Hata', result.message);
    }
  };

  // ─── Çıkış yap (farklı hesap) ──────────────────────────────────
  const handleSignOut = async () => {
    Alert.alert(
      'Çıkış yap',
      'Farklı bir hesapla giriş yapmak için çıkış yapılacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkış yap',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            setUser(null);
            router.replace('/login');
          },
        },
      ],
    );
  };

  // ─── Şimdi kontrol et (manuel refresh) ──────────────────────────
  const handleManualCheck = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVerifying(true);
    const verified = await reloadCurrentUser();
    if (!verified) {
      setVerifying(false);
      Alert.alert(
        'Henüz doğrulanmadı',
        'E-postandaki linke tıkladığından emin ol, sonra tekrar dene.',
      );
    }
    // Verified ise auto-poll zaten ana ekrana götürür
  };

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <LinearGradient
        colors={['rgba(124,58,237,0.20)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={44} color="#a78bfa" />
          </View>
          <Text style={styles.title}>E-postanı doğrula</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <Text style={styles.subtitle}>
            Bu adrese doğrulama bağlantısı gönderdik.{'\n'}
            Linke tıkla ve uygulamaya geri dön.
          </Text>
        </View>

        {/* Bilgi kartı */}
        <View style={[styles.tipCard, { borderColor: c.glassBorderStrong }]}>
          <Ionicons name="information-circle-outline" size={18} color="#a78bfa" />
          <Text style={styles.tipText}>
            Mail görünmüyorsa <Text style={styles.tipBold}>spam</Text> klasörünü kontrol et.
            Doğrulayınca <Text style={styles.tipBold}>otomatik geçiş yapılır</Text>.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Manuel kontrol butonu */}
        <Pressable
          onPress={handleManualCheck}
          disabled={verifying}
          style={({ pressed }) => [
            styles.mainBtn,
            { opacity: pressed || verifying ? 0.75 : 1 },
          ]}
        >
          {verifying ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text style={styles.mainBtnText}>Doğruladım, kontrol et</Text>
          )}
        </Pressable>

        {/* Yeniden gönder */}
        <Pressable
          onPress={handleResend}
          disabled={cooldown > 0 || sending}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { opacity: pressed || cooldown > 0 || sending ? 0.55 : 1 },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#a78bfa" />
          ) : (
            <Text style={styles.secondaryBtnText}>
              {cooldown > 0
                ? `Yeniden gönder (${cooldown}s)`
                : 'Yeniden gönder'}
            </Text>
          )}
        </Pressable>

        {/* Farklı hesap */}
        <Pressable onPress={handleSignOut} style={styles.signOutBtn} hitSlop={8}>
          <Text style={styles.signOutText}>Farklı bir hesap kullan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: { alignItems: 'center', marginTop: 24 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(124,58,237,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    marginTop: 28,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  tipBold: { color: '#fff', fontWeight: '700' },
  mainBtn: {
    backgroundColor: '#a78bfa',
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  mainBtnText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  secondaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.45)',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a78bfa',
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'underline',
  },
});
