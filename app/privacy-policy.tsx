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
  lastUpdated: 'Son güncelleme: Ağustos 2026',
  sections: [
    {
      title: '1. Giriş',
      body: 'Vogel ("uygulama", "biz") BUSATER YAZILIM ANONİM ŞİRKETİ tarafından sunulmaktadır. Bu politika, uygulamayı kullanırken hangi verilerin toplandığını, nerede saklandığını ve nasıl kullanıldığını açıklar.',
    },
    {
      title: '2. Hesap Bilgileri',
      body: "Uygulamayı hesap açmadan denemeye başlayabilirsiniz. İlerlemenizi kaydetmek ve cihazlar arasında taşımak için hesap oluşturmanız gerekir.\n\nHesap oluşturduğunuzda toplanan bilgiler:\n\n• E-posta adresiniz\n• Görünen adınız (sağladıysanız)\n• Giriş yönteminiz (e-posta, Google veya Apple)\n\nApple ile Giriş'i kullanır ve e-postanızı gizlemeyi seçerseniz, yalnızca Apple'ın oluşturduğu yönlendirme adresini görürüz; gerçek e-posta adresinize erişemeyiz. Kimlik doğrulama Google Firebase Authentication altyapısıyla yürütülür.",
    },
    {
      title: '3. Öğrenme İlerlemeniz',
      body: 'Öğrenme sürecinizle ilgili şu veriler tutulur:\n\n• XP, seviye ve tamamlanan dersler\n• Günlük seri ve kalp sayısı\n• Gördüğünüz kelimeler ve sınav sonuçlarınız\n• Tema, dil ve bildirim tercihleri\n\nHesabınız varsa bu veriler, cihaz değiştirdiğinizde ilerlemenizi kaybetmemeniz için Google Firebase (Firestore) üzerinde hesabınıza bağlı olarak saklanır. Hesabınız yoksa veriler yalnızca cihazınızda kalır.',
    },
    {
      title: '4. Cihaz ve Kullanım Bilgileri',
      body: 'Uygulamanın hangi ülkelerde ve hangi cihazlarda kullanıldığını anlamak için şunları kaydediyoruz:\n\n• Ülke ve dil — cihazınızın BÖLGE AYARINDAN okunur\n• Cihaz markası, modeli ve türü (telefon/tablet)\n• İşletim sistemi ve uygulama sürümü\n• Uygulamayı en son ne zaman açtığınız\n• Abonelik durumunuz\n\nBu bilgiler yalnızca toplu istatistik üretmek için kullanılır ve üçüncü şahıslara satılmaz.\n\nKonum izni İSTEMİYORUZ, IP adresinizden konum çıkarımı YAPMIYORUZ ve reklam kimliğinizi bu amaçla kullanmıyoruz. Ülke bilgisi, telefonunuzun dil/bölge ayarından gelir.',
    },
    {
      title: '5. Mikrofon',
      body: 'Mikrofona yalnızca konuşma alıştırmalarında, siz kayda başladığınızda erişilir. Ses kaydınız telaffuz değerlendirmesi için kullanılır; sunucularımızda saklanmaz.',
    },
    {
      title: '6. Uygulama İçi Satın Almalar',
      body: "Abonelikler Apple App Store ve Google Play üzerinden işlenir. Kart ve ödeme bilgilerinize hiçbir zaman erişmeyiz; bunlar yalnızca Apple ve Google tarafından yönetilir.\n\nAbonelik durumunuzu takip etmek için RevenueCat hizmetini kullanırız. RevenueCat'e hesap kimliğiniz, e-posta adresiniz ve satın alma işleminizin durumu iletilir.",
    },
    {
      title: '7. Reklamlar',
      body: "Ücretsiz kullanıcılara Google AdMob aracılığıyla reklam gösterilir. Premium abonelerde reklam gösterilmez.\n\niOS'ta, kişiselleştirilmiş reklam için izniniz sorulur (App Tracking Transparency). İzin vermezseniz reklamlar yine gösterilir ama size özel hedeflenmez; uygulama tüm özellikleriyle çalışmaya devam eder. Uygulama içindeki öğrenme verileriniz reklam hedeflemesinde kullanılmaz.",
    },
    {
      title: '8. Hata Raporlama',
      body: 'Uygulamanın kararlılığını artırmak için Sentry hizmetiyle teknik hata raporları toplanır. Bu raporlar hata mesajını, cihaz modelini ve uygulama sürümünü içerir; öğrenme içeriğinizi veya şifrenizi içermez.',
    },
    {
      title: '9. Verilerinizi Silme',
      body: 'Hesabınızı ve tüm bulut verilerinizi uygulama içinden kalıcı olarak silebilirsiniz: Ayarlar → Hesap → Hesabımı Sil.\n\nSilme işlemi geri alınamaz. Aboneliğiniz varsa hesap silmek aboneliği İPTAL ETMEZ; aboneliği App Store veya Google Play üzerinden ayrıca iptal etmeniz gerekir.',
    },
    {
      title: '10. Üçüncü Taraf Hizmetler',
      body: 'Verilerinizin bir kısmı şu hizmetler üzerinden işlenir:\n\n• Google Firebase — kimlik doğrulama ve ilerleme senkronizasyonu\n• Google AdMob — reklam gösterimi\n• RevenueCat — abonelik durumu takibi\n• Sentry — hata raporlama\n• Google Sign-In / Apple ile Giriş — kimlik doğrulama\n\nHer hizmet kendi gizlilik politikasına tabidir.',
    },
    {
      title: '11. Çocukların Gizliliği',
      body: 'Uygulamamız 4 yaş ve üzeri kullanıcılar için tasarlanmıştır. 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız.',
    },
    {
      title: '12. Değişiklikler',
      body: 'Bu politika zaman zaman güncellenebilir. Önemli değişiklikler uygulama içinde duyurulur.',
    },
    {
      title: '13. İletişim',
      body: 'Gizlilik politikamıza ilişkin sorularınız için:\nbsdigitalapp@gmail.com',
    },
  ],
};

const POLICY_EN: { lastUpdated: string; sections: PolicySection[] } = {
  lastUpdated: 'Last updated: August 2026',
  sections: [
    {
      title: '1. Introduction',
      body: 'Vogel ("the app", "we") is provided by BUSATER YAZILIM ANONIM SIRKETI. This policy explains what data is collected when you use the app, where it is stored and how it is used.',
    },
    {
      title: '2. Account Information',
      body: 'You can start using the app without an account. To save your progress and carry it between devices, you need to create one.\n\nWhen you create an account we collect:\n\n• Your email address\n• Your display name (if provided)\n• Your sign-in method (email, Google or Apple)\n\nIf you use Sign in with Apple and choose to hide your email, we only see the relay address Apple generates; we cannot access your real email address. Authentication is handled by Google Firebase Authentication.',
    },
    {
      title: '3. Your Learning Progress',
      body: 'The following data about your learning is kept:\n\n• XP, level and completed lessons\n• Daily streak and heart count\n• Words you have seen and your exam results\n• Theme, language and notification preferences\n\nIf you have an account, this data is stored on Google Firebase (Firestore) and linked to your account so you do not lose progress when you change devices. Without an account, it stays only on your device.',
    },
    {
      title: '4. Device and Usage Information',
      body: "To understand which countries and devices the app is used on, we record:\n\n• Country and language — read from your device REGION SETTING\n• Device brand, model and type (phone/tablet)\n• Operating system and app version\n• When you last opened the app\n• Your subscription status\n\nThis information is used only to produce aggregate statistics and is not sold to third parties.\n\nWe do NOT request location permission, we do NOT infer location from your IP address, and we do not use your advertising identifier for this purpose. Country comes from your phone's language/region setting.",
    },
    {
      title: '5. Microphone',
      body: 'The microphone is accessed only during speaking exercises, when you start a recording. Your recording is used for pronunciation assessment and is not stored on our servers.',
    },
    {
      title: '6. In-App Purchases',
      body: 'Subscriptions are processed through the Apple App Store and Google Play. We never have access to your card or payment details; these are handled solely by Apple and Google.\n\nWe use RevenueCat to track your subscription status. Your account identifier, email address and purchase status are shared with RevenueCat.',
    },
    {
      title: '7. Advertising',
      body: 'Free users are shown ads through Google AdMob. Premium subscribers see no ads.\n\nOn iOS you are asked for permission for personalised advertising (App Tracking Transparency). If you decline, ads are still shown but are not targeted to you, and the app continues to work with all its features. Your in-app learning data is not used for ad targeting.',
    },
    {
      title: '8. Error Reporting',
      body: 'Technical error reports are collected via Sentry to improve app stability. These reports contain the error message, device model and app version; they do not contain your learning content or password.',
    },
    {
      title: '9. Deleting Your Data',
      body: 'You can permanently delete your account and all cloud data from inside the app: Settings → Account → Delete Account.\n\nDeletion cannot be undone. If you have a subscription, deleting your account does NOT cancel it; you must cancel it separately through the App Store or Google Play.',
    },
    {
      title: '10. Third-Party Services',
      body: 'Some of your data is processed through these services:\n\n• Google Firebase — authentication and progress sync\n• Google AdMob — advertising\n• RevenueCat — subscription status tracking\n• Sentry — error reporting\n• Google Sign-In / Sign in with Apple — authentication\n\nEach service is subject to its own privacy policy.',
    },
    {
      title: "11. Children's Privacy",
      body: 'Our app is designed for users aged 4 and above. We do not knowingly collect personal data from children under 13.',
    },
    {
      title: '12. Changes',
      body: 'This policy may be updated from time to time. Significant changes will be announced in the app.',
    },
    {
      title: '13. Contact',
      body: 'For questions about our privacy policy:\nbsdigitalapp@gmail.com',
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
