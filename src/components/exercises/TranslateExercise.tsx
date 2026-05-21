import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { Exercise } from '../../types';

type TranslateExerciseData = Extract<Exercise, { type: 'translate' }>;

type Props = {
  exercise: TranslateExerciseData;
  selectedWords: string[];
  disabled: boolean;
  onAddWord: (word: string) => void;
  onRemoveWordAt: (index: number) => void;
  labelText?: string;
  // 📦 Listen exercise'tan gönderildiğinde prompt'ı küçük göster (büyük başlık kartı yerine)
  compactPrompt?: boolean;
  // 🌐 Cevap kontrol edildiğinde "Türkçesi: ..." satırını göster (anlam bütünlüğü)
  translationText?: string;
};

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ').trim();
}

function TranslateExerciseImpl({
  exercise, selectedWords, disabled, onAddWord, onRemoveWordAt, labelText,
  compactPrompt, translationText,
}: Props) {
  const c = useThemeColors();
  const t = useT();

  const remainingWords = useMemo(() => {
    const filtered = exercise.wordBank.filter((word, index) => {
      const selectedCount = selectedWords.filter((sw) => sw === word).length;
      const previousSameWords = exercise.wordBank.slice(0, index).filter((bw) => bw === word).length;
      return previousSameWords >= selectedCount;
    });
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [exercise.wordBank, selectedWords]);

  const selectedSentence = selectedWords.join(' ');
  const isCorrect = disabled && selectedWords.length > 0 &&
    normalizeText(selectedSentence) === normalizeText(exercise.correctAnswer);
  const isWrong = disabled && selectedWords.length > 0 &&
    normalizeText(selectedSentence) !== normalizeText(exercise.correctAnswer);

  const styles = makeStyles(c);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{labelText ?? t('exercise.translate')}</Text>

      {compactPrompt ? null : (
        <View style={styles.promptCard}>
          <View style={styles.promptHighlight} pointerEvents="none" />
          <Text style={styles.prompt}>{exercise.prompt}</Text>
        </View>
      )}

      <View
        style={[
          styles.answerStrip,
          isCorrect && styles.answerStripCorrect,
          isWrong && styles.answerStripWrong,
        ]}
      >
        <View style={styles.stripLineTop} />
        <View style={styles.stripContent}>
          {selectedWords.length === 0 ? (
            <Text style={styles.placeholder}>{t('exercise.tapHint')}</Text>
          ) : (
            selectedWords.map((word, index) => (
              <Animated.View key={`sel-${word}-${index}`} layout={Layout.springify()}>
                <Pressable
                  disabled={disabled}
                  onPress={() => onRemoveWordAt(index)}
                  style={[
                    styles.selectedChip,
                    isCorrect && styles.selectedChipCorrect,
                    isWrong && styles.selectedChipWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectedChipText,
                      isCorrect && styles.selectedChipTextCorrect,
                      isWrong && styles.selectedChipTextWrong,
                    ]}
                  >{word}</Text>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>
        <View style={styles.stripLineBottom} />
      </View>

      {/* 🌐 Türkçe çeviri — sadece cevap kontrol edildikten sonra (disabled) görünür */}
      {disabled && translationText ? (
        <View style={styles.translationRow}>
          <Text style={styles.translationLabel}>{t('exercise.meaning')}:</Text>
          <Text style={styles.translationText}>{translationText}</Text>
        </View>
      ) : null}

      <View style={styles.bank}>
        {remainingWords.map((word, index) => (
          <Animated.View key={`bank-${word}-${index}`} layout={Layout.springify()}>
            <Pressable
              disabled={disabled}
              onPress={() => onAddWord(word)}
              style={({ pressed }) => [
                styles.bankChip,
                pressed && !disabled && styles.bankChipPressed,
              ]}
            >
              <View style={styles.bankChipHighlight} pointerEvents="none" />
              <Text style={styles.bankChipText}>{word}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export const TranslateExercise = React.memo(TranslateExerciseImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.lg },
    label: { ...textStyles.label, color: c.textLow },
    promptCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden',
    },
    promptHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    prompt: { ...textStyles.heading, color: c.textHigh, fontSize: 26, lineHeight: 32 },
    answerStrip: { minHeight: 110, paddingVertical: spacing.md, borderRadius: radius.md },
    answerStripCorrect: { backgroundColor: c.correctBg },
    answerStripWrong: { backgroundColor: c.wrongBg },
    stripLineTop: { height: 1, backgroundColor: c.divider, marginBottom: spacing.sm },
    stripLineBottom: { height: 1, backgroundColor: c.divider, marginTop: spacing.sm },
    stripContent: {
      flexDirection: 'row', flexWrap: 'wrap',
      gap: spacing.sm, paddingHorizontal: spacing.sm, minHeight: 40,
    },
    placeholder: { ...textStyles.body, color: c.textMuted },
    selectedChip: {
      backgroundColor: c.neonBg, borderWidth: 1, borderColor: c.neon,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    selectedChipCorrect: { backgroundColor: c.neon, borderColor: c.neon },
    selectedChipWrong: { backgroundColor: c.red, borderColor: c.red },
    selectedChipText: { ...textStyles.bodyBold, color: c.neonLight },
    selectedChipTextCorrect: { color: c.textOnNeon },
    selectedChipTextWrong: { color: c.white },
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
    bankChipText: { ...textStyles.bodyBold, color: c.textHigh },
    // 🌐 Türkçe çeviri satırı (Listen exercise için)
    translationRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      flexWrap: 'wrap',
    },
    translationLabel: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 12,
    },
    translationText: {
      ...textStyles.body,
      color: c.textHigh,
      fontSize: 14,
      flex: 1,
    },
  });
}
