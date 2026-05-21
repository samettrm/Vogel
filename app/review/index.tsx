import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useUserStore, type ReviewItem } from '../../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';
import { playSound } from '../../src/utils/sounds';

// ════════════════════════════════════════════════════════════════
// TEKRAR MERKEZİ (Review Center)
//
// SM-2 algoritmasıyla zamanı gelen kelimeleri kullanıcıya gösterir.
// Anki tarzı flashcard pattern:
//   1. Kelimenin Türkçesi (source) görünür
//   2. Kullanıcı tahmin eder ("Almancası ne?")
//   3. "Cevabı Göster" → flip animation → Almancası (target)
//   4. İki buton: "✗ Hatırlamadım" / "✓ Biliyordum"
//   5. SM-2 algoritması çağrılır → kelimenin sonraki review zamanı güncellenir
//   6. Sıradaki karta geç
//   7. Tümü bitince özet ekranı
//
// Erişim: Map ekranındaki ReviewBanner'dan veya /review URL'inden
// ════════════════════════════════════════════════════════════════

export default function ReviewCenter() {
  const c = useThemeColors();
  const t = useT();

  const reviewItems = useUserStore((s) => s.reviewItems);
  const recordReviewResult = useUserStore((s) => s.recordReviewResult);

  // Sayfa açılışında due items'ı al — daha sonra reviewItems değişse bile aynı queue kullanılır
  // (kullanıcı bir item'ı yanıtladığında item silinmesin / tekrar gelmesin diye)
  const [queue] = useState<ReviewItem[]>(() => {
    const now = Date.now();
    return Object.values(reviewItems)
      .filter((item) => item.nextReviewAt <= now)
      .sort((a, b) => {
        // Önce easeFactor düşük olanlar (zorlandığım kelimeler)
        if (a.easeFactor !== b.easeFactor) return a.easeFactor - b.easeFactor;
        // Sonra wrongCount yüksek olanlar
        if (a.wrongCount !== b.wrongCount) return b.wrongCount - a.wrongCount;
        return a.nextReviewAt - b.nextReviewAt;
      });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [isComplete, setIsComplete] = useState(queue.length === 0);

  const currentItem = queue[currentIndex];

  const styles = makeStyles(c);

  // ─── Flip animation ───
  const flip = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: interpolate(flip.value, [0, 0.5, 0.5001, 1], [1, 1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: interpolate(flip.value, [0, 0.4999, 0.5, 1], [0, 0, 1, 1]),
  }));

  const handleShowAnswer = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    flip.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) });
    setIsFlipped(true);
    // 🔇 OTOMATİK SES KALDIRILDI — kullanıcı izinsiz ses çalmak istemiyor olabilir.
    // Speaker butonu kartta zaten var, isterse dokunarak Almancayı duyar.
  }, [flip]);

  // 🔊 Manuel ses çalma — kullanıcı speaker butonuna dokununca
  const handleSpeakTarget = useCallback(() => {
    if (!currentItem) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      Speech.speak(currentItem.targetText, { language: 'de-DE', rate: 0.9 });
    } catch {}
  }, [currentItem]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!currentItem) return;
      // Haptic + sound
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        playSound('correct').catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        playSound('wrong').catch(() => {});
      }

      // SM-2 update
      recordReviewResult(
        {
          id: currentItem.id,
          courseId: currentItem.courseId,
          exerciseId: currentItem.exerciseId,
          exerciseType: currentItem.exerciseType,
          sourceText: currentItem.sourceText,
          targetText: currentItem.targetText,
        },
        isCorrect,
      );

      setStats((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        wrong: s.wrong + (isCorrect ? 0 : 1),
      }));

      // Sıradakine geç veya bitir
      if (currentIndex + 1 >= queue.length) {
        setIsComplete(true);
      } else {
        flip.value = 0;
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentItem, currentIndex, queue.length, flip, recordReviewResult],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimation(flip);
      Speech.stop();
    };
  }, [flip]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.replace('/');
  }, []);

  // ─── EMPTY STATE: hiç tekrar yok ───
  if (queue.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={24} color={c.textHigh} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>{t('review.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('review.emptySubtitle')}</Text>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>{t('common.goHome')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── COMPLETE: bütün queue bitti ───
  if (isComplete) {
    const total = stats.correct + stats.wrong;
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.completeContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <Text style={styles.completeEmoji}>🌟</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.completeTitle}>{t('review.completeTitle')}</Text>
            <Text style={styles.completeSubtitle}>
              {t('review.completeSubtitle', { count: total })}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: c.neon }]}>
              <Text style={[styles.statValue, { color: c.neon }]}>{stats.correct}</Text>
              <Text style={styles.statLabel}>{t('review.statCorrect')}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: c.red }]}>
              <Text style={[styles.statValue, { color: c.red }]}>{stats.wrong}</Text>
              <Text style={styles.statLabel}>{t('review.statWrong')}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: c.gold }]}>
              <Text style={[styles.statValue, { color: c.gold }]}>{accuracy}%</Text>
              <Text style={styles.statLabel}>{t('review.statAccuracy')}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ width: '100%' }}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            >
              <Text style={styles.primaryButtonText}>{t('common.goHome')}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ─── ACTIVE CARD: flashcard ───
  const progress = (currentIndex + 1) / queue.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header: close + progress */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={24} color={c.textHigh} />
        </Pressable>
        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{queue.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {/* Card front: Türkçe (sourceText) */}
        <Animated.View style={[styles.card, frontStyle, styles.cardFront]}>
          <Text style={styles.cardLabel}>{t('review.cardLabelSource')}</Text>
          <Text style={styles.cardText}>{currentItem.sourceText}</Text>
          <Text style={styles.cardHint}>{t('review.cardHint')}</Text>
        </Animated.View>

        {/* Card back: Almanca (targetText) + 🔊 ses butonu (manuel) */}
        <Animated.View style={[styles.card, backStyle, styles.cardBack]}>
          <Text style={styles.cardLabel}>{t('review.cardLabelTarget')}</Text>
          <Text style={styles.cardText}>{currentItem.targetText}</Text>
          <Pressable
            onPress={handleSpeakTarget}
            style={({ pressed }) => [styles.speakerBtn, pressed && styles.speakerBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('review.tapToHear')}
            hitSlop={12}
          >
            <Ionicons name="volume-high" size={22} color={c.neon} />
            <Text style={styles.speakerBtnText}>{t('review.tapToHear')}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Bottom actions */}
      <View style={styles.actionBar}>
        {!isFlipped ? (
          <Pressable
            onPress={handleShowAnswer}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>{t('review.showAnswer')}</Text>
          </Pressable>
        ) : (
          <View style={styles.judgeRow}>
            <Pressable
              onPress={() => handleAnswer(false)}
              style={({ pressed }) => [
                styles.judgeButton,
                { borderColor: c.red, backgroundColor: c.redBg },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="close" size={20} color={c.red} />
              <Text style={[styles.judgeButtonText, { color: c.red }]}>
                {t('review.judgeWrong')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleAnswer(true)}
              style={({ pressed }) => [
                styles.judgeButton,
                { borderColor: c.neon, backgroundColor: c.neonBg },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="checkmark" size={20} color={c.neon} />
              <Text style={[styles.judgeButtonText, { color: c.neon }]}>
                {t('review.judgeCorrect')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },

    // Header
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
    },
    progressBarWrap: { flex: 1 },
    progressBarBg: {
      height: 8,
      backgroundColor: c.divider,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: c.neon,
      borderRadius: 4,
    },
    progressText: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 12,
      minWidth: 40,
      textAlign: 'right',
    },

    // Card container
    cardContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    card: {
      width: '100%',
      minHeight: 220,
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backfaceVisibility: 'hidden',
      position: 'absolute',
    },
    cardFront: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1.5,
      borderColor: c.glassBorder,
    },
    cardBack: {
      backgroundColor: c.neonBg,
      borderWidth: 1.5,
      borderColor: c.neon,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    cardLabel: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 11,
      letterSpacing: 2,
    },
    cardText: {
      ...textStyles.display,
      color: c.textHigh,
      fontSize: 28,
      textAlign: 'center',
      lineHeight: 36,
    },
    cardHint: {
      ...textStyles.body,
      color: c.textLow,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    speakerBtn: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 40,
      borderRadius: radius.pill,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      marginTop: spacing.sm,
    },
    speakerBtnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
    speakerBtnText: {
      ...textStyles.label,
      color: c.neon,
      fontSize: 11,
      letterSpacing: 0.5,
    },

    // Action bar
    actionBar: {
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.lg,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: radius.md,
      backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryButtonPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
    primaryButtonText: {
      ...textStyles.button,
      color: c.textOnNeon,
      fontSize: 16,
    },
    judgeRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    judgeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 56,
      borderRadius: radius.md,
      borderWidth: 1.5,
    },
    judgeButtonText: {
      ...textStyles.button,
      fontSize: 14,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    emptyEmoji: { fontSize: 80, marginBottom: spacing.md },
    emptyTitle: {
      ...textStyles.display,
      color: c.textHigh,
      textAlign: 'center',
      fontSize: 24,
    },
    emptySubtitle: {
      ...textStyles.body,
      color: c.textMed,
      textAlign: 'center',
      fontSize: 14,
      marginBottom: spacing.lg,
    },

    // Complete state
    completeContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.lg,
    },
    completeEmoji: { fontSize: 80 },
    completeTitle: {
      ...textStyles.display,
      color: c.textHigh,
      textAlign: 'center',
      fontSize: 28,
    },
    completeSubtitle: {
      ...textStyles.body,
      color: c.textMed,
      textAlign: 'center',
      fontSize: 14,
      marginTop: spacing.xs,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      width: '100%',
      marginVertical: spacing.lg,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.base,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      backgroundColor: c.glassBg,
      gap: 4,
    },
    statValue: {
      ...textStyles.display,
      fontSize: 28,
    },
    statLabel: {
      ...textStyles.label,
      color: c.textLow,
      fontSize: 10,
      letterSpacing: 1,
    },
  });
}
