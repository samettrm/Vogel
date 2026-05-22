import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { ACHIEVEMENTS } from '../../data/achievements';

// ════════════════════════════════════════════════════════════════
// TOP STATUS BAR — Ana sayfa üst bilgi şeridi
//
// İçindeki 4 sayaç:
//   🔥 Alev   → STREAK (günlük seri sayısı). Tıklayınca profile sekmesi.
//   ❤️ Kalp   → CAN sayısı (max 5, premium ise ∞).
//   💎 Elmas  → AÇILAN ROZET SAYISI ({unlocked}/{total}). Tıklayınca rozet ekranı.
//   ⚡ Şimşek → TOPLAM XP.
// ════════════════════════════════════════════════════════════════

const FLAG_BY_LANG: Record<string, string> = {
  tr: '🇹🇷', de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹',
};

export function TopStatusBar() {
  const c = useThemeColors();
  const router = useRouter();

  const xp = useUserStore((s) => s.xp);
  const hearts = useUserStore((s) => s.hearts);
  const isPremium = useUserStore((s) => (s as { isPremium?: boolean }).isPremium ?? false);
  const streak = useUserStore((s) => s.streak);
  const activeCourse = useUserStore((s) => s.activeCourse);
  const achievementsUnlocked = useUserStore((s) => s.achievementsUnlocked);

  const achievementCount = achievementsUnlocked.size;
  const totalAchievements = ACHIEVEMENTS.length;

  const targetFlag = FLAG_BY_LANG[activeCourse.target] ?? '🌐';
  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  const goToProfile = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/profile');
  };

  const goToAchievements = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/achievements');
  };

  const goToHearts = () => {
    Haptics.selectionAsync().catch(() => {});
    if (!isPremium && hearts <= 0) {
      router.push('/NoHeartsScreen');
    } else if (!isPremium) {
      router.push('/(tabs)/shop');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.flagButton}>
        <Text style={styles.flag}>{targetFlag}</Text>
      </Pressable>
      <View style={styles.counters}>
        <Counter
          c={c}
          icon="flame"
          color={streak > 0 ? c.gold : c.textMuted}
          value={streak}
          dimmed={streak === 0}
          onPress={goToProfile}
        />
        <Counter
          c={c}
          icon="heart"
          color={isPremium ? c.neon : hearts > 0 ? c.red : c.textMuted}
          value={hearts}
          label={isPremium ? '∞' : undefined}
          dimmed={!isPremium && hearts === 0}
          onPress={!isPremium ? goToHearts : undefined}
        />
        <Counter
          c={c}
          icon="diamond"
          color={c.cyan}
          value={achievementCount}
          suffix={`/${totalAchievements}`}
          onPress={goToAchievements}
        />
        <Counter c={c} icon="flash" color={c.neon} value={xp} />
      </View>
    </View>
  );
}

function Counter({
  c,
  icon,
  color,
  value,
  label,
  suffix,
  dimmed,
  onPress,
}: {
  c: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label?: string;
  suffix?: string;
  dimmed?: boolean;
  onPress?: () => void;
}) {
  // 🚀 PERF: useMemo — Counter 4 kez render oluyor, her seferinde StyleSheet.create önlenir
  const styles = useMemo(() => makeStyles(c), [c]);
  const isPressable = !!onPress;

  const content = (
    <>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.counterText, dimmed && styles.counterTextDim]}>
        {label ?? value}
        {suffix ? <Text style={styles.counterSuffix}>{suffix}</Text> : null}
      </Text>
    </>
  );

  if (isPressable) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.counter,
          // İşlevsel sayaçların kenarına hafif renk ver — tıklanabilir olduğu belli olsun
          { borderColor: color, opacity: dimmed ? 0.5 : 1 },
          pressed && styles.counterPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.counter, dimmed && { opacity: 0.5 }]}>{content}</View>;
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
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    flagButton: {
      width: 44, height: 36, borderRadius: radius.md,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    flag: { fontSize: 22 },
    counters: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    counter: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: spacing.sm, paddingVertical: 6,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.pill,
    },
    counterPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    counterText: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    counterTextDim: { color: c.textMuted },
    counterSuffix: { ...textStyles.body, color: c.textLow, fontSize: 11 },
  });
}
