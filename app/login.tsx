import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useThemeColors, spacing, radius } from '@/src/theme';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  isGoogleConfigured,
  isAppleAvailable,
} from '@/src/services/auth';
import { isFirebaseConfigured } from '@/src/config/firebase';
import { useAuthStore } from '@/src/store/useAuthStore';
import { GoogleGLogo } from '@/src/components/shared/GoogleGLogo';
import {
  downloadAndReplaceProgress,
  uploadProgress,
} from '@/src/services/sync';
import { useUserStore } from '@/src/store/useUserStore';
import { markDeviceAsLoggedIn } from '@/src/utils/secureStore';

// ════════════════════════════════════════════════════════════════
// GİRİŞ EKRANI — Email · Google · Apple
//
// Firebase yapılandırılmamışsa ekran açılmaz (profile'dan yönlendirilmez).
// Skip/"Atla" butonu YOK — misafir dersler sonrası AuthGuard login'i zorunlu
// kılar (Apple sonsuz-döngü riski yok).
// ════════════════════════════════════════════════════════════════

const BG = '#05020e';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const c       = useThemeColors();
  const insets  = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);
  const xp                   = useUserStore((s) => s.xp);
  const completedLessonsSize = useUserStore((s) => s.completedLessons.size);
  const hasGuestProgress     = completedLessonsSize > 0 || xp > 0;

  const [mode, setMode]         = useState<Mode>(hasGuestProgress ? 'register' : 'login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // ─── Email gönder ───────────────────────────────────────────────
  const handleEmail = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre girin.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const result = await fn(email.trim().toLowerCase(), password);
    setLoading(false);

    if (!result.ok) {
      if (result.code !== 'cancelled') Alert.alert('Hata', result.message);
      return;
    }

    setUser(result.user);
    // Bir kere hesap açıldı → AuthGuard misafir mod'a geri dönmesin
    useUserStore.setState({ hasEverSignedIn: true });
    // 🔐 Cihaz-bağlı flag: uninstall sonrası bu cihazda onboarding atlanır.
    await markDeviceAsLoggedIn();

    if (mode === 'register') {
      // SIGN-UP: Önce mevcut guest progress'i cloud'a yükle (kayıp önleme).
      // Sonra verify ekranı: kullanıcı linke tıklayınca doğrulanır.
      await uploadProgress(result.user.uid);
      router.replace('/verify-email');
      return;
    }

    // SIGN-IN
    // 🍎 Apple Review test account bypass — Spark plan'da emailVerified toggle yok,
    // bu özel hesap için doğrulama atlanır. Sadece bu email ile çalışır.
    const APPLE_REVIEW_EMAIL = 'apple-reviewer@vogel-app.com';
    const isAppleReviewer = result.user.email === APPLE_REVIEW_EMAIL;

    if (!result.user.emailVerified && !isAppleReviewer) {
      // Onaylanmamış (örn. typo email ile eski hesap) → verify ekranı
      router.replace('/verify-email');
      return;
    }
    // Onaylı login (veya Apple Review): cloud'u indir ve local'i değiştir
    await downloadAndReplaceProgress(result.user.uid);
    // AuthGuard router.replace('/login') ile yönlendirdi → back() çalışmaz.
    // Doğru hareket: ana sayfaya replace et.
    router.replace('/');
  };

  // ─── Google ─────────────────────────────────────────────────────
  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    if (result.ok) {
      setUser(result.user);
      useUserStore.setState({ hasEverSignedIn: true });
      // 🔐 Cihaz-bağlı flag: uninstall sonrası bu cihazda onboarding atlanır.
      await markDeviceAsLoggedIn();
      // Google sign-in: emailVerified=true otomatik. Cloud master.
      await downloadAndReplaceProgress(result.user.uid);
      router.replace('/');
    } else if (result.code !== 'cancelled') {
      // Debug: hata kodunu da göster, root cause anlaşılsın
      Alert.alert('Google Hatası', `${result.message}\n\nKod: ${result.code}`);
    }
  };

  // ─── Apple ──────────────────────────────────────────────────────
  const handleApple = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await signInWithApple();
    setLoading(false);
    if (result.ok) {
      setUser(result.user);
      useUserStore.setState({ hasEverSignedIn: true });
      // 🔐 Cihaz-bağlı flag: uninstall sonrası bu cihazda onboarding atlanır.
      await markDeviceAsLoggedIn();
      // Apple sign-in: emailVerified=true otomatik. Cloud master.
      await downloadAndReplaceProgress(result.user.uid);
      router.replace('/');
    } else if (result.code !== 'cancelled') {
      Alert.alert('Hata', result.message);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <LinearGradient
        colors={['rgba(124,58,237,0.18)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Login zorunlu — skip butonu yok */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.birdEmoji}>🐦</Text>
            <Text style={styles.appName}>Vogel</Text>
            {hasGuestProgress ? (
              <>
                <Text style={[styles.tagline, { color: '#fbbf24', fontWeight: '700' }]}>
                  🔥 İlerlemeni kaybetme!
                </Text>
                <Text style={styles.tagline}>
                  {completedLessonsSize} ders + {xp} XP topladın.{'\n'}
                  Hesap aç, hiçbir şey kaybolmasın.
                </Text>
              </>
            ) : (
              <Text style={styles.tagline}>
                İlerlemenizi tüm cihazlarınızda{'\n'}otomatik olarak saklayın
              </Text>
            )}
          </View>

          {/* Sosyal giriş butonları */}
          {isGoogleConfigured && (
            <Pressable
              onPress={handleGoogle}
              disabled={loading}
              style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.75 : 1 }]}
            >
              <GoogleGLogo size={20} />
              <Text style={styles.socialBtnText}>Google ile devam et</Text>
            </Pressable>
          )}

          {isAppleAvailable && (
            <Pressable
              onPress={handleApple}
              disabled={loading}
              style={({ pressed }) => [
                styles.socialBtn,
                styles.appleBtn,
                { opacity: pressed ? 0.75 : 1, marginTop: isGoogleConfigured ? 10 : 0 },
              ]}
            >
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={[styles.socialBtnText, { color: '#000' }]}>Apple ile devam et</Text>
            </Pressable>
          )}

          {/* Ayraç */}
          {(isGoogleConfigured || isAppleAvailable) && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {/* Email / Şifre formu */}
          <View style={styles.form}>
            <View style={[styles.inputWrap, { borderColor: c.glassBorderStrong }]}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={[styles.inputWrap, { borderColor: c.glassBorderStrong, marginTop: 10 }]}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Şifre"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPw}
                returnKeyType="done"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleEmail}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="rgba(255,255,255,0.35)"
                />
              </Pressable>
            </View>

            {/* Şifremi unuttum — sadece login modunda (signup'ta gereksiz) */}
            {mode === 'login' ? (
              <Pressable
                onPress={() => router.push('/forgot-password')}
                hitSlop={8}
                style={styles.forgotBtn}
                accessibilityRole="link"
              >
                <Text style={styles.forgotText}>Şifremi unuttum?</Text>
              </Pressable>
            ) : null}

            {/* Ana buton */}
            <Pressable
              onPress={handleEmail}
              disabled={loading}
              style={({ pressed }) => [
                styles.mainBtn,
                { opacity: pressed || loading ? 0.75 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.mainBtnText}>
                  {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                </Text>
              )}
            </Pressable>

            {/* Mod değiştir */}
            <Pressable
              onPress={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
              style={styles.switchMode}
            >
              <Text style={styles.switchModeText}>
                {mode === 'login'
                  ? 'Hesabın yok mu? '
                  : 'Zaten hesabın var mı? '}
                <Text style={{ color: '#a78bfa', fontWeight: '700' }}>
                  {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* Not */}
          <Text style={styles.note}>
            🔒  Verileriniz şifrelenerek güvende saklanır
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingBottom: 4,
  },
  forgotBtn:    { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4, marginTop: 8 },
  forgotText:   { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: 8,
    gap: 0,
  },
  hero:         { alignItems: 'center', marginBottom: 36, marginTop: 8 },
  birdEmoji:    { fontSize: 56, marginBottom: 8 },
  appName:      { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline: {
    fontSize: 15, color: 'rgba(255,255,255,0.52)',
    textAlign: 'center', lineHeight: 22, marginTop: 10,
  },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff',
    borderRadius: radius.lg, paddingVertical: 14,
  },
  appleBtn:     { backgroundColor: '#fff' },
  socialBtnText: { fontSize: 15, fontWeight: '700', color: '#111' },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20, gap: 10,
  },
  dividerLine:  { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText:  { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  form:         { gap: 0 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md, borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon:    { marginRight: 8 },
  input: {
    flex: 1, height: 50,
    color: '#fff', fontSize: 15,
  },
  mainBtn: {
    backgroundColor: '#a78bfa',
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  mainBtnText:  { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  switchMode:   { alignItems: 'center', paddingVertical: 14 },
  switchModeText: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  note: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.22)', marginTop: 20,
  },
});
