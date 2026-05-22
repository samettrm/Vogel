import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { radius, spacing, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { Exercise } from '../../types';
import { TranslateExercise } from './TranslateExercise';

type ListenExerciseData = Extract<Exercise, { type: 'listen' }>;

type Props = {
  exercise: ListenExerciseData;
  selectedWords: string[];
  disabled: boolean;
  onAddWord: (word: string) => void;
  onRemoveWordAt: (index: number) => void;
};

function ListenExerciseImpl({
  exercise, selectedWords, disabled, onAddWord, onRemoveWordAt,
}: Props) {
  const c = useThemeColors();
  const t = useT();
  const lastSpeakAtRef = useRef(0);
  const audioSoundRef = useRef<Audio.Sound | null>(null);
  const [bigPressed, setBigPressed] = useState(false);
  const [slowPressed, setSlowPressed] = useState(false);

  useEffect(() => () => {
    Speech.stop();
    if (audioSoundRef.current) {
      audioSoundRef.current.unloadAsync().catch(() => {});
      audioSoundRef.current = null;
    }
  }, []);

  const speakNow = (rate: number) => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSpeakAtRef.current < 250) return;
    lastSpeakAtRef.current = now;
    try {
      Haptics.selectionAsync().catch(() => undefined);
      // audioUrl varsa expo-av ile çal (yavaş rate sadece TTS için)
      if (exercise.audioUrl && rate >= 0.9) {
        playAudioFromUrl(exercise.audioUrl);
      } else {
        Speech.speak(exercise.audioText, { language: 'de-DE', rate, pitch: 1 });
      }
    } catch {}
  };

  const playAudioFromUrl = async (url: string) => {
    try {
      // Mevcut ses varsa unload et
      if (audioSoundRef.current) {
        await audioSoundRef.current.unloadAsync().catch(() => {});
        audioSoundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true, volume: 1 });
      audioSoundRef.current = sound;
    } catch {
      // Fallback: TTS
      Speech.speak(exercise.audioText, { language: 'de-DE', rate: 1, pitch: 1 });
    }
  };

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={styles.audioRow}>
        <Pressable
          onPressIn={() => { setBigPressed(true); speakNow(1); }}
          onPressOut={() => setBigPressed(false)}
          disabled={disabled}
          hitSlop={10}
          style={[
            styles.bigSpeaker,
            disabled && styles.disabled,
            bigPressed && styles.bigPressed,
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="volume-high" size={42} color={c.textOnNeon} />
        </Pressable>

        <Pressable
          onPressIn={() => { setSlowPressed(true); speakNow(0.55); }}
          onPressOut={() => setSlowPressed(false)}
          disabled={disabled}
          hitSlop={10}
          style={[
            styles.slowButton,
            disabled && styles.disabled,
            slowPressed && styles.slowPressed,
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="hourglass-outline" size={20} color={c.cyan} />
        </Pressable>
      </View>

      <TranslateExercise
        exercise={{
          ...exercise,
          type: 'translate',
          prompt: t('exercise.listen'),
        }}
        selectedWords={selectedWords}
        disabled={disabled}
        onAddWord={onAddWord}
        onRemoveWordAt={onRemoveWordAt}
        labelText={t('exercise.listen')}
        compactPrompt={true}  // 📦 "Dinle ve cümle oluştur" büyük başlık yerine küçük label olarak
        translationText={exercise.translation}  // 🌐 Cevap sonrası Türkçe çeviri (varsa)
      />
    </View>
  );
}

export const ListenExercise = React.memo(ListenExerciseImpl);

const BIG_SIZE = 92;
const SLOW_HEIGHT = 56;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    audioRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.base,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.xl, paddingBottom: spacing.sm,
    },
    bigSpeaker: {
      width: BIG_SIZE, height: BIG_SIZE, borderRadius: BIG_SIZE / 2,
      backgroundColor: c.neon, alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 18, elevation: 10,
    },
    bigPressed: { transform: [{ scale: 0.94 }], opacity: 0.9 },
    slowButton: {
      height: SLOW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      paddingHorizontal: spacing.base, borderRadius: radius.lg,
      backgroundColor: c.cyanBg, borderWidth: 1, borderColor: c.cyan,
    },
    slowPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
    disabled: { opacity: 0.5 },
  });
}
