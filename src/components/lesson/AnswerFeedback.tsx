import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { dark, radius, spacing, textStyles } from '../../theme';

// ════════════════════════════════════════════════════════════════
// ANSWER FEEDBACK (Dark / Neon)
// Cevap sonrası alttan açılan panel. Doğru → neon yeşil. Yanlış →
// kırmızı + doğru cevap metni. Props kontratı korundu.
// ════════════════════════════════════════════════════════════════

type AnswerFeedbackProps = {
  isCorrect: boolean;
  correctAnswer: string;
  onContinue: () => void;
};

export function AnswerFeedback({
  isCorrect,
  correctAnswer,
  onContinue,
}: AnswerFeedbackProps) {
  // Renk paleti — duruma göre
  const accent = isCorrect ? dark.neon : dark.red;
  const accentLight = isCorrect ? dark.neonLight : '#FB7185';
  const bg = isCorrect ? dark.correctBg : dark.wrongBg;
  const glow = isCorrect ? dark.neonGlow : dark.redGlow;
  const onAccentText = isCorrect ? dark.textOnNeon : dark.white;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(140)}
      style={[
        styles.container,
        { backgroundColor: bg, borderColor: accent },
      ]}
    >
      {/* Üst parlak çizgi — cam efekti */}
      <View style={styles.topHighlight} pointerEvents="none" />

      <View style={styles.row}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: accent, shadowColor: glow },
          ]}
        >
          <Ionicons
            name={isCorrect ? 'checkmark' : 'close'}
            size={24}
            color={onAccentText}
          />
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.title, { color: accentLight }]}>
            {isCorrect ? 'Harika!' : 'Yanlış'}
          </Text>
          {!isCorrect && correctAnswer.length > 0 ? (
            <Text style={styles.correctAnswer} numberOfLines={2}>
              Doğru cevap:{' '}
              <Text style={[styles.correctAnswerHighlight, { color: accentLight }]}>
                {correctAnswer}
              </Text>
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [
          styles.continueButton,
          { backgroundColor: accent, shadowColor: glow },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Devam et"
      >
        <Text style={[styles.continueButtonText, { color: onAccentText }]}>
          DEVAM
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    gap: spacing.base,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 1,
    backgroundColor: dark.glassHighlight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...textStyles.subheading,
  },
  correctAnswer: {
    ...textStyles.body,
    color: dark.textMed,
    fontSize: 14,
  },
  correctAnswerHighlight: {
    ...textStyles.bodyBold,
    fontSize: 14,
  },
  continueButton: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    ...textStyles.button,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
});
