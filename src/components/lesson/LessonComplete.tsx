import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buttonShadowOffset,
  colors,
  radius,
  spacing,
  textStyles,
} from '../../theme';
import { playSound } from '../../utils/sounds';
import { Confetti } from '../Confetti';

type LessonCompleteProps = {
  xpEarned: number;
  correctCount: number;
  totalExercises: number;
  heartsRemaining: number;
  maxHearts: number;
  onContinue: () => void;
  isUnitComplete?: boolean;
};

async function fireCelebrationHaptics(isUnitComplete: boolean) {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await new Promise((resolve) => setTimeout(resolve, 160));
    await Haptics.impactAsync(
      isUnitComplete
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium,
    );

    if (isUnitComplete) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      await new Promise((resolve) => setTimeout(resolve, 220));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {
    // Haptics desteklenmeyen cihazlarda uygulama çökmesin.
  }
}

export function LessonComplete({
  xpEarned,
  correctCount,
  totalExercises,
  heartsRemaining,
  maxHearts,
  onContinue,
  isUnitComplete = false,
}: LessonCompleteProps) {
  const insets = useSafeAreaInsets();

  const accuracy =
    totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;

  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    fireCelebrationHaptics(isUnitComplete);
    playSound(isUnitComplete ? 'unitComplete' : 'lessonComplete');

    scale.value = withSequence(
      withTiming(isUnitComplete ? 1.25 : 1.15, {
        duration: isUnitComplete ? 500 : 380,
        easing: Easing.out(Easing.back(2)),
      }),
      withTiming(1, { duration: 250 }),
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(isUnitComplete ? -10 : -6, {
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(isUnitComplete ? 10 : 6, {
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      true,
    );
  }, [scale, rotate, isUnitComplete]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const iconName = isUnitComplete ? 'trophy' : 'star';
  const iconBg = isUnitComplete ? colors.primary : colors.accent;
  const iconBgDark = isUnitComplete ? colors.primaryDark : colors.warning;
  const titleText = isUnitComplete ? 'Ünite Tamamlandı!' : 'Ders Tamamlandı!';
  const subtitleText = isUnitComplete ? 'Yeni bir bölüm açıldı 🎉' : 'Harika iş çıkardın';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 24) + spacing.xl,
        },
      ]}
    >
      <Confetti origin="top" />

      <View style={styles.celebration}>
        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: iconBg, borderBottomColor: iconBgDark },
            iconAnimStyle,
          ]}
        >
          <Ionicons name={iconName} size={64} color={colors.white} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.title}
        >
          {titleText}
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(280).duration(400)}
          style={styles.subtitle}
        >
          {subtitleText}
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(420).duration(420)}
        style={styles.statsRow}
      >
        <StatCard
          label="TOPLAM XP"
          value={`${xpEarned}`}
          icon="flash"
          tone={colors.accent}
          toneDark={colors.warning}
        />

        <StatCard
          label="DOĞRULUK"
          value={`${accuracy}%`}
          icon="checkmark-circle"
          tone={colors.primary}
          toneDark={colors.primaryDark}
        />

        <StatCard
          label="CAN"
          value={`${heartsRemaining}/${maxHearts}`}
          icon="heart"
          tone={colors.error}
          toneDark={colors.redDark}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(400)}
        style={styles.buttonWrapper}
      >
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              borderBottomColor: colors.primaryDark,
              transform: [{ translateY: pressed ? buttonShadowOffset : 0 }],
              borderBottomWidth: pressed ? 0 : buttonShadowOffset,
            },
          ]}
        >
          <Text style={styles.buttonText}>DEVAM</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone: string;
  toneDark: string;
};

function StatCard({ label, value, icon, tone, toneDark }: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: toneDark, backgroundColor: tone }]}>
      <View style={styles.cardLabelRow}>
        <Ionicons name={icon} size={14} color={colors.white} />
        <Text style={styles.cardLabel}>{label}</Text>
      </View>

      <View style={styles.cardValueBox}>
        <Text style={[styles.cardValue, { color: toneDark }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xxl,
    justifyContent: 'space-between',
  },
  celebration: {
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
  },
  title: {
    ...textStyles.display,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    minHeight: 96,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cardLabel: {
    ...textStyles.caption,
    color: colors.white,
    fontSize: 11,
  },
  cardValueBox: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  cardValue: {
    ...textStyles.heading,
    fontSize: 22,
  },
  buttonWrapper: {
    paddingHorizontal: spacing.xs,
  },
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...textStyles.button,
    color: colors.white,
    fontSize: 18,
  },
});