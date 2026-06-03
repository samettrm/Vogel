import React, { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../src/utils/haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';
import { useUserStore } from '../src/store/useUserStore';
import { ReminderCard } from '../src/components/settings/ReminderCard';
import { MOTIVATIONS_META } from '../src/services/personalization';
import { useAuthStore } from '../src/store/useAuthStore';
import { TERMS_OF_USE_URL } from '../src/config/legal';
import { openExternalUrl } from '../src/utils/openExternalUrl';
import { findLanguagePair } from '../src/config/languagePairs';

// ════════════════════════════════════════════════════════════════
// SETTINGS SCREEN
// Tüm toggle'lar (ses/haptik/tema/dil) store'a yazar — kalıcıdır.
// ════════════════════════════════════════════════════════════════

export default function SettingsScreen() {
  const t = useT();
  const c = useThemeColors();
  const themeMode = useUserStore((s) => s.themeMode);
  const language = useUserStore((s) => s.language);
  const activeCourse = useUserStore((s) => s.activeCourse);
  const setThemeMode = useUserStore((s) => s.setThemeMode);
  const setLanguage = useUserStore((s) => s.setLanguage);
  // 🎯 Motivasyon (hedefler)
  const learningMotivations = useUserStore((s) => s.learningMotivations);
  const setLearningMotivations = useUserStore((s) => s.setLearningMotivations);

  // Premium durumu (Aile Planı section'ı sadece premium'da görünür)
  const isPremium = useUserStore((s) => s.isPremium);
  // Giriş durumu (Hesap/sil bölümü sadece authenticated kullanıcıda görünür)
  const user = useAuthStore((s) => s.user);

  // Ses + Haptic — store'dan kalıcı
  const soundOn = useUserStore((s) => s.soundEnabled);
  const hapticOn = useUserStore((s) => s.hapticEnabled);
  const setSoundEnabled = useUserStore((s) => s.setSoundEnabled);
  const setHapticEnabled = useUserStore((s) => s.setHapticEnabled);

  const handleThemeChange = (mode: 'dark' | 'light') => {
    if (mode === themeMode) return;
    Haptics.selectionAsync().catch(() => {});
    setThemeMode(mode);
  };

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    if (lang === language) return;
    Haptics.selectionAsync().catch(() => {});
    setLanguage(lang);
  };

  // 🎯 Motivasyon toggle — multi-select, maks 3
  const handleMotivationToggle = (motivationId: string) => {
    Haptics.selectionAsync().catch(() => {});
    const current = new Set(learningMotivations);
    if (current.has(motivationId)) {
      current.delete(motivationId);
    } else {
      if (current.size >= 3) return; // Max 3 hedef
      current.add(motivationId);
    }
    setLearningMotivations(Array.from(current));
  };

  // Öğrenilen dilin adı (Hakkında kartı dile göre senkron — hardcoded "Almanca" değil).
  const learnPair = findLanguagePair(activeCourse.source, activeCourse.target);
  const learningLangName = learnPair
    ? (language === 'en' ? learnPair.targetNameEn : learnPair.targetName)
    : activeCourse.target.toUpperCase();

  // Tema-aware styles - render ediyorum component icinde
  const styles = useMemo(() => makeStyles(c), [c]);

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
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SES & TITRESIM */}
        <Section title={t('settings.sectionSound')} index={0} c={c}>
          <ToggleRow
            c={c}
            icon="volume-high"
            tone={c.cyan}
            toneBg={c.cyanBg}
            label={t('settings.soundEffects')}
            description={t('settings.soundEffectsDesc')}
            value={soundOn}
            onValueChange={() => { Haptics.selectionAsync(); setSoundEnabled(!soundOn); }}
          />
          <ToggleRow
            c={c}
            icon="pulse"
            tone={c.neon}
            toneBg={c.neonBg}
            label={t('settings.haptic')}
            description={t('settings.hapticDesc')}
            value={hapticOn}
            onValueChange={() => { Haptics.selectionAsync(); setHapticEnabled(!hapticOn); }}
          />
        </Section>

        {/* BILDIRIM — Gerçek ReminderCard (expo-notifications altyapılı) */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(380).springify().damping(14)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{t('settings.sectionNotifications')}</Text>
          <ReminderCard />
        </Animated.View>

        {/* GORUNUM — Tema AKTIF */}
        <Section title={t('settings.sectionAppearance')} index={2} c={c}>
          <SelectRow
            c={c}
            icon={themeMode === 'dark' ? 'moon' : 'sunny'}
            tone={c.purpleLight}
            toneBg={c.purpleBg}
            label={t('settings.theme')}
            description={t('settings.themeDesc')}
            options={[
              { value: 'dark', label: t('settings.themeDark') },
              { value: 'light', label: t('settings.themeLight') },
            ]}
            value={themeMode}
            onChange={(v) => handleThemeChange(v as 'dark' | 'light')}
          />
        </Section>

        {/* DIL — Ingilizce AKTIF */}
        <Section title={t('settings.sectionLanguage')} index={3} c={c}>
          <SelectRow
            c={c}
            icon="language"
            tone={c.cyan}
            toneBg={c.cyanBg}
            label={t('settings.interfaceLanguage')}
            description={t('settings.interfaceLanguageDesc')}
            options={[
              { value: 'tr', label: t('settings.languageTr') },
              { value: 'en', label: t('settings.languageEn') },
            ]}
            value={language}
            onChange={(v) => handleLanguageChange(v as 'tr' | 'en')}
          />
        </Section>

        {/* 🎯 HEDEFLERİN — motivasyon multi-select */}
        <Section title={t('settings.sectionMotivation')} index={4} c={c}>
          <MotivationsPicker
            c={c}
            t={t}
            selected={learningMotivations}
            onToggle={handleMotivationToggle}
          />
        </Section>

        {/* AİLE — giriş yapan HERKESE görünür (davet edilen kişi de kod girip katılabilsin) */}
        {user ? (
          <Section title={t('family.title')} index={5} c={c}>
            <LinkRow
              c={c}
              icon="people"
              tone={c.neon}
              toneBg={c.neonBg}
              label={t('family.settingsLinkTitle')}
              description={t('family.settingsLinkSubtitle')}
              onPress={() => router.push('/family')}
            />
          </Section>
        ) : null}

        {/* YASAL */}
        <Section title={t('settings.sectionLegal')} index={6} c={c}>
          <LinkRow
            c={c}
            icon="shield-checkmark"
            tone={c.cyan}
            toneBg={c.cyanBg}
            label={t('settings.privacyPolicy')}
            description={t('settings.privacyPolicyDesc')}
            onPress={() => router.push('/privacy-policy')}
          />
          {/* Terms of Use (EULA) — Apple 3.1.2(c): app içinde işlevsel link zorunlu */}
          <LinkRow
            c={c}
            icon="document-text"
            tone={c.purpleLight}
            toneBg={c.purpleBg}
            label={t('settings.termsOfUse')}
            description={t('settings.termsOfUseDesc')}
            onPress={() => openExternalUrl(TERMS_OF_USE_URL, t('settings.termsOfUse'))}
          />
        </Section>

        {/* HESAP — sadece giriş yapmış kullanıcıda (Apple 5.1.1(v) account deletion) */}
        {user ? (
          <Section title={t('settings.sectionAccount')} index={7} c={c}>
            <LinkRow
              c={c}
              icon="trash-outline"
              tone={c.red}
              toneBg={c.redBg}
              label={t('settings.deleteAccount')}
              description={t('settings.deleteAccountDesc')}
              destructive
              onPress={() => router.push('/account-delete')}
            />
          </Section>
        ) : null}

        {/* HAKKINDA */}
        <Animated.View
          entering={FadeInDown.delay(340).duration(380).springify().damping(14)}
          style={styles.aboutCard}
        >
          <View style={styles.topHighlight} pointerEvents="none" />
          <Ionicons name="information-circle" size={20} color={c.textLow} />
          <View style={styles.aboutText}>
            <Text style={styles.aboutTitle}>{t('settings.aboutTitle')}</Text>
            <Text style={styles.aboutDescription}>
              {t('settings.aboutDesc', { lang: learningLangName })}
            </Text>
            {/* Trademark disclaimer — Apple 4.5.2 */}
            <Text style={styles.aboutDisclaimer}>
              {t('settings.trademarkDisclaimer')}
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section
// ──────────────────────────────────────────────────────────────────
function Section({
  title,
  index,
  children,
  c,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
  c: ReturnType<typeof useThemeColors>;
}) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(380).springify().damping(14)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        <View style={styles.topHighlight} pointerEvents="none" />
        {children}
      </View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────────────────
// ToggleRow
// ──────────────────────────────────────────────────────────────────
interface ToggleRowProps {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneBg: string;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: () => void;
}

function ToggleRow({
  c,
  icon,
  tone,
  toneBg,
  label,
  description,
  value,
  onValueChange,
}: ToggleRowProps) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.row}>
      <View
        style={[styles.rowIcon, { backgroundColor: toneBg, borderColor: tone }]}
      >
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? (
          <Text style={styles.rowDescription}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.surface, true: c.neon }}
        thumbColor={value ? c.textOnNeon : c.textMuted}
        ios_backgroundColor={c.surface}
      />
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────
// LinkRow — chevron'lu tıklanabilir satır (navigasyon linkleri için)
// ──────────────────────────────────────────────────────────────────
interface LinkRowProps {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneBg: string;
  label: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
}

function LinkRow({
  c, icon, tone, toneBg, label, description, onPress, destructive,
}: LinkRowProps) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={[styles.rowIcon, { backgroundColor: toneBg, borderColor: tone }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && { color: c.red }]}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={destructive ? c.red : c.textLow} />
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────────────────
// SelectRow
// ──────────────────────────────────────────────────────────────────
interface SelectRowProps {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneBg: string;
  label: string;
  description?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function SelectRow({
  c,
  icon,
  tone,
  toneBg,
  label,
  description,
  options,
  value,
  onChange,
}: SelectRowProps) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.selectRow}>
      <View style={styles.row}>
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: toneBg, borderColor: tone },
          ]}
        >
          <Ionicons name={icon} size={18} color={tone} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          {description ? (
            <Text style={styles.rowDescription}>{description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.chipsRow}>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && {
                  borderColor: tone,
                  backgroundColor: toneBg,
                },
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: tone },
                ]}
              >
                {opt.label}
              </Text>
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color={tone} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────
// Theme-aware StyleSheet
// ──────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// MotivationsPicker — 🎯 Hedeflerin multi-select chip listesi
// Maks 3 hedef seçilebilir. Onboarding'deki yapıyla aynı görünüm.
// ─────────────────────────────────────────────────────────────────
function MotivationsPicker({
  c,
  t,
  selected,
  onToggle,
}: {
  c: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useT>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const styles = useMemo(() => makeStyles(c), [c]);
  const ps = motivationPickerStyles(c);

  return (
    <View style={ps.container}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
          <Ionicons name="flag" size={18} color={c.purpleLight} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{t('settings.sectionMotivation')}</Text>
          <Text style={styles.rowDescription}>{t('settings.motivationDesc')}</Text>
        </View>
      </View>

      <View style={ps.chipsRow}>
        {MOTIVATIONS_META.map((meta) => {
          const isSelected = selected.includes(meta.id);
          return (
            <Pressable
              key={meta.id}
              onPress={() => onToggle(meta.id)}
              style={({ pressed }) => [
                ps.chip,
                isSelected && {
                  borderColor: c.purple,
                  backgroundColor: c.purpleBg,
                },
                pressed && ps.chipPressed,
              ]}
            >
              <Text style={ps.chipEmoji}>{meta.emoji}</Text>
              <Text
                style={[
                  ps.chipLabel,
                  isSelected && { color: c.purpleLight },
                ]}
              >
                {t(meta.labelKey)}
              </Text>
              {isSelected ? (
                <Ionicons name="checkmark" size={14} color={c.purpleLight} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={ps.hint}>
        {selected.length === 0
          ? t('settings.motivationsEmpty')
          : t('settings.motivationsHint')}
      </Text>
    </View>
  );
}

function motivationPickerStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { paddingBottom: spacing.md },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.base,
      paddingTop: 0,
      paddingBottom: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      backgroundColor: c.glassBg,
    },
    chipPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
    chipEmoji: { fontSize: 14 },
    chipLabel: {
      ...textStyles.bodyBold,
      color: c.textMed,
      fontSize: 13,
    },
    hint: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 11,
      paddingHorizontal: spacing.base,
      textAlign: 'center',
    },
  });
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    bgGlow: {
      position: 'absolute',
      top: -60,
      right: -100,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: c.cyan,
      opacity: 0.06,
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
    backButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.95 }],
    },
    title: {
      ...textStyles.subheading,
      color: c.textHigh,
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: spacing.base,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      ...textStyles.label,
      color: c.textLow,
      paddingHorizontal: spacing.xs,
    },
    sectionCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: c.glassHighlight,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
    },
    rowPressed: { opacity: 0.7 },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 15,
    },
    rowDescription: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 12,
    },
    selectRow: {
      gap: 0,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.md,
      paddingTop: 0,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      backgroundColor: c.glassBg,
    },
    chipPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
    },
    chipText: {
      ...textStyles.bodyBold,
      color: c.textMed,
      fontSize: 13,
    },
    aboutCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      borderRadius: radius.lg,
      padding: spacing.base,
      overflow: 'hidden',
    },
    aboutText: {
      flex: 1,
      gap: 2,
    },
    aboutTitle: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 16,
    },
    aboutDescription: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 12,
    },
    aboutDisclaimer: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 6,
    },
  });
}
