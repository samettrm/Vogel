import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { radius, shadows, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { SegmentedRing } from './SegmentedRing';

export type LessonNodeState = 'completed' | 'current' | 'locked';

interface LessonNodeProps {
  state: LessonNodeState;
  totalExercises: number;
  correctCount: number;
  wrongCount: number;
  onPress: () => void;
}

const NODE_SIZE = 76;
const RING_SIZE = 104;
const RING_THICKNESS = 5;

export function LessonNode({
  state,
  totalExercises,
  correctCount,
  wrongCount,
  onPress,
}: LessonNodeProps) {
  return (
    <LessonNodeImpl
      state={state}
      totalExercises={totalExercises}
      correctCount={correctCount}
      wrongCount={wrongCount}
      onPress={onPress}
    />
  );
}

const LessonNodeImpl = React.memo(function LessonNodeInner({
  state,
  totalExercises,
  correctCount,
  wrongCount,
  onPress,
}: LessonNodeProps) {
  const c = useThemeColors();
  const isLocked = state === 'locked';
  const isCurrent = state === 'current';
  const isCompleted = state === 'completed';

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!isCurrent) return;
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
  }, [isCurrent, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isCurrent ? pulse.value : 1 }],
  }));

  const handlePress = useCallback(() => {
    if (isLocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  }, [isLocked, onPress]);

  const surfaceColor = isLocked ? c.locked : c.neon;
  const iconName: keyof typeof Ionicons.glyphMap = isLocked
    ? 'lock-closed'
    : isCompleted ? 'checkmark' : 'play';
  const iconColor = isLocked ? c.lockedIcon : c.textOnNeon;

  const styles = makeStyles(c);

  return (
    <View style={styles.wrapper}>
      {isCurrent && <StartBubble c={c} />}

      {!isLocked && (
        <SegmentedRing
          size={RING_SIZE}
          thickness={RING_THICKNESS}
          total={Math.max(1, totalExercises)}
          correct={correctCount}
          wrong={wrongCount}
          isCurrent={isCurrent}
        />
      )}

      <Animated.View style={[styles.nodeAnimWrap, pulseStyle]}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.node,
            { backgroundColor: surfaceColor },
            isCurrent && shadows.glowPrimary,
            isCompleted && shadows.glowPrimarySoft,
            isLocked && styles.nodeLocked,
            pressed && !isLocked && styles.nodePressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLocked }}
        >
          <Ionicons name={iconName} size={32} color={iconColor} />
        </Pressable>
      </Animated.View>
    </View>
  );
});

function StartBubble({ c }: { c: ReturnType<typeof useThemeColors> }) {
  const t = useT();
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));
  const styles = makeStyles(c);

  return (
    <Animated.View style={[styles.bubbleContainer, bobStyle]}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{t('common.start')}</Text>
      </View>
      <View style={styles.bubbleTriangle} />
    </Animated.View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    wrapper: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
    nodeAnimWrap: { width: NODE_SIZE, height: NODE_SIZE },
    node: {
      width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
      justifyContent: 'center', alignItems: 'center',
    },
    nodeLocked: { borderWidth: 1, borderColor: c.lockedBorder },
    nodePressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
    bubbleContainer: { position: 'absolute', top: -52, alignItems: 'center', zIndex: 10 },
    bubble: {
      backgroundColor: c.neon,
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.md,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
    },
    bubbleText: { ...textStyles.caption, color: c.textOnNeon, fontSize: 12 },
    bubbleTriangle: {
      width: 0, height: 0,
      borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 7,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      borderTopColor: c.neon, marginTop: -1,
    },
  });
}
