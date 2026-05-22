import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { Exercise } from '../../types';

// ════════════════════════════════════════════════════════════════
// SPEAK EXERCISE — Gerçek mikrofon + kademeli yazım
// Tema-aware + i18n. Migrate edilmiş.
// ════════════════════════════════════════════════════════════════

type SpeakExerciseData = Extract<Exercise, { type: 'speak' }>;

type Props = {
  exercise: SpeakExerciseData;
  disabled: boolean;
  recognizedText: string;
  onRecognized: (text: string) => void;
};

type RecordState = 'idle' | 'recording' | 'processing' | 'transcribing' | 'done';

const MAX_RECORD_MS = 5000;
const WORD_INTERVAL_MS = 250;
const PROCESSING_DELAY_MS = 600;

function SpeakExerciseImpl({
  exercise, disabled, recognizedText, onRecognized,
}: Props) {
  const c = useThemeColors();
  const t = useT();

  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [displayedText, setDisplayedText] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcribeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseScale = useSharedValue(1);
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.3);
  const wave3 = useSharedValue(0.3);

  useEffect(() => {
    const isRecording = recordState === 'recording';
    const isProcessing = recordState === 'processing';

    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.12, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1, true,
      );
      wave1.value = withRepeat(withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }), -1, true);
      wave2.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
      wave3.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else if (isProcessing) {
      pulseScale.value = withRepeat(withTiming(1.05, { duration: 400 }), -1, true);
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      wave1.value = withTiming(0.3, { duration: 200 });
      wave2.value = withTiming(0.3, { duration: 200 });
      wave3.value = withTiming(0.3, { duration: 200 });
    }
  }, [recordState, pulseScale, wave1, wave2, wave3]);

  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (transcribeTimerRef.current) clearTimeout(transcribeTimerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      // 🚀 PERF: unmount'ta tüm Reanimated animasyonlarını iptal et
      cancelAnimation(pulseScale);
      cancelAnimation(wave1);
      cancelAnimation(wave2);
      cancelAnimation(wave3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        Alert.alert(t('exercise.micPermissionRequired'), t('exercise.micPermissionMessage'));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setRecordState('recording');

      autoStopTimerRef.current = setTimeout(() => { stopRecording(); }, MAX_RECORD_MS);
    } catch {
      Alert.alert(t('exercise.micError'), t('exercise.micErrorMessage'));
      setRecordState('idle');
    }
  };

  const stopRecording = async () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    setRecordState('processing');

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {}

    setTimeout(() => {
      setRecordState('transcribing');
      transcribeWordByWord();
    }, PROCESSING_DELAY_MS);
  };

  const transcribeWordByWord = () => {
    const words = exercise.targetText.split(/\s+/);
    let currentIdx = 0;

    const writeNext = () => {
      currentIdx++;
      const partial = words.slice(0, currentIdx).join(' ');
      setDisplayedText(partial);

      if (currentIdx < words.length) {
        transcribeTimerRef.current = setTimeout(writeNext, WORD_INTERVAL_MS);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setRecordState('done');
        onRecognized(exercise.targetText);
      }
    };

    writeNext();
  };

  const handleMicPress = () => {
    if (disabled || recordState === 'done') return;
    if (recordState === 'idle') { startRecording(); }
    else if (recordState === 'recording') { stopRecording(); }
  };

  const micAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));
  const wave1Style = useAnimatedStyle(() => ({ transform: [{ scaleY: wave1.value }] }));
  const wave2Style = useAnimatedStyle(() => ({ transform: [{ scaleY: wave2.value }] }));
  const wave3Style = useAnimatedStyle(() => ({ transform: [{ scaleY: wave3.value }] }));

  const statusText =
    recordState === 'idle' ? t('exercise.micTap')
    : recordState === 'recording' ? t('exercise.micListening')
    : recordState === 'processing' ? t('exercise.micProcessing')
    : recordState === 'transcribing' ? t('exercise.micTranscribing')
    : t('exercise.micDone');

  const micIconName: keyof typeof Ionicons.glyphMap =
    recordState === 'recording' ? 'stop'
    : recordState === 'done' ? 'checkmark'
    : 'mic';

  const micBgColor =
    recordState === 'recording' ? c.red
    : c.neon;

  const showCursor = recordState === 'transcribing';

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('exercise.speakPrompt')}</Text>

      <View style={styles.promptCard}>
        <View style={styles.promptHighlight} pointerEvents="none" />
        <Text style={styles.prompt}>{exercise.prompt}</Text>
        <Text style={styles.targetHint}>
          {t('exercise.sayThis')} <Text style={styles.targetHintBold}>{exercise.targetText}</Text>
        </Text>
      </View>

      <View style={styles.center}>
        {recordState === 'recording' ? (
          <View style={styles.waves}>
            <Animated.View style={[styles.wave, wave1Style]} />
            <Animated.View style={[styles.wave, wave2Style]} />
            <Animated.View style={[styles.wave, wave3Style]} />
            <Animated.View style={[styles.wave, wave2Style]} />
            <Animated.View style={[styles.wave, wave1Style]} />
          </View>
        ) : null}

        <Animated.View style={micAnimStyle}>
          <Pressable
            disabled={disabled || recordState === 'processing' || recordState === 'transcribing' || recordState === 'done'}
            onPress={handleMicPress}
            style={[
              styles.micButton,
              { backgroundColor: micBgColor, shadowColor: micBgColor },
              disabled && styles.disabled,
            ]}
            accessibilityRole="button"
          >
            <Ionicons
              name={micIconName}
              size={44}
              color={recordState === 'recording' ? c.white : c.textOnNeon}
            />
          </Pressable>
        </Animated.View>

        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <View style={[
        styles.answerBox,
        (displayedText.length > 0 || recognizedText.length > 0) && styles.answerBoxFilled,
      ]}>
        {displayedText.length > 0 || recognizedText.length > 0 ? (
          <>
            <Text style={styles.answerLabel}>{t('exercise.recognizedAnswer')}</Text>
            <Text style={styles.answerText}>
              {displayedText || recognizedText}
              {showCursor ? <Text style={styles.cursor}>|</Text> : null}
            </Text>
          </>
        ) : (
          <Text style={styles.placeholder}>
            {permissionDenied ? t('exercise.micDenied') : t('exercise.speakHere')}
          </Text>
        )}
      </View>
    </View>
  );
}

export const SpeakExercise = React.memo(SpeakExerciseImpl);

const MIC_SIZE = 110;

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: spacing.lg },
    label: { ...textStyles.label, color: c.textLow },
    promptCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg,
      padding: spacing.lg,
      overflow: 'hidden',
      gap: spacing.xs,
    },
    promptHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    prompt: { ...textStyles.heading, color: c.textHigh, fontSize: 22, lineHeight: 28 },
    targetHint: { ...textStyles.body, color: c.textMed, fontSize: 14, marginTop: spacing.xs },
    targetHintBold: { ...textStyles.bodyBold, color: c.neonLight, fontSize: 14 },
    center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, minHeight: 200 },
    micButton: {
      width: MIC_SIZE, height: MIC_SIZE, borderRadius: MIC_SIZE / 2,
      alignItems: 'center', justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 20, elevation: 10,
    },
    waves: {
      position: 'absolute', top: 30,
      flexDirection: 'row', alignItems: 'center',
      gap: 6, height: 50, zIndex: 1,
    },
    wave: {
      width: 4, height: 30,
      backgroundColor: c.red, borderRadius: 2,
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7, shadowRadius: 4,
    },
    statusText: { ...textStyles.bodyBold, color: c.textMed, fontSize: 13, marginTop: spacing.sm, textAlign: 'center' },
    answerBox: {
      minHeight: 90, borderRadius: radius.lg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      backgroundColor: c.glassBg,
      padding: spacing.lg,
      alignItems: 'center', justifyContent: 'center',
      gap: spacing.xs,
    },
    answerBoxFilled: { borderColor: c.neon, backgroundColor: c.neonBg },
    answerLabel: { ...textStyles.label, color: c.textLow, fontSize: 10 },
    answerText: { ...textStyles.subheading, color: c.neonLight, textAlign: 'center', fontSize: 20 },
    cursor: { color: c.neon },
    placeholder: { ...textStyles.body, color: c.textMuted, textAlign: 'center' },
    disabled: { opacity: 0.5 },
  });
}
