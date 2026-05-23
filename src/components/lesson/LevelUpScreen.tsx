import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
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
import { useT } from '../../i18n';
import { Confetti } from '../feedback/Confetti';

// ════════════════════════════════════════════════════════════════
// LEVEL UP SCREEN
// Tema-aware + i18n. Standalone bileşen.
// ════════════════════════════════════════════════════════════════

interface LevelUpScreenProps {
  level: number;
  onContinue: () => void;
  subtitle?: string;
}

export function LevelUpScreen({ level, onContinue, subtitle }: LevelUpScreenProps) {
  const c = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();

  const badgeRotate = useSharedValue(-180);
  const badgeScale = useSharedValue(0);
  const numberScale = useSharedValue(0.6);
  const ringRotate = useSharedValue(0);
  const haloScale = useSharedValue(0.8);
  const haloOpacity = useSharedValue(0);

  useEffect(() => {
    (async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise((r) => setTimeout(r, 150));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    })();

    badgeRotate.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    badgeScale.value = withSpring(1, { damping: 10, stiffness: 130 });

    numberScale.value = withDelay(
      400,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 150 }),
        withRepeat(
          withSequence(
            withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          ),
          -1, true,
        ),
      ),
    );

    ringRotate.value = withDelay(
      300,
      withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false),
    );

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
      cancelAnimation(badgeRotate);
      cancelAnimation(badgeScale);
      cancelAnimation(numberScale);
      cancelAnimation(ringRotate);
      cancelAnimation(haloScale);
    };
  }, [badgeRotate, badgeScale, numberScale, ringRotate, haloScale, haloOpacity]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${badgeRotate.value}deg` },
      { scale: badgeScale.value },
    ],
  }));
  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + spacing.xl }]}>
      <Confetti
        count={36}
        origin="top"
        fullScreen
        baseDuration={2200}
        colors={[c.purple, c.purpleLight, c.neon, c.gold, '#FB7185']}
      />

      <View style={styles.bgGlow} pointerEvents="none" />

      <View style={styles.center}>
        <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />

        <Animated.View style={[styles.spinRing, ringStyle]} pointerEvents="none">
          {[0, 90, 180, 270].map((angle) => (
            <View
              key={angle}
              style={[
                styles.ringDot,
                { transform: [{ rotate: `${angle}deg` }, { translateY: -SPIN_RING_RADIUS }] },
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.badge, badgeStyle]}>
          <View style={styles.badgeInner}>
            <Ionicons name="star" size={32} color={c.gold} />
            <Animated.Text style={[styles.levelNumber, numberStyle]}>
              {level}
            </Animated.Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.title}
        >
          {t('levelUp.title')}
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(450).duration(400)}
          style={styles.subtitle}
        >
          {subtitle ?? t('levelUp.subtitle', { n: level })}
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(700).duration(400)}
        style={styles.buttonWrap}
      >
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>{t('levelUp.continue')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const BADGE_SIZE = 140;
const HALO_SIZE = 220;
const SPIN_RING_SIZE = 200;
const SPIN_RING_RADIUS = SPIN_RING_SIZE / 2;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1, backgroundColor: c.bg,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.xxxl,
      justifyContent: 'space-between',
    },
    bgGlow: {
      position: 'absolute', top: -60,
      alignSelf: 'center',
      width: 360, height: 360, borderRadius: 180,
      backgroundColor: c.purple, opacity: 0.1,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
    halo: {
      position: 'absolute',
      width: HALO_SIZE, height: HALO_SIZE, borderRadius: HALO_SIZE / 2,
      backgroundColor: c.purpleBg,
      borderWidth: 2, borderColor: c.purple,
    },
    spinRing: {
      position: 'absolute',
      width: SPIN_RING_SIZE, height: SPIN_RING_SIZE,
      alignItems: 'center', justifyContent: 'center',
    },
    ringDot: {
      position: 'absolute',
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1, shadowRadius: 8, elevation: 8,
    },
    badge: {
      width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE / 2,
      backgroundColor: c.purple,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.purple, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8, shadowRadius: 28, elevation: 14,
      borderWidth: 3, borderColor: c.purpleLight,
    },
    badgeInner: { alignItems: 'center', justifyContent: 'center', gap: 4 },
    levelNumber: { ...textStyles.display, color: c.white, fontSize: 48 },
    title: {
      ...textStyles.display, color: c.purpleLight,
      fontSize: 36, letterSpacing: 2,
      marginTop: spacing.xl,
      textShadowColor: c.purpleGlow,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
    },
    subtitle: { ...textStyles.body, color: c.textMed, textAlign: 'center' },
    buttonWrap: { paddingHorizontal: spacing.xs },
    continueButton: {
      minHeight: 56, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 16, elevation: 10,
    },
    continueButtonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 18 },
    pressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  });
}
