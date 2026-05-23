import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, textStyles } from '../../theme';

// ════════════════════════════════════════════════════════════════
// AİLE PLANI PAYLAŞIM REHBERİ
//
// Aile planı sahiplerine Google Play / App Store üzerinden
// nasıl üye davet edeceklerini adım adım anlatan modal.
// ════════════════════════════════════════════════════════════════

interface FamilyShareGuideProps {
  visible: boolean;
  onClose: () => void;
}

const CARD_BG   = '#0d0320';
const STEP_LINE = 'rgba(168,85,247,0.25)';

type StoreTab = 'android' | 'ios';

const STEPS_ANDROID = [
  {
    icon: 'logo-google-playstore' as const,
    title: "Google Play'i Ac",
    desc: 'Telefondaki Google Play Store uygulamasini baslatmak icin dokun.',
  },
  {
    icon: 'person-circle-outline' as const,
    title: 'Profiline Git',
    desc: 'Sag ustteki profil fotografina dokun → "Hesabini yonet".',
  },
  {
    icon: 'people-outline' as const,
    title: 'Aile Bolumunu Bul',
    desc: '"Aile" sekmesine dokun → "Aile grubunu yonet" veya "Aile grubu olustur".',
  },
  {
    icon: 'mail-outline' as const,
    title: 'Uye Davet Et',
    desc: '"Uye davet et"e dokun ve davet etmek istedigin kisinin Gmail adresini gir. (2–6 uye)',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: 'Davet Kabul Edilir',
    desc: 'Davet edilen kisi maile tiklayip kabul ettiginde Vogel Plus otomatik aktif olur.',
  },
];

const STEPS_IOS = [
  {
    icon: 'settings-outline' as const,
    title: "Ayarlar'i Ac",
    desc: "iPhone Ayarlari → en ustteki adina dokun.",
  },
  {
    icon: 'people-outline' as const,
    title: 'Aile Paylasimi',
    desc: '"Aile Paylasimi"na dokun → "Uye Ekle"yi sec.',
  },
  {
    icon: 'mail-outline' as const,
    title: 'Davet Gonder',
    desc: 'Davet etmek istedigin kisinin Apple ID e-postasini gir ve davet gonder. (2–6 uye)',
  },
  {
    icon: 'storefront-outline' as const,
    title: 'App Store Paylasimi',
    desc: 'Davet edilen kisi "Aile Paylasimi"ni etkinlestirince App Store alisverisleri paylasilir.',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: 'Davet Kabul Edilir',
    desc: 'Kabul ettikten sonra Vogel\'i actiktan sonra Vogel Plus otomatik aktif olur.',
  },
];

export function FamilyShareGuide({ visible, onClose }: FamilyShareGuideProps) {
  const [tab, setTab] = useState<StoreTab>(Platform.OS === 'ios' ? 'ios' : 'android');

  const steps = tab === 'android' ? STEPS_ANDROID : STEPS_IOS;

  const handleShare = async () => {
    const msgAndroid =
      '🐦 Vogel Plus Aile Planimi seninle paylasiyorum!\n\n' +
      "Google Play'i ac → Profil → Aile → Aile Grubunu Yonet → Uye Davet Et\n\n" +
      'Daveti kabul ettiginde Vogel Plus sende de aktif olacak. 🎓';
    const msgIos =
      '🐦 Vogel Plus Aile Planimi seninle paylasiyorum!\n\n' +
      'Ayarlar → Adin → Aile Paylasimi → Uye Ekle\n\n' +
      'Daveti kabul ettiginde Vogel Plus sende de aktif olacak. 🎓';
    const message = tab === 'android' ? msgAndroid : msgIos;

    try {
      await Share.share({ message });
    } catch {
      // Kullanıcı iptal etti, sessizce geç
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Tutamaç */}
          <View style={styles.handle} />

          {/* Başlık */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={22} color="#a855f7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Aile Üyelerini Davet Et</Text>
              <Text style={styles.headerSub}>2–6 kişiye ücretsiz erişim ver</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </View>

          {/* Platform sekmeleri */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setTab('android')}
              style={[styles.tabBtn, tab === 'android' && styles.tabBtnActive]}
            >
              <Ionicons
                name="logo-android"
                size={14}
                color={tab === 'android' ? '#a855f7' : 'rgba(255,255,255,0.35)'}
              />
              <Text style={[styles.tabText, tab === 'android' && styles.tabTextActive]}>
                Android
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('ios')}
              style={[styles.tabBtn, tab === 'ios' && styles.tabBtnActive]}
            >
              <Ionicons
                name="logo-apple"
                size={14}
                color={tab === 'ios' ? '#a855f7' : 'rgba(255,255,255,0.35)'}
              />
              <Text style={[styles.tabText, tab === 'ios' && styles.tabTextActive]}>
                iPhone
              </Text>
            </Pressable>
          </View>

          {/* Adımlar */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                {/* Sol: numara + dikey çizgi */}
                <View style={styles.stepLeft}>
                  <View style={styles.stepNumWrap}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  {i < steps.length - 1 && <View style={styles.stepLine} />}
                </View>

                {/* Sağ: ikon + metin */}
                <View style={styles.stepRight}>
                  <View style={styles.stepIconWrap}>
                    <Ionicons name={step.icon} size={17} color="#a855f7" />
                  </View>
                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Paylaş butonu */}
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Davet Mesajını Paylaş</Text>
            </Pressable>

            <Text style={styles.note}>
              💡 Davet edilen kişilerin mevcut bir Google / Apple hesabı olması gerekir.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    paddingBottom: 32,
    maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },

  // Başlık
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.12)',
  },
  headerIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...textStyles.subheading, color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub: { ...textStyles.body, color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Sekmeler
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    flex: 1, justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderColor: 'rgba(168,85,247,0.45)',
  },
  tabText: { ...textStyles.label, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#a855f7' },

  // Scroll
  scroll: { flex: 0 },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 0,
  },

  // Adım satırı
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
  },
  stepNumWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.45)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  stepNum: { ...textStyles.bodyBold, color: '#c084fc', fontSize: 12, fontWeight: '800' },
  stepLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: STEP_LINE,
    marginTop: 2, marginBottom: 2,
  },

  stepRight: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
    paddingTop: 4,
  },
  stepIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(168,85,247,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: { flex: 1, gap: 3, justifyContent: 'center' },
  stepTitle: { ...textStyles.bodyBold, color: '#fff', fontSize: 13, fontWeight: '700' },
  stepDesc: { ...textStyles.body, color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 17 },

  // Paylaş butonu
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#a855f7',
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  shareBtnText: { ...textStyles.button, color: '#fff', fontSize: 15, fontWeight: '800' },

  // Alt not
  note: {
    ...textStyles.body, color: 'rgba(255,255,255,0.25)', fontSize: 12,
    textAlign: 'center', marginTop: 14, lineHeight: 18,
  },
});
