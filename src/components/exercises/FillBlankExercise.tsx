import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { Exercise } from '../../types';

type FillBlankExerciseData = Extract<Exercise, { type: 'fillBlank' }>;

type Props = {
  exercise: FillBlankExerciseData;
  selectedWords: string[];
  disabled: boolean;
  onAddWord: (word: string) => void;
  onRemoveWordAt: (index: number) => void;
};

function FillBlankExerciseImpl({
  exercise, selectedWords, disabled, onAddWord, onRemoveWordAt,
}: Props) {
  const c = useThemeColors();
  const t = useT();
  const styles = makeStyles(c);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('exercise.fillBlank')}</Text>

      <View style={styles.promptCard}>
        <View style={styles.promptHighlight} pointerEvents="none" />
        <Text style={styles.prompt}>{exercise.prompt}</Text>
      </View>

      <View style={[styles.answerBox, selectedWords.length > 0 && styles.answerBoxFilled]}>
        {selectedWords.length === 0 ? (
          <Text style={styles.placeholder}>{t('exercise.yourAnswer')}</Text>
        ) : (
          selectedWords.map((word, index) => (
            <Animated.View key={`sel-${word}-${index}`} layout={Layout.springify()}>
              <Pressable
                disabled={disabled}
                onPress={() => onRemoveWordAt(index)}
                style={styles.selectedChip}
              >
                <Text style={styles.selectedChipText}>{word}</Text>
              </Pressable>
            </Animated.View>
          ))
        )}
      </View>

      <View style={styles.bank}>
        {exercise.wordBank.map((word, index) => {
          const alreadySelected = selectedWords.includes(word);
          return (
            <Animated.View key={`bank-${word}-${index}`} layout={Layout.springify()}>
              <Pressable
                disabled={disabled || alreadySelected}
                onPress={() => onAddWord(word)}
                style={({ pressed }) => [
                  styles.bankChip,
                  alreadySelected && styles.bankChipUsed,
                  pressed && !disabled && !alreadySelected && styles.bankChipPressed,
                ]}
              >
                <View style={styles.bankChipHighlight} pointerEvents="none" />
                <Text style={[styles.bankChipText, alreadySelected && styles.bankChipTextUsed]}>
                  {word}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export const FillBlankExercise = React.memo(FillBlankExerciseImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.lg },
    label: { ...textStyles.label, color: c.textLow },
    promptCard: {
      backgroundColor: c.glassBgStrong, borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden',
    },
    promptHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    prompt: { ...textStyles.heading, color: c.textHigh, fontSize: 24, lineHeight: 32 },
    answerBox: {
      minHeight: 72, borderRadius: radius.md, borderWidth: 1.5,
      borderColor: c.glassBorderStrong, backgroundColor: c.glassBg,
      padding: spacing.md,
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center',
    },
    answerBoxFilled: {
      borderColor: c.neon, backgroundColor: c.neonBg,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    placeholder: { ...textStyles.body, color: c.textMuted },
    selectedChip: {
      backgroundColor: c.neon, borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    selectedChipText: { ...textStyles.bodyBold, color: c.textOnNeon },
    bank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
    bankChip: {
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      overflow: 'hidden',
    },
    bankChipHighlight: {
      position: 'absolute', top: 0,
      left: spacing.sm, right: spacing.sm,
      height: 1, backgroundColor: c.glassHighlight,
    },
    bankChipPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    bankChipUsed: { opacity: 0.3 },
    bankChipText: { ...textStyles.bodyBold, color: c.textHigh },
    bankChipTextUsed: { color: c.textMuted },
  });
}
