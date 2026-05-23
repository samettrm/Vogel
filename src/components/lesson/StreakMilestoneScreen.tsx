import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../utils/haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { Confetti } from '../feedback/Confetti';

// ════════════════════════════════════════════════════════════════
// STREAK MILESTONE SCREEN
//
// Belirli streak günlerine (3, 7, 14, 30, 60, 100, 180, 365) ulaşılınca
// özel kutlama ekranı gösterilir. Store'da `pendingStreakMilestone`
// transient state'i tetikleyici.
//
// Lesson screen'de LevelUpScreen yanına benzer şekilde mount edilir.
// ════════════════════════════════════════════════════════════════

interface StreakMilestoneScreenProps {
  streak: number;
  onContinue: () => void;
}

// Milestone'a göre özel metin + emoji
function getMilestoneText(streak: number): { title: string; subtitle: string; emoji: string } {
  switch (streak) {
    case 3:   return { title: '3 Günlük Seri!',       subtitle: 'Başlangıç güzel — devam et!',  emoji: '🔥' };
    case 7:   return { title: '1 Haftalık Seri!',     subtitle: 'Tam bir hafta — harikasın!',   emoji: '🏆' };
    case 14:  return { title: '2 Haftalık Seri!',     subtitle: 'İki haftaya ulaştın — devam!', emoji: '💪' };
    case 30:  return { title: '1 Aylık Efsane!',      subtitle: '30 gün — bu artık alışkanlık', emoji: '🚀' };
    case 60:  return { title: '2 Aylık Şampiyon!',    subtitle: 'İki ay! Disiplinin müthiş',    emoji: '🌟' };
    case 100: return { title: '100 Günlük Vizyoner!', subtitle: '100 gün — sen artık ustasın',   emoji: '👑' };
    case 180: return { title: '6 Aylık Devleşme!',    subtitle: 'Altı ay — bambaşka birisin',    emoji: '⚡' };
    case 365: return { title: '1 Yıllık Ustası!',     subtitle: 'Tam bir yıl — tarih yazıyorsun', emoji: '🎯' };
    default:  return { title: `${streak} Günlük Seri!`, subtitle: 'Devam et!', emoji: '🔥' };
  }
}

export function StreakMilestoneScreen({ streak, onContinue }: StreakMilestoneScreenProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const text = getMilestoneText(streak);

  // Animasyon shared values
  const flameRotate = useSharedValue(-25);
  const flameScale = useSharedValue(0);
  const numberScale = useSharedValue(0.6);
  const haloScale = useSharedValue(0.8);
  const haloOpacity = useSharedValue(0);

  useEffect(() => {
    // Haptic kutlama
    (async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise((r) => setTimeout(r, 150));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    })();

    // Alev: hafif rotate + scale-in
    flameRotate.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
    flameScale.value = withSpring(1, { damping: 9, stiffness: 130 });

    // Sayı: pop-in + sürekli pulse
    numberScale.value = withDelay(
      300,
      withSequence(
        withSpring(1.18, { damping: 8, stiffness: 150 }),
        withRepeat(
          withSequence(
            withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          ),
          -1, true,
        ),
      ),
    );

    // Halo: parlama
    haloOpacity.value = withDelay(150, withTiming(0.55, { duration: 400 }));
    haloScale.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, true,
      ),
    );

    return () => {
      cancelAnimation(flameRotate);
      cancelAnimation(flameScale);
      cancelAnimation(numberScale);
      cancelAnimation(haloScale);
      cancelAnimation(haloOpacity);
    };
  }, [flameRotate, flameScale, numberScale, haloScale, haloOpacity]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${flameRotate.value}deg` },
      { scale: flameScale.value },
    ],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.overlay}>
      {/* Confetti kutlama */}
      <Confetti origin="top" count={20} fullScreen baseDuration={1800} />

      <View style={[styles.container, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
        {/* Halo glow */}
        <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />

        {/* Alev ikonu */}
        <Animated.View style={[styles.flameWrap, flameStyle]}>
          <Text style={styles.flame}>{text.emoji}</Text>
        </Animated.View>

        {/* Streak sayısı (büyük) */}
        <Animated.View style={[styles.numberWrap, numberStyle]}>
          <Text style={styles.number}>{streak}</Text>
          <Text style={styles.numberLabel}>GÜN</Text>
        </Animated.View>

        {/* Başlık + alt başlık */}
        <View style={styles.textCol}>
          <Text style={styles.title}>{text.title}</Text>
          <Text style={styles.subtitle}>{text.subtitle}</Text>
        </View>

        {/* Devam butonu */}
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Devam et"
        >
          <Text style={styles.buttonText}>HARİKASIN, DEVAM!</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.bg,
      zIndex: 100,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.lg,
    },
    halo: {
      position: 'absolute',
      top: '20%',
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: c.gold,
      opacity: 0.3,
    },
    flameWrap: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flame: {
      fontSize: 110,
    },
    numberWrap: {
      alignItems: 'center',
      gap: 2,
    },
    number: {
      ...textStyles.display,
      fontSize: 72,
      color: c.gold,
      lineHeight: 78,
      textShadowColor: c.gold,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 14,
    },
    numberLabel: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 12,
      letterSpacing: 4,
    },
    textCol: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.base,
    },
    title: {
      ...textStyles.heading,
      color: c.textHigh,
      textAlign: 'center',
    },
    subtitle: {
      ...textStyles.body,
      color: c.textMed,
      textAlign: 'center',
      fontSize: 15,
    },
    button: {
      minWidth: '85%',
      minHeight: 56,
      borderRadius: radius.md,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 14,
      elevation: 8,
    },
    buttonPressed: {
      opacity: 0.92,
      transform: [{ translateY: 1 }],
    },
    buttonText: {
      ...textStyles.button,
      color: c.bg,
      fontSize: 15,
    },
  });
}
