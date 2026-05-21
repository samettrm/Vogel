import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';
import type { Exercise } from '../../types';

type MultipleChoiceExerciseData = Extract<Exercise, { type: 'multipleChoice' }>;

// Soru metnindeki ilk tırnak içi kelimeyi yakalar — örn '"Hallo" ne demek?' → 'Hallo'.
// Bu, çoktan seçmeli egzersizin tanıttığı Almanca kelimedir.
function parseQuizWord(question: string): string | null {
  const m = question.match(/"([^"]+)"/);
  return m ? m[1] : null;
}

type Props = {
  exercise: MultipleChoiceExerciseData;
  selectedOptionId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
};

function MultipleChoiceExerciseImpl({
  exercise, selectedOptionId, disabled, onSelect,
}: Props) {
  const c = useThemeColors();
  const t = useT();

  // 🎲 Mevcut 4 option'dan correct + 2 random yanlış → toplam 3 şık
  // (Kullanıcı talebi: ders içinde 3'er şık olsun, 4'er adet değil)
  const shuffledOptions = useMemo(() => {
    const correct = exercise.options.find((o) => o.id === exercise.correctOptionId);
    const wrongs = exercise.options.filter((o) => o.id !== exercise.correctOptionId);
    const shuffledWrongs = [...wrongs].sort(() => Math.random() - 0.5).slice(0, 2);
    const pool = correct ? [correct, ...shuffledWrongs] : shuffledWrongs;
    return pool.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  // 🆕 "YENİ" rozeti — bu egzersizin tanıttığı kelime kullanıcıya ilk kez
  // gösteriliyorsa true. Mount anında bir kez hesaplanır (egzersiz boyunca sabit),
  // ardından kelime "görüldü" olarak işaretlenir → sonraki karşılaşmada rozet çıkmaz.
  const quizWord = useMemo(
    () => parseQuizWord(exercise.question),
    [exercise.question],
  );
  const [isNewWord] = useState(
    () => quizWord != null && !useUserStore.getState().seenWords.includes(quizWord),
  );
  useEffect(() => {
    if (isNewWord && quizWord) {
      useUserStore.getState().markWordSeen(quizWord);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = makeStyles(c);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('exercise.selectCorrect')}</Text>

      <View style={styles.questionCard}>
        <View style={styles.questionTopHighlight} pointerEvents="none" />
        {isNewWord ? (
          <View style={styles.newBadge}>
            <Ionicons name="sparkles" size={11} color={c.bg} />
            <Text style={styles.newBadgeText}>{t('exercise.newBadge')}</Text>
          </View>
        ) : null}
        <Text style={styles.questionText}>{exercise.question}</Text>
      </View>

      <View style={styles.options}>
        {shuffledOptions.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectOption = option.id === exercise.correctOptionId;
          const isWrongSelected = disabled && isSelected && !isCorrectOption;
          const shouldShowCorrect = disabled && isCorrectOption;

          const overlayStyle = shouldShowCorrect ? styles.correctCard
            : isWrongSelected ? styles.wrongCard
            : isSelected && !disabled ? styles.selectedCard
            : styles.unselectedCard;
          const textOverlay = shouldShowCorrect ? styles.correctText
            : isWrongSelected ? styles.wrongText
            : isSelected && !disabled ? styles.selectedText
            : styles.unselectedText;
          const badgeColor = shouldShowCorrect ? c.neon
            : isWrongSelected ? c.red
            : isSelected ? c.neon : c.textLow;

          return (
            <Pressable
              key={option.id}
              disabled={disabled}
              onPress={() => onSelect(option.id)}
              style={({ pressed }) => [
                styles.optionCard, overlayStyle,
                pressed && !disabled && styles.pressedCard,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
            >
              <View style={styles.cardTopHighlight} pointerEvents="none" />
              <View style={styles.optionInner}>
                <View
                  style={[
                    styles.numberBadge,
                    { borderColor: badgeColor },
                    (shouldShowCorrect || (isSelected && !disabled)) && { backgroundColor: badgeColor },
                    isWrongSelected && { backgroundColor: badgeColor },
                  ]}
                >
                  {shouldShowCorrect ? (
                    <Ionicons name="checkmark" size={14} color={c.textOnNeon} />
                  ) : isWrongSelected ? (
                    <Ionicons name="close" size={14} color={c.white} />
                  ) : isSelected ? (
                    <View style={styles.numberDot} />
                  ) : null /* Rakam başı kaldırıldı — boş kutu */}
                </View>
                <Text style={[styles.optionText, textOverlay]} numberOfLines={2}>
                  {option.text}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Render azaltma — props değişmedikçe re-render olmaz
export const MultipleChoiceExercise = React.memo(MultipleChoiceExerciseImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1, paddingHorizontal: spacing.base,
      paddingTop: spacing.lg, gap: spacing.lg,
    },
    label: { ...textStyles.label, color: c.textLow },
    questionCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden',
    },
    questionTopHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    questionText: { ...textStyles.heading, color: c.textHigh, fontSize: 26, lineHeight: 32 },
    newBadge: {
      position: 'absolute', top: 0, right: 0,
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: c.gold,
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderBottomLeftRadius: radius.md,
    },
    newBadgeText: {
      ...textStyles.caption, color: c.bg,
      fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
    },
    options: { gap: spacing.md },
    optionCard: {
      minHeight: 64, borderRadius: radius.lg, borderWidth: 1.5,
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
      justifyContent: 'center', overflow: 'hidden',
    },
    cardTopHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    unselectedCard: { backgroundColor: c.glassBg, borderColor: c.glassBorderStrong },
    selectedCard: {
      backgroundColor: c.neonBg, borderColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
    },
    correctCard: {
      backgroundColor: c.correctBg, borderColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
    },
    wrongCard: {
      backgroundColor: c.wrongBg, borderColor: c.red,
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
    },
    pressedCard: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    optionInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    numberBadge: {
      width: 28, height: 28, borderRadius: 8, borderWidth: 1.5,
      backgroundColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
    },
    numberBadgeText: { ...textStyles.caption, color: c.textLow, fontSize: 12 },
    numberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.textOnNeon },
    optionText: { ...textStyles.bodyBold, flex: 1, fontSize: 16 },
    unselectedText: { color: c.textHigh },
    selectedText: { color: c.neonLight },
    correctText: { color: c.neonLight },
    wrongText: { color: '#FB7185' },
  });
}
