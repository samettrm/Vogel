import React, { useState } from 'react';
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

import { spacing, radius } from '@/src/theme';
import { sendPasswordReset } from '@/src/services/auth';

// ════════════════════════════════════════════════════════════════
// ŞİFREMİ UNUTTUM — Firebase password reset
//
// 🔒 Enumeration safety: sendPasswordReset kayıtlı olmayan e-posta için
// bile { ok:true } döner. Bu ekran her başarıda AYNI nötr mesajı gösterir
// ("kayıtlıysa link gönderildi") — saldırgan hangi e-postanın kayıtlı
// olduğunu anlayamaz. Sadece format/rate-limit hatası Alert ile gösterilir.
// ════════════════════════════════════════════════════════════════

const BG = '#05020e';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Eksik bilgi', 'E-posta adresini gir.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    const res = await sendPasswordReset(email.trim().toLowerCase());
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      Alert.alert('Hata', res.message ?? 'Bir hata oluştu. Tekrar dene.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <LinearGradient
        colors={['rgba(124,58,237,0.18)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>Şifreni mi unuttun?</Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'E-postanı kontrol et. Eğer bu adres kayıtlıysa, şifre sıfırlama bağlantısı gönderdik.'
                : 'E-posta adresini gir, sana bir şifre sıfırlama bağlantısı gönderelim.'}
            </Text>
          </View>

          {sent ? (
            <Pressable onPress={() => router.back()} style={styles.mainBtn} accessibilityRole="button">
              <Text style={styles.mainBtnText}>Girişe Dön</Text>
            </Pressable>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={handleSend}
                />
              </View>
              <Pressable
                onPress={handleSend}
                disabled={loading}
                style={({ pressed }) => [styles.mainBtn, { opacity: pressed || loading ? 0.75 : 1 }]}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.mainBtnText}>Sıfırlama Bağlantısı Gönder</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: spacing.base, paddingBottom: 4 },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: spacing.base, paddingTop: 8 },
  hero: { alignItems: 'center', marginBottom: 32, marginTop: 24 },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.52)',
    textAlign: 'center', lineHeight: 22, marginTop: 12, paddingHorizontal: 12,
  },
  form: { gap: 0 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 50, color: '#fff', fontSize: 15 },
  mainBtn: {
    backgroundColor: '#a78bfa', borderRadius: radius.lg,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  mainBtnText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
});
