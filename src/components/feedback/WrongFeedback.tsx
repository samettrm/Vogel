import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface WrongFeedbackProps {
  correctAnswer: string;
  onContinue: () => void;
}

function WrongFeedbackImpl({ correctAnswer, onContinue }: WrongFeedbackProps) {
  const c = useThemeColors();
  const t = useT();
  const panelX = useSharedValue(0);

  useEffect(() => {
    panelX.value = withSequence(
      withTiming(-8, { duration: 55 }),
      withTiming(8, { duration: 60 }),
      withTiming(-5, { duration: 55 }),
      withTiming(0, { duration: 50 }),
    );
  }, [panelX]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panelX.value }],
  }));
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15).stiffness(200)}
      style={[styles.panel, panelStyle]}
    >
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="close" size={24} color={c.white} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{t('lesson.wrong')}</Text>
          {correctAnswer.length > 0 ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {t('lesson.wrongAnswer')} <Text style={styles.correctHighlight}>{correctAnswer}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
      </Pressable>
    </Animated.View>
  );
}

export const WrongFeedback = React.memo(WrongFeedbackImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    panel: {
      backgroundColor: c.wrongBg,
      borderWidth: 1, borderColor: c.red,
      borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.lg, paddingBottom: spacing.lg,
      gap: spacing.base, overflow: 'hidden',
      shadowColor: c.red, shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.red,
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 10, elevation: 6,
    },
    textCol: { flex: 1, gap: 2 },
    title: { ...textStyles.subheading, color: '#FB7185' },
    subtitle: { ...textStyles.body, color: c.textMed, fontSize: 13 },
    correctHighlight: { ...textStyles.bodyBold, color: '#FB7185', fontSize: 13 },
    continueButton: {
      minHeight: 52, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.red,
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 12, elevation: 6,
    },
    continueButtonText: { ...textStyles.button, color: c.white },
    pressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  });
}
