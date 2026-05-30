import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from '../../utils/haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { LanguageSwitcherModal } from './LanguageSwitcherModal';
// ════════════════════════════════════════════════════════════════
// TOP STATUS BAR — Ana sayfa üst bilgi şeridi
//
// Tek grup pill içinde dikey ayraçlarla 3 sayaç:
//   🔥 Alev   → STREAK (günlük seri sayısı). Tıklayınca profile sekmesi.
//   ❤️ Kalp   → CAN sayısı (max 5, premium ise ∞ neon).
//   ⚡ Şimşek → TOPLAM XP.
// ════════════════════════════════════════════════════════════════

const FLAG_BY_LANG: Record<string, string> = {
  tr: '🇹🇷', de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹',
};

export function TopStatusBar() {
  const c = useThemeColors();
  const router = useRouter();
  const [langSwitcherVisible, setLangSwitcherVisible] = useState(false);

  const xp       = useUserStore((s) => s.xp);
  const hearts   = useUserStore((s) => s.hearts);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const streak   = useUserStore((s) => s.streak);
  const activeCourse = useUserStore((s) => s.activeCourse);
  const targetFlag = FLAG_BY_LANG[activeCourse.target] ?? '🌐';

  const openLanguageSwitcher = () => {
    Haptics.selectionAsync().catch(() => {});
    setLangSwitcherVisible(true);
  };

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  const goToProfile = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/profile');
  };

  const goToHearts = () => {
    Haptics.selectionAsync().catch(() => {});
    if (!isPremium && hearts <= 0) {
      router.push('/NoHeartsScreen');
    } else if (!isPremium) {
      router.push('/(tabs)/shop');
    }
  };

  const heartIconColor  = isPremium ? c.neon : hearts > 0 ? c.red : c.textMuted;
  const heartTextColor  = isPremium ? c.neon : hearts === 0 ? c.textMuted : c.textHigh;

  return (
    <View style={styles.container}>
      {/* Bayrak — tıklayınca dil seçim modalı açılır */}
      <Pressable
        onPress={openLanguageSwitcher}
        style={({ pressed }) => [styles.flagBtn, pressed && styles.flagBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Dil seç"
      >
        <Text style={styles.flag}>{targetFlag}</Text>
        <Ionicons name="chevron-down" size={12} color={c.textMed} style={{ marginLeft: 2 }} />
      </Pressable>

      {/* Dil seçim modalı */}
      <LanguageSwitcherModal
        visible={langSwitcherVisible}
        onClose={() => setLangSwitcherVisible(false)}
      />

      {/* ─── Tek grup pill: 🔥 | ❤️ | ⚡ ─── */}
      <View style={styles.group}>
        {/* 🔥 Streak */}
        <Pressable
          onPress={goToProfile}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        >
          <Ionicons name="flame" size={17} color={streak > 0 ? c.gold : c.textMuted} />
          <Text style={[styles.itemText, streak === 0 && styles.itemTextDim]}>{streak}</Text>
        </Pressable>

        <View style={styles.sep} />

        {/* ❤️ Hearts — premium ise ∞ neon */}
        <Pressable
          onPress={!isPremium ? goToHearts : undefined}
          style={({ pressed }) => [styles.item, !isPremium && pressed && styles.itemPressed]}
        >
          <Ionicons name="heart" size={17} color={heartIconColor} />
          <Text style={[styles.itemText, { color: heartTextColor }]}>
            {isPremium ? '∞' : hearts}
          </Text>
        </Pressable>

        <View style={styles.sep} />

        {/* ⚡ XP */}
        <View style={styles.item}>
          <Ionicons name="flash" size={17} color={c.neon} />
          <Text style={styles.itemText}>{xp}</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      backgroundColor: c.bg,
    },
    // Bayrak butonu — minimal pill, chevron-down ile dropdown belirtisi
    flagBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.glassBg,
    },
    flagBtnPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
    flag: { fontSize: 20 },
    // Tek grup pill — üç sayaç bir arada
    group: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    // Her sayaç öğesi
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    itemPressed: { backgroundColor: c.surface },
    itemText: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    itemTextDim: { color: c.textMuted },
    // Dikey ayraç
    sep: {
      width: 1,
      height: 16,
      backgroundColor: c.divider,
    },
  });
}
