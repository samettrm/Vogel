import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

interface CorrectFeedbackProps {
  onContinue: () => void;
}

function CorrectFeedbackImpl({ onContinue }: CorrectFeedbackProps) {
  const c = useThemeColors();
  const t = useT();
  const styles = makeStyles(c);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(13).stiffness(220)}
      style={styles.panel}
    >
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={24} color={c.textOnNeon} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{t('lesson.correct')}</Text>
          <Text style={styles.subtitle}>{t('lesson.correctKeepGoing')}</Text>
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

export const CorrectFeedback = React.memo(CorrectFeedbackImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    panel: {
      backgroundColor: c.correctBg,
      borderWidth: 1, borderColor: c.neon,
      borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.lg, paddingBottom: spacing.lg,
      gap: spacing.base, overflow: 'hidden',
      shadowColor: c.neon, shadowOffset: { width: 0, height: -4 },
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
      backgroundColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 10, elevation: 6,
    },
    textCol: { flex: 1, gap: 2 },
    title: { ...textStyles.subheading, color: c.neonLight },
    subtitle: { ...textStyles.body, color: c.textMed, fontSize: 13 },
    continueButton: {
      minHeight: 52, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 14, elevation: 8,
    },
    continueButtonText: { ...textStyles.button, color: c.textOnNeon },
    pressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  });
}
