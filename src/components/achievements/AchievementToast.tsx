import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeOutUp,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/useUserStore';
import { getAchievementById } from '../../data/achievements';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// ACHIEVEMENT TOAST — Yeni rozet açıldığında üstten kayar
// 3.5 saniye sonra otomatik kapanır + dokunmayla erken kapanır
//
// 🚀 PERF: İki katmanlı yapı — recentlyUnlocked null ise sadece
// ana wrapper render olur (tek store selector), iç toast hook'ları
// ÇALIŞMAZ. Eski versiyonda useSharedValue + useAnimatedStyle + useEffect
// sürekli mount'ta tetikleniyordu.
// ════════════════════════════════════════════════════════════════

const AUTO_DISMISS_MS = 3500;

export function AchievementToast() {
  const recentlyUnlocked = useUserStore((s) => s.recentlyUnlocked);
  if (!recentlyUnlocked) return null;
  return <AchievementToastInner achievementId={recentlyUnlocked} />;
}

function AchievementToastInner({ achievementId }: { achievementId: string }) {
  const c = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const dismiss = useUserStore((s) => s.dismissRecentlyUnlocked);

  const glow = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      ),
      -1, true,
    );

    const tt = setTimeout(() => { dismiss(); }, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(tt);
      // 🚀 PERF: Cleanup — worklet'in arka planda CPU yakmaya devam etmesini engelle
      cancelAnimation(glow);
    };
  }, [dismiss, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glow.value * 0.5,
    shadowRadius: 12 + glow.value * 10,
  }));

  const ach = getAchievementById(achievementId);
  if (!ach) return null;

  const accentColor =
    ach.color === 'gold' ? c.gold
    : ach.color === 'purple' ? c.purple
    : ach.color === 'cyan' ? c.cyan
    : c.neon;

  const styles = makeStyles(c, accentColor);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15).stiffness(180)}
      exiting={FadeOutUp.duration(220)}
      style={[styles.wrap, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.toast, glowStyle]}>
        <Pressable onPress={dismiss} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={ach.iconName as keyof typeof Ionicons.glyphMap} size={28} color={accentColor} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.label}>{t('achievements.newUnlock')}</Text>
            <Text style={styles.title} numberOfLines={1}>{t(ach.titleKey)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textLow} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>, accent: string) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.base,
      right: spacing.base,
      zIndex: 999,
    },
    toast: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: accent,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 12,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconWrap: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1, borderColor: accent,
      alignItems: 'center', justifyContent: 'center',
    },
    textCol: { flex: 1 },
    label: { ...textStyles.caption, color: c.textLow, fontSize: 10, letterSpacing: 1 },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
  });
}
