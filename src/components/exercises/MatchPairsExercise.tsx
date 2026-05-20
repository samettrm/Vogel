import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { Exercise } from '../../types';

// ════════════════════════════════════════════════════════════════
// MATCH PAIRS EXERCISE — Eşleştirme alıştırması
//
// Sol kolon: kaynak (Türkçe) kelimeler — karışık sırada
// Sağ kolon: hedef (Almanca) kelimeler — karışık sırada
//
// Kullanıcı bir sol karta + bir sağ karta dokunur. Doğru eşleşme ise
// iki kart neon'a döner ve dokunulamaz hale gelir. Yanlışsa kısa shake +
// kırmızı flash + seçim iptal edilir.
//
// Tüm çiftler eşleşince selectedWords (parent state) = pairs.map(p => p.id).
// Lesson screen reducer'ı bunu görür → KONTROL ET aktif olur.
// ════════════════════════════════════════════════════════════════

type MatchPairsData = Extract<Exercise, { type: 'matchPairs' }>;

type Props = {
  exercise: MatchPairsData;
  matchedIds: string[];
  disabled: boolean;
  onPairMatched: (pairId: string) => void;
};

type SidePick = { id: string; side: 'left' | 'right' };
type WrongFlash = { leftId: string; rightId: string } | null;

function MatchPairsExerciseImpl({
  exercise, matchedIds, disabled, onPairMatched,
}: Props) {
  const c = useThemeColors();
  const t = useT();

  // Karışık sıralar — sadece exercise.id değiştiğinde yeniden hesapla
  const leftOrder = useMemo(
    () => [...exercise.pairs].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );
  const rightOrder = useMemo(
    () => [...exercise.pairs].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<WrongFlash>(null);

  // İki seçim olduğunda kontrol et
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    if (selectedLeft === selectedRight) {
      // Doğru eşleşme
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onPairMatched(selectedLeft);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Yanlış eşleşme — kısa flash + sıfırla
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setWrongFlash({ leftId: selectedLeft, rightId: selectedRight });
      const tt = setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setWrongFlash(null);
      }, 450);
      return () => clearTimeout(tt);
    }
  }, [selectedLeft, selectedRight, onPairMatched]);

  const handleLeftPress = (id: string) => {
    if (disabled || matchedIds.includes(id) || wrongFlash) return;
    Haptics.selectionAsync().catch(() => {});
    setSelectedLeft((prev) => (prev === id ? null : id));
  };

  const handleRightPress = (id: string) => {
    if (disabled || matchedIds.includes(id) || wrongFlash) return;
    Haptics.selectionAsync().catch(() => {});
    setSelectedRight((prev) => (prev === id ? null : id));
  };

  const styles = makeStyles(c);
  const totalMatched = matchedIds.length;
  const totalPairs = exercise.pairs.length;
  const allDone = totalMatched >= totalPairs;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('exercise.matchPairs')}</Text>

      <View style={styles.progressBox}>
        <Text style={styles.progressText}>
          {totalMatched}/{totalPairs}
        </Text>
        {allDone ? (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            <Ionicons name="checkmark-circle" size={20} color={c.neon} />
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.columns}>
        {/* Sol kolon */}
        <View style={styles.column}>
          {leftOrder.map((pair) => {
            const isMatched = matchedIds.includes(pair.id);
            const isSelected = selectedLeft === pair.id;
            const isWrong = wrongFlash?.leftId === pair.id;

            const cardStyle =
              isMatched ? styles.cardMatched
              : isWrong ? styles.cardWrong
              : isSelected ? styles.cardSelected
              : styles.cardIdle;

            const textStyle =
              isMatched ? styles.cardTextMatched
              : isWrong ? styles.cardTextWrong
              : isSelected ? styles.cardTextSelected
              : styles.cardTextIdle;

            return (
              <Pressable
                key={`left-${pair.id}`}
                disabled={disabled || isMatched || !!wrongFlash}
                onPress={() => handleLeftPress(pair.id)}
                style={({ pressed }) => [
                  styles.card,
                  cardStyle,
                  pressed && !isMatched && styles.cardPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.cardHighlight} pointerEvents="none" />
                <Text style={[styles.cardText, textStyle]} numberOfLines={2}>
                  {pair.left}
                </Text>
                {isMatched ? (
                  <Ionicons name="checkmark" size={14} color={c.textOnNeon} style={styles.cardCheck} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Sağ kolon */}
        <View style={styles.column}>
          {rightOrder.map((pair) => {
            const isMatched = matchedIds.includes(pair.id);
            const isSelected = selectedRight === pair.id;
            const isWrong = wrongFlash?.rightId === pair.id;

            const cardStyle =
              isMatched ? styles.cardMatched
              : isWrong ? styles.cardWrong
              : isSelected ? styles.cardSelected
              : styles.cardIdle;

            const textStyle =
              isMatched ? styles.cardTextMatched
              : isWrong ? styles.cardTextWrong
              : isSelected ? styles.cardTextSelected
              : styles.cardTextIdle;

            return (
              <Pressable
                key={`right-${pair.id}`}
                disabled={disabled || isMatched || !!wrongFlash}
                onPress={() => handleRightPress(pair.id)}
                style={({ pressed }) => [
                  styles.card,
                  cardStyle,
                  pressed && !isMatched && styles.cardPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.cardHighlight} pointerEvents="none" />
                <Text style={[styles.cardText, textStyle]} numberOfLines={2}>
                  {pair.right}
                </Text>
                {isMatched ? (
                  <Ionicons name="checkmark" size={14} color={c.textOnNeon} style={styles.cardCheck} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const MatchPairsExercise = React.memo(MatchPairsExerciseImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.md,
    },
    label: { ...textStyles.label, color: c.textLow },
    progressBox: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    progressText: { ...textStyles.bodyBold, color: c.neonLight, fontSize: 14 },
    columns: { flexDirection: 'row', gap: spacing.md },
    column: { flex: 1, gap: spacing.sm },
    card: {
      minHeight: 56, borderRadius: radius.md, borderWidth: 1.5,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    cardHighlight: {
      position: 'absolute', top: 0,
      left: spacing.sm, right: spacing.sm,
      height: 1, backgroundColor: c.glassHighlight,
    },
    cardIdle: { backgroundColor: c.glassBg, borderColor: c.glassBorderStrong },
    cardSelected: {
      backgroundColor: c.neonBg, borderColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
    },
    cardMatched: {
      backgroundColor: c.neon, borderColor: c.neon,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45, shadowRadius: 10, elevation: 4,
    },
    cardWrong: {
      backgroundColor: c.wrongBg, borderColor: c.red,
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
    },
    cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    cardText: { ...textStyles.bodyBold, fontSize: 14, textAlign: 'center' },
    cardTextIdle: { color: c.textHigh },
    cardTextSelected: { color: c.neonLight },
    cardTextMatched: { color: c.textOnNeon },
    cardTextWrong: { color: '#FB7185' },
    cardCheck: { position: 'absolute', top: 4, right: 4 },
  });
}
