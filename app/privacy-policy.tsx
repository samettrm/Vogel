import React from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';
import { useUserStore } from '../src/store/useUserStore';

// ════════════════════════════════════════════════════════════════
// GİZLİLİK POLİTİKASI — PRIVACY POLICY
// App Store zorunlu. Metin cihaz diline göre TR/EN gösterilir.
// ════════════════════════════════════════════════════════════════

type PolicySection = { title: string; body: string };

const POLICY_TR: { lastUpdated: string; sections: PolicySection[] } = {
  lastUpdated: 'Son güncelleme: Mayıs 2026',
  sections: [
    {
      title: '1. Giriş',
      body: 'Vogel ("uygulama", "biz") olarak gizliliğinize önem veriyoruz. Bu politika, uygulamayı kullanırken hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.',
    },
    {
      title: '2. Toplanan Veriler',
      body: 'Vogel, öğrenme sürecinizi takip etmek amacıyla aşağıdaki verileri yalnızca cihazınızda saklar:\n\n• Öğrenme ilerlemeniz (XP, seviye, tamamlanan dersler)\n• Günlük seri ve kalp sayısı\n• Tema, dil ve bildirim tercihleri\n• Gördüğünüz kelimeler (yeni kelime rozetleri için)\n\nBu veriler hiçbir zaman sunucularımıza gönderilmez ve üçüncü şahıslarla paylaşılmaz.',
    },
    {
      title: '3. Kişisel Veri Toplanmaması',
      body: 'Vogel hesap oluşturma gerektirmez; e-posta adresi veya isim toplamaz. Konumunuza erişmez. Mikrofona yalnızca siz başlattığınızda, konuşma alıştırması sırasında erişilir.',
    },
    {
      title: '4. Uygulama İçi Satın Almalar',
      body: "Uygulama içi satın almalar Apple'ın ödeme sistemi (App Store) aracılığıyla işlenir. Ödeme bilgileriniz yalnızca Apple tarafından yönetilir; biz bu bilgilere erişmeyiz.",
    },
    {
      title: '5. Hata Raporlama',
      body: 'Uygulamanın kararlılığını artırmak amacıyla anonim teknik hata raporları toplanabilir. Bu raporlar kişisel tanımlayıcı bilgi içermez.',
    },
    {
      title: '6. Üçüncü Taraf Hizmetler',
      body: 'Vogel reklam göstermez ve kullanıcı davranışını izleyen üçüncü taraf analiz araçları kullanmaz.',
    },
    {
      title: '7. Çocukların Gizliliği',
      body: 'Uygulamamız 4 yaş ve üzeri kullanıcılar için tasarlanmıştır. 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız.',
    },
    {
      title: '8. Değişiklikler',
      body: 'Bu politika zaman zaman güncellenebilir. Önemli değişiklikler uygulama içinde duyurulur.',
    },
    {
      title: '9. İletişim',
      body: 'Gizlilik politikamıza ilişkin sorularınız için:\ntrsamet71@gmail.com',
    },
  ],
};

const POLICY_EN: { lastUpdated: string; sections: PolicySection[] } = {
  lastUpdated: 'Last updated: May 2026',
  sections: [
    {
      title: '1. Introduction',
      body: 'Vogel ("app", "we") values your privacy. This policy explains what data is collected when you use the app and how it is used.',
    },
    {
      title: '2. Data Collected',
      body: 'Vogel stores the following data only on your device to track your learning progress:\n\n• Learning progress (XP, level, completed lessons)\n• Daily streak and heart count\n• Theme, language and notification preferences\n• Words you have seen (for new word badges)\n\nThis data is never sent to our servers and is not shared with third parties.',
    },
    {
      title: '3. No Personal Data Collection',
      body: 'Vogel does not require account creation and does not collect email addresses or names. It does not access your location. Microphone access occurs only during speaking practice, and only when you initiate it.',
    },
    {
      title: '4. In-App Purchases',
      body: "In-app purchases are processed through Apple's payment system (App Store). Your payment information is handled exclusively by Apple; we do not access it.",
    },
    {
      title: '5. Error Reporting',
      body: 'Anonymous technical error reports may be collected to improve app stability. These reports do not contain personally identifiable information.',
    },
    {
      title: '6. Third-Party Services',
      body: 'Vogel does not display advertisements and does not use third-party analytics tools that track user behavior.',
    },
    {
      title: "7. Children's Privacy",
      body: 'Our app is designed for users aged 4 and above. We do not knowingly collect personal data from children under 13.',
    },
    {
      title: '8. Changes',
      body: 'This policy may be updated periodically. Significant changes will be announced within the app.',
    },
    {
      title: '9. Contact',
      body: 'For questions about our privacy policy:\ntrsamet71@gmail.com',
    },
  ],
};

export default function PrivacyPolicyScreen() {
  const c = useThemeColors();
  const t = useT();
  const language = useUserStore((s) => s.language);
  const policy = language === 'tr' ? POLICY_TR : POLICY_EN;
  const styles = makeStyles(c);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.bgGlow} pointerEvents="none" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={22} color={c.textHigh} />
        </Pressable>
        <Text style={styles.title}>{t('privacyPolicy.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Son güncelleme */}
        <Text style={styles.lastUpdated}>{policy.lastUpdated}</Text>

        {/* Politika bölümleri */}
        {policy.sections.map((section, index) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(index * 35).duration(340).springify().damping(14)}
            style={styles.sectionCard}
          >
            <View style={styles.topHighlight} pointerEvents="none" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </Animated.View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    bgGlow: {
      position: 'absolute',
      top: -60,
      left: -80,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: c.purpleLight,
      opacity: 0.05,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
    title: { ...textStyles.subheading, color: c.textHigh },
    headerSpacer: { width: 40 },
    scrollContent: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    lastUpdated: {
      ...textStyles.label,
      color: c.textLow,
      paddingHorizontal: spacing.xs,
    },
    sectionCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.base,
      overflow: 'hidden',
      gap: spacing.sm,
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: c.glassHighlight,
    },
    sectionTitle: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 15,
    },
    sectionBody: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 14,
      lineHeight: 22,
    },
  });
}
