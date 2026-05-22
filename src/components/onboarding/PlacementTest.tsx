import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import {
  PLACEMENT_QUESTIONS,
  calculatePlacementLevel,
  getPlacementBreakdown,
  type PlacementQuestion,
} from '../../data/placementQuestions';
import type { CEFRLevel } from '../../types';

// ════════════════════════════════════════════════════════════════
// PLACEMENT TEST COMPONENT
//
// 6 soruluk seviye belirleme testi.
// Adaptive değil — sıralı, A1 → B2'ye doğru zorlaşır.
// Sonunda calculatePlacementLevel ile seviye hesaplanır.
//
// PROPS:
//   - onComplete(level): test bitince çağrılır, seviyeyi parent'a iletir
//   - onCancel(): kullanıcı vazgeçtiğinde çağrılır
// ════════════════════════════════════════════════════════════════

interface PlacementTestProps {
  onComplete: (level: CEFRLevel) => void;
  onCancel: () => void;
}

export function PlacementTest({ onComplete, onCancel }: PlacementTestProps) {
  const c = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  // questionId → selectedIndex
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finalLevel, setFinalLevel] = useState<CEFRLevel | null>(null);

  const totalQuestions = PLACEMENT_QUESTIONS.length;
  const currentQuestion: PlacementQuestion | undefined = PLACEMENT_QUESTIONS[currentIndex];
  const progress = ((currentIndex + (selectedOption !== null ? 1 : 0)) / totalQuestions) * 100;

  const styles = useMemo(() => makeStyles(c), [c]);

  const handleSelect = (idx: number) => {
    if (selectedOption !== null) return;
    Haptics.selectionAsync().catch(() => {});
    setSelectedOption(idx);
  };

  const handleNext = () => {
    if (selectedOption === null || !currentQuestion) return;
    Haptics.selectionAsync().catch(() => {});

    const newAnswers = { ...answers, [currentQuestion.id]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 >= totalQuestions) {
      // Test bitti — sonucu hesapla
      const level = calculatePlacementLevel(newAnswers);
      setFinalLevel(level);
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ─── Sonuç ekranı ───
  if (showResult && finalLevel) {
    const breakdown = getPlacementBreakdown(answers);
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.resultHeader}>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>{finalLevel}</Text>
            </View>
            <Text style={styles.resultTitle}>Seviyen Belirlendi!</Text>
            <Text style={styles.resultSubtitle}>
              {finalLevel === 'A1' && 'Sıfırdan başlıyoruz — endişelenme, hızlı ilerleyeceksin.'}
              {finalLevel === 'A2' && 'Temel bilgin var — A2 seviyesinden başlıyoruz.'}
              {finalLevel === 'B1' && 'Orta seviyede başlıyorsun — gerçek konuşma zamanı.'}
              {finalLevel === 'B2' && 'İleri seviyede başlıyorsun — etkileyici!'}
            </Text>
          </Animated.View>

          {/* Tier breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Tier Bazında Skorların</Text>
            {breakdown.map((b) => (
              <View key={b.level} style={styles.breakdownRow}>
                <Text style={styles.breakdownLevel}>{b.level}</Text>
                <View style={styles.breakdownBarBg}>
                  <View
                    style={[
                      styles.breakdownBarFg,
                      { width: `${(b.correct / b.total) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownScore}>
                  {b.correct}/{b.total}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.resultActions}>
            <Pressable
              onPress={() => onComplete(finalLevel)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>{finalLevel} İLE DEVAM ET</Text>
              <Ionicons name="arrow-forward" size={18} color={c.textOnNeon} />
            </Pressable>
            <Pressable
              onPress={() => onComplete('A1')}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.secondaryButtonText}>{"A1'den (sıfırdan) başlamak istiyorum"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Soru ekranı ───
  if (!currentQuestion) return null;

  return (
    <View style={styles.container}>
      {/* Üst bar: progress + iptal */}
      <View style={styles.topBar}>
        <Pressable onPress={onCancel} hitSlop={8} style={styles.cancelButton}>
          <Ionicons name="close" size={22} color={c.textMed} />
        </Pressable>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.counter}>
          {currentIndex + 1}/{totalQuestions}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={`q-${currentQuestion.id}`}
          entering={FadeInRight.duration(280)}
          exiting={FadeOutLeft.duration(180)}
        >
          {/* Tier badge */}
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{currentQuestion.level} SEVİYESİ</Text>
          </View>

          {/* Soru kartı */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
            {currentQuestion.context ? (
              <Text style={styles.contextText}>{currentQuestion.context}</Text>
            ) : null}
          </View>

          {/* Seçenekler */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleSelect(idx)}
                  disabled={selectedOption !== null}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && !isSelected && styles.optionCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.optionBadge,
                      isSelected && styles.optionBadgeSelected,
                    ]}
                  >
                    {isSelected ? (
                      <View style={styles.optionDot} />
                    ) : (
                      <Text style={styles.optionBadgeText}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Alt: Devam butonu */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleNext}
          disabled={selectedOption === null}
          style={({ pressed }) => [
            styles.nextButton,
            selectedOption === null && styles.nextButtonDisabled,
            pressed && selectedOption !== null && styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.nextButtonText,
              selectedOption === null && { color: c.textLow },
            ]}
          >
            {currentIndex + 1 >= totalQuestions ? 'TESTİ BİTİR' : 'DEVAM'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={selectedOption === null ? c.textLow : c.textOnNeon}
          />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    cancelButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressBar: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.divider,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: c.neon,
      borderRadius: 3,
    },
    counter: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 12,
      minWidth: 36,
      textAlign: 'right',
    },

    scrollContent: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },

    tierBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: c.purpleBg,
      borderWidth: 1,
      borderColor: c.purple,
      borderRadius: radius.pill,
      marginBottom: spacing.md,
    },
    tierBadgeText: {
      ...textStyles.label,
      color: c.purpleLight,
      fontSize: 10,
      letterSpacing: 1,
    },

    questionCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    questionText: {
      ...textStyles.heading,
      color: c.textHigh,
      fontSize: 22,
      lineHeight: 28,
    },
    contextText: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 13,
      fontStyle: 'italic',
    },

    optionsList: { gap: spacing.sm },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.glassBg,
      borderWidth: 1.5,
      borderColor: c.glassBorderStrong,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      minHeight: 56,
    },
    optionCardSelected: {
      borderColor: c.neon,
      backgroundColor: c.neonBg,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 4,
    },
    optionCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    optionBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: c.textLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBadgeSelected: {
      backgroundColor: c.neon,
      borderColor: c.neon,
    },
    optionBadgeText: {
      ...textStyles.caption,
      color: c.textLow,
      fontSize: 12,
    },
    optionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.textOnNeon,
    },
    optionText: {
      ...textStyles.bodyBold,
      flex: 1,
      color: c.textHigh,
      fontSize: 15,
    },
    optionTextSelected: { color: c.neonLight },

    bottomBar: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.neon,
      borderRadius: radius.md,
      minHeight: 54,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 6,
    },
    nextButtonDisabled: {
      backgroundColor: c.surfaceElevated,
      shadowOpacity: 0,
      elevation: 0,
    },
    nextButtonText: {
      ...textStyles.button,
      color: c.textOnNeon,
      fontSize: 15,
    },
    buttonPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },

    // ─── Sonuç ekranı ───
    resultHeader: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    resultBadge: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.neonBg,
      borderWidth: 3,
      borderColor: c.neon,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 18,
      elevation: 10,
    },
    resultBadgeText: {
      ...textStyles.display,
      color: c.neon,
      fontSize: 36,
    },
    resultTitle: {
      ...textStyles.display,
      color: c.textHigh,
      fontSize: 26,
      textAlign: 'center',
    },
    resultSubtitle: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: spacing.base,
    },

    breakdownCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1,
      borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.base,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    breakdownTitle: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 11,
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    breakdownLevel: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 13,
      width: 28,
    },
    breakdownBarBg: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.divider,
      overflow: 'hidden',
    },
    breakdownBarFg: {
      height: '100%',
      backgroundColor: c.neon,
      borderRadius: 4,
    },
    breakdownScore: {
      ...textStyles.bodyBold,
      color: c.textMed,
      fontSize: 12,
      minWidth: 32,
      textAlign: 'right',
    },

    resultActions: { gap: spacing.sm, marginTop: spacing.md },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.neon,
      borderRadius: radius.md,
      minHeight: 56,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 14,
      elevation: 8,
    },
    primaryButtonText: {
      ...textStyles.button,
      color: c.textOnNeon,
      fontSize: 15,
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    secondaryButtonText: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 13,
    },
  });
}
