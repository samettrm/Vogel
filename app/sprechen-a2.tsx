// ─────────────────────────────────────────────────────────────────────────────
// A2 Sprechen exam simulator screen.
//
// Mirrors the official Goethe / telc A2 oral-exam format with three flow types:
//   - Teil 2 / monolog     : learner gives a monologue; grader checks word count
//                            + keywords + Perfekt + weil-style subordinates.
//   - Teil 2 / followup    : the jury asks one short question right after.
//   - Teil 3 / examiner    : pre-scripted line from the partner (TTS reads it).
//   - Teil 3 / user        : the learner replies, keyword-graded like A1.
//
// Fully offline — no API calls. Adapts Lexora's A2 simulator to Vogel's design.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, PrimaryButton, SecondaryButton, IconButton, ProgressBar } from '@/src/components/ui';
import { useThemeColors, spacing, radius } from '@/src/theme';
import { useT } from '@/src/i18n';
import { useUserStore } from '@/src/store/useUserStore';
import { speakGerman, preloadGermanVoice } from '@/lib/german-tts';
import {
  speechRecognition,
  useSpeechRecognitionEvent,
  isSpeechRecognitionAvailable,
} from '@/lib/speech-recognition';
import { logActivity, touchStreak } from '@/lib/storage';
import { gradeResponse, pickN } from '@/lib/sprechen-a1';
import {
  TEIL1_PROMPTS_A2,
  TEIL2_THEMES_A2,
  TEIL3_SCENARIOS_A2,
  DEFAULT_TEIL1_COUNT_A2,
  DEFAULT_TEIL2_THEME_COUNT_A2,
  DEFAULT_TEIL3_SCENARIO_COUNT_A2,
  gradeMonolog,
  type SprechenA2Teil1Prompt,
  type SprechenA2Teil2Theme,
  type SprechenA2Teil2Followup,
  type SprechenA2Teil3Scenario,
  type SprechenA2Teil3Turn,
} from '@/lib/sprechen-a2';

// Flat step list — every user-facing screen in the simulator is one entry.
type Step =
  | { kind: 'teil1'; prompt: SprechenA2Teil1Prompt }
  | { kind: 'teil2-monolog'; theme: SprechenA2Teil2Theme }
  | { kind: 'teil2-followup'; theme: SprechenA2Teil2Theme; followup: SprechenA2Teil2Followup }
  | { kind: 'teil3-examiner'; scenario: SprechenA2Teil3Scenario; turn: SprechenA2Teil3Turn; isFirstOfScenario: boolean }
  | { kind: 'teil3-user'; scenario: SprechenA2Teil3Scenario; turn: SprechenA2Teil3Turn; lastExaminerLine: string | null };

type FeedbackKind = 'ok' | 'okay' | 'short' | 'missing';

function partLabelKey(step: Step): Parameters<ReturnType<typeof useT>>[0] {
  const map: Record<string, Parameters<ReturnType<typeof useT>>[0]> = {
    'teil1': 'sprechenA2.partLabel.teil1',
    'teil2-monolog': 'sprechenA2.partLabel.teil2Monolog',
    'teil2-followup': 'sprechenA2.partLabel.teil2Followup',
    'teil3-examiner': 'sprechenA2.partLabel.teil3Examiner',
    'teil3-user': 'sprechenA2.partLabel.teil3User',
  };
  return map[step.kind] ?? 'sprechenA2.partLabel.teil1';
}

function buildDeck(): Step[] {
  const steps: Step[] = [];
  // ── Teil 1 (Kennenlernen) ─────────────────────────────────────────────────
  for (const prompt of pickN(TEIL1_PROMPTS_A2, DEFAULT_TEIL1_COUNT_A2)) {
    steps.push({ kind: 'teil1', prompt });
  }
  // ── Teil 2 ────────────────────────────────────────────────────────────────
  const themes = pickN(TEIL2_THEMES_A2, DEFAULT_TEIL2_THEME_COUNT_A2);
  for (const theme of themes) {
    steps.push({ kind: 'teil2-monolog', theme });
    const [followup] = pickN(theme.juryFollowups, 1);
    if (followup) steps.push({ kind: 'teil2-followup', theme, followup });
  }
  // ── Teil 3 ────────────────────────────────────────────────────────────────
  const scenarios = pickN(TEIL3_SCENARIOS_A2, DEFAULT_TEIL3_SCENARIO_COUNT_A2);
  for (const scenario of scenarios) {
    let lastExaminer: string | null = null;
    scenario.turns.forEach((turn, i) => {
      if (turn.speaker === 'examiner') {
        steps.push({ kind: 'teil3-examiner', scenario, turn, isFirstOfScenario: i === 0 });
        lastExaminer = turn.prompt.de;
      } else {
        steps.push({ kind: 'teil3-user', scenario, turn, lastExaminerLine: lastExaminer });
      }
    });
  }
  return steps;
}

const SPRECHEN_RATE = 1.0;

export default function SprechenA2Screen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isPremium = useUserStore((s) => s.isPremium);

  const [deck, setDeck] = useState<Step[]>(() => buildDeck());
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackKind | null>(null);
  const [bonuses, setBonuses] = useState<{ perfekt: boolean; sub: boolean }>({ perfekt: false, sub: false });
  const [correct, setCorrect] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (typeof transcript === 'string') setInput(transcript);
  });
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    setMicError(event?.error ?? 'unknown');
  });

  useEffect(() => {
    if (!isPremium) router.replace('/shop');
  }, [isPremium]);

  // Cleanup speech recognition on unmount.
  useEffect(() => {
    return () => {
      try { speechRecognition?.stop(); } catch { /* no-op */ }
    };
  }, []);

  // Stop TTS on unmount.
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  // Warm the German voice cache on mount.
  useEffect(() => {
    void preloadGermanVoice();
  }, []);

  // Auto-speak examiner lines + jury follow-ups when their step appears.
  const currentStep = deck[index];
  useEffect(() => {
    if (phase !== 'quiz' || !currentStep) return;
    if (currentStep.kind === 'teil1') {
      speakGerman(currentStep.prompt.question.de, { rate: SPRECHEN_RATE });
    } else if (currentStep.kind === 'teil3-examiner') {
      speakGerman(currentStep.turn.prompt.de, { rate: SPRECHEN_RATE });
    } else if (currentStep.kind === 'teil2-followup') {
      speakGerman(currentStep.followup.question.de, { rate: SPRECHEN_RATE });
    }
  }, [phase, currentStep]);

  const startSession = useCallback(() => {
    setDeck(buildDeck());
    setPhase('quiz');
    setIndex(0);
    setInput('');
    setFeedback(null);
    setBonuses({ perfekt: false, sub: false });
    setCorrect(0);
  }, []);

  const toggleMic = useCallback(async () => {
    setMicError(null);
    if (!isSpeechRecognitionAvailable() || !speechRecognition) {
      setMicError('unavailable');
      return;
    }
    if (isListening) {
      try { speechRecognition.stop(); } catch { setIsListening(false); }
      return;
    }
    try {
      const perm = await speechRecognition.requestPermissionsAsync();
      if (!perm.granted) { setMicError('permission'); return; }
      setInput('');
      speechRecognition.start({ lang: 'de-DE', interimResults: true, continuous: false, requiresOnDeviceRecognition: false });
      setIsListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setMicError('unavailable');
    }
  }, [isListening]);

  const handleSubmit = useCallback(() => {
    if (!currentStep || feedback !== null) return;

    // ── Teil 2 monologue grading (length + keyword + bonus markers) ──────────
    if (currentStep.kind === 'teil2-monolog') {
      const grade = gradeMonolog(
        input,
        currentStep.theme.monologAcceptKeywords,
        currentStep.theme.monologMinWords,
      );
      let next: FeedbackKind;
      if (grade.words < currentStep.theme.monologMinWords / 2) {
        next = 'short';
      } else if (grade.matched.length < 2) {
        next = 'missing';
      } else if (grade.ok) {
        next = 'ok';
        setCorrect((n) => n + 1);
      } else {
        next = 'okay';
      }
      setBonuses({ perfekt: grade.hasPerfekt, sub: grade.hasSubordinate });
      setFeedback(next);
      Haptics.notificationAsync(
        next === 'ok'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
      return;
    }

    // ── Teil 1 + Teil 2 follow-up + Teil 3 user turns → keyword grading ──────
    let accept: string[] = [];
    if (currentStep.kind === 'teil1') accept = currentStep.prompt.acceptKeywords;
    if (currentStep.kind === 'teil2-followup') accept = currentStep.followup.acceptKeywords;
    if (currentStep.kind === 'teil3-user') accept = currentStep.turn.acceptKeywords ?? [];
    const grade = gradeResponse(input, accept);
    let next: FeedbackKind;
    if (grade.words === 0 || grade.words < 2) {
      next = 'short';
    } else if (!grade.ok) {
      next = 'missing';
    } else {
      next = 'ok';
      setCorrect((n) => n + 1);
    }
    setBonuses({ perfekt: false, sub: false });
    setFeedback(next);
    Haptics.notificationAsync(
      next === 'ok'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
  }, [currentStep, feedback, input]);

  const handleNext = useCallback(() => {
    if (index + 1 >= deck.length) {
      touchStreak();
      logActivity(1);
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setInput('');
      setFeedback(null);
      setBonuses({ perfekt: false, sub: false });
    }
  }, [deck.length, index]);

  // Examiner turn → no input needed, just a Continue button.
  const advanceExaminerTurn = useCallback(() => {
    if (index + 1 >= deck.length) {
      touchStreak();
      logActivity(1);
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setInput('');
    }
  }, [deck.length, index]);

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[c.purpleGlow, 'transparent']} style={styles.heroGrad} pointerEvents="none" />

        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
          <IconButton icon="arrow-back" accessibilityLabel="Geri" onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: c.textHigh }]}>{t('sprechenA2.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.base, paddingBottom: 96 + insets.bottom }}
        >
          <View style={[styles.badge, { backgroundColor: c.purpleBg, borderRadius: radius.pill }]}>
            <Text style={[styles.badgeText, { color: c.purpleLight }]}>{t('sprechenA2.intro.badge')}</Text>
          </View>

          <Text style={[styles.introTitle, { color: c.textHigh }]}>{t('sprechenA2.intro.title')}</Text>
          <Text style={[styles.introSub, { color: c.textLow }]}>{t('sprechenA2.intro.subtitle')}</Text>

          <PartIntroCard
            number={1}
            title={t('sprechenA2.intro.teil1Label')}
            description={t('sprechenA2.intro.teil1Desc')}
            icon="person-circle"
          />
          <PartIntroCard
            number={2}
            title={t('sprechenA2.intro.teil2Label')}
            description={t('sprechenA2.intro.teil2Desc')}
            icon="chatbubble"
          />
          <PartIntroCard
            number={3}
            title={t('sprechenA2.intro.teil3Label')}
            description={t('sprechenA2.intro.teil3Desc')}
            icon="sparkles"
          />

          <GlassCard style={{ marginTop: spacing.sm, borderColor: c.purpleBg, borderWidth: 1 }}>
            <Text style={[styles.tipTitle, { color: c.purpleLight }]}>{t('sprechenA2.intro.tipTitle')}</Text>
            <Text style={[styles.tipBody, { color: c.textLow }]}>{t('sprechenA2.intro.tipBody')}</Text>
          </GlassCard>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, backgroundColor: c.bg, borderTopColor: c.border }]}>
          <PrimaryButton label={t('sprechenA2.intro.start')} onPress={startSession} />
        </View>
      </View>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total = deck.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percent >= 60;
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[c.purpleGlow, 'transparent']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.centered}>
          <View style={[styles.scoreRing, { backgroundColor: passed ? c.neonBg : c.purpleBg, borderColor: passed ? c.neon : c.purple, borderRadius: radius.xl }]}>
            <Text style={{ fontSize: 38 }}>{passed ? '🎉' : '💪'}</Text>
            <Text style={[styles.scorePercent, { color: passed ? c.neon : c.purpleLight }]}>%{percent}</Text>
          </View>
          <Text style={[styles.resultTitle, { color: c.textHigh }]}>{t('sprechenA2.result.title')}</Text>
          <Text style={[styles.resultSub, { color: c.textLow }]}>{t('sprechenA2.result.score', { correct, total })}</Text>
          <Text style={[styles.resultNote, { color: c.textMed }]}>
            {passed ? t('sprechenA2.result.passed') : t('sprechenA2.result.needsWork')}
          </Text>
          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.lg }}>
            <PrimaryButton label={t('sprechenA2.result.retry')} onPress={startSession} />
            <SecondaryButton label={t('sprechenA2.result.back')} variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  if (!currentStep) return null;
  const isExaminerTurn = currentStep.kind === 'teil3-examiner';
  const isMonolog = currentStep.kind === 'teil2-monolog';
  const plKey = partLabelKey(currentStep);
  const partLabel = t(plKey);

  const placeholder = isMonolog
    ? t('sprechenA2.teil2.placeholderMonolog')
    : currentStep.kind === 'teil1'
      ? t('sprechenA2.teil1.placeholder')
      : currentStep.kind === 'teil2-followup'
        ? t('sprechenA2.teil2.placeholderAnswer')
        : t('sprechenA2.teil3.placeholder');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: c.bg }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[c.purpleGlow, 'transparent']} style={styles.heroGrad} pointerEvents="none" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
        <IconButton icon="close" accessibilityLabel="Kapat" onPress={() => router.back()} />
        <Text style={[styles.counter, { color: c.textLow }]}>
          {t('sprechenA2.progress', { current: index + 1, total: deck.length })}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm }}>
        <ProgressBar value={index / deck.length} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 40 }}
      >
        <View style={[styles.badge, { backgroundColor: c.surfaceElevated, borderRadius: radius.pill }]}>
          <Text style={[styles.badgeText, { color: c.purpleLight }]}>{partLabel}</Text>
        </View>

        <StepCard step={currentStep} />

        {/* Examiner turn → just a Continue button (no input). */}
        {isExaminerTurn ? (
          <PrimaryButton
            label={t('sprechenA2.teil3.continue')}
            onPress={advanceExaminerTurn}
            style={{ marginTop: spacing.base }}
          />
        ) : feedback === null ? (
          <View style={{ marginTop: spacing.base }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={placeholder}
              placeholderTextColor={c.textMuted}
              multiline
              editable={!isListening}
              style={[
                styles.input,
                {
                  backgroundColor: c.surface,
                  borderColor: isListening ? c.red : c.border,
                  borderRadius: radius.lg,
                  color: c.textHigh,
                  minHeight: isMonolog ? 160 : 100,
                },
              ]}
            />

            <Pressable
              onPress={toggleMic}
              style={[
                styles.micBar,
                {
                  backgroundColor: isListening ? 'rgba(239,68,68,0.15)' : c.purpleBg,
                  borderColor: isListening ? c.red : c.purple,
                  borderRadius: radius.lg,
                  marginTop: spacing.md,
                },
              ]}
            >
              <Ionicons name={isListening ? 'stop' : 'mic'} size={22} color={isListening ? c.red : c.purple} />
              <Text style={[styles.micText, { color: isListening ? c.red : c.textMed, marginLeft: spacing.md }]}>
                {isListening ? t('sprechenA2.mic.listening') : t('sprechenA2.mic.tapToSpeak')}
              </Text>
            </Pressable>

            {micError === 'permission' ? (
              <Text style={[styles.micError, { color: c.textLow }]}>{t('sprechenA2.mic.permissionDenied')}</Text>
            ) : micError === 'unavailable' ? (
              <Text style={[styles.micError, { color: c.textLow }]}>{t('sprechenA2.mic.notAvailable')}</Text>
            ) : null}

            <PrimaryButton
              label={t('sprechenA2.feedback.next')}
              onPress={handleSubmit}
              disabled={isListening}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          <FeedbackCard
            feedback={feedback}
            step={currentStep}
            bonuses={bonuses}
            onNext={handleNext}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PartIntroCard({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const c = useThemeColors();
  return (
    <GlassCard style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={[styles.partIcon, { backgroundColor: c.purpleBg }]}>
          <Ionicons name={icon} size={20} color={c.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.partNum, { color: c.textLow }]}>Teil {number}</Text>
          <Text style={[styles.partTitle, { color: c.textHigh }]}>{title}</Text>
        </View>
      </View>
      <Text style={[styles.partDesc, { color: c.textLow }]}>{description}</Text>
    </GlassCard>
  );
}

function StepCard({ step }: { step: Step }) {
  const c = useThemeColors();
  const t = useT();

  if (step.kind === 'teil1') {
    const cat = t(`sprechenA2.teil1.categories.${step.prompt.category}` as Parameters<typeof t>[0]);
    return (
      <GlassCard>
        <Text style={[styles.stepCategory, { color: c.textLow }]}>{cat.toUpperCase()}</Text>
        <Text style={[styles.stepQuestion, { color: c.textHigh }]}>{step.prompt.question.de}</Text>
        <Text style={[styles.stepTr, { color: c.textLow }]}>{step.prompt.question.tr}</Text>
        <Pressable
          onPress={() => speakGerman(step.prompt.question.de, { rate: SPRECHEN_RATE })}
          style={[styles.speakerBtn, { borderColor: c.border, borderRadius: radius.pill }]}
        >
          <Ionicons name="volume-high" size={14} color={c.purple} />
          <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '600', color: c.purpleLight }}>Tekrar dinle</Text>
        </Pressable>
      </GlassCard>
    );
  }

  if (step.kind === 'teil2-monolog') {
    return (
      <GlassCard>
        <Text style={[styles.stepAccentLabel, { color: c.purpleLight }]}>AUFGABENBLATT</Text>
        <Text style={[styles.stepTitle, { color: c.textHigh }]}>{step.theme.title.de}</Text>
        <Text style={[styles.stepTr, { color: c.textLow }]}>{step.theme.title.tr}</Text>
        <Text style={[styles.stepCategory, { color: c.textLow, marginTop: spacing.md }]}>
          {t('sprechenA2.teil2.leitfragenLabel').toUpperCase()}
        </Text>
        {step.theme.leitfragen.map((l, i) => (
          <View key={i} style={{ marginBottom: spacing.sm }}>
            <Text style={[styles.stepQuestion, { color: c.textHigh, fontSize: 15, lineHeight: 22 }]}>· {l.de}</Text>
            <Text style={[styles.stepTr, { color: c.textLow }]}>{l.tr}</Text>
          </View>
        ))}
      </GlassCard>
    );
  }

  if (step.kind === 'teil2-followup') {
    return (
      <GlassCard>
        <Text style={[styles.stepCategory, { color: c.textLow }]}>
          {step.theme.title.de.toUpperCase()}
        </Text>
        <Text style={[styles.stepAccentLabel, { color: c.purpleLight }]}>JÜRİ SORUSU</Text>
        <Text style={[styles.stepQuestion, { color: c.textHigh }]}>{step.followup.question.de}</Text>
        <Text style={[styles.stepTr, { color: c.textLow }]}>{step.followup.question.tr}</Text>
      </GlassCard>
    );
  }

  if (step.kind === 'teil3-examiner') {
    return (
      <View>
        {step.isFirstOfScenario ? (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <Text style={[styles.stepAccentLabel, { color: c.purpleLight }]}>
              {t('sprechenA2.teil3.setupLabel').toUpperCase()} · {step.scenario.title.de}
            </Text>
            <Text style={[styles.stepPrompt, { color: c.textMed }]}>{step.scenario.setup.de}</Text>
            <Text style={[styles.stepTr, { color: c.textLow }]}>{step.scenario.setup.tr}</Text>
            <Text style={[styles.stepAccentLabel, { color: c.purpleLight, marginTop: spacing.md }]}>
              {t('sprechenA2.teil3.talkingPointsLabel').toUpperCase()}
            </Text>
            {step.scenario.talkingPoints.map((p, i) => (
              <Text key={i} style={{ fontSize: 13, color: c.textMed, marginBottom: 2 }}>
                · {p.de} <Text style={{ color: c.textLow }}>({p.tr})</Text>
              </Text>
            ))}
          </GlassCard>
        ) : null}
        <GlassCard>
          <Text style={[styles.stepAccentLabel, { color: c.purpleLight }]}>👤 PARTNER</Text>
          <Text style={[styles.stepQuestion, { color: c.textHigh }]}>{step.turn.prompt.de}</Text>
          <Text style={[styles.stepTr, { color: c.textLow }]}>{step.turn.prompt.tr}</Text>
          <Pressable
            onPress={() => speakGerman(step.turn.prompt.de, { rate: SPRECHEN_RATE })}
            style={[styles.speakerBtn, { borderColor: c.border, borderRadius: radius.pill }]}
          >
            <Ionicons name="volume-high" size={14} color={c.purple} />
            <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '600', color: c.purpleLight }}>Tekrar dinle</Text>
          </Pressable>
        </GlassCard>
      </View>
    );
  }

  // teil3-user
  return (
    <View>
      {step.lastExaminerLine ? (
        <GlassCard style={{ marginBottom: spacing.md, opacity: 0.7 }}>
          <Text style={[styles.stepCategory, { color: c.textLow }]}>👤 PARTNER</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMed }}>{step.lastExaminerLine}</Text>
        </GlassCard>
      ) : null}
      <GlassCard>
        <Text style={[styles.stepAccentLabel, { color: c.purpleLight }]}>
          🗣️ {t('sprechenA2.teil3.yourTurn').toUpperCase()}
        </Text>
        <Text style={[styles.stepPrompt, { color: c.textMed }]}>{step.turn.prompt.tr}</Text>
      </GlassCard>
    </View>
  );
}

function FeedbackCard({
  feedback,
  step,
  bonuses,
  onNext,
}: {
  feedback: FeedbackKind;
  step: Step;
  bonuses: { perfekt: boolean; sub: boolean };
  onNext: () => void;
}) {
  const c = useThemeColors();
  const t = useT();

  const tone =
    feedback === 'ok'
      ? { bg: c.correctBg, border: c.neon }
      : feedback === 'okay'
        ? { bg: c.purpleBg, border: c.purple }
        : { bg: 'rgba(245,158,11,0.15)', border: c.gold };

  const isMonolog = step.kind === 'teil2-monolog';
  const message = isMonolog
    ? feedback === 'ok'
      ? t('sprechenA2.feedback.monologGreat')
      : feedback === 'okay'
        ? t('sprechenA2.feedback.monologOkay')
        : feedback === 'short'
          ? t('sprechenA2.feedback.monologShort', { min: (step as { kind: 'teil2-monolog'; theme: SprechenA2Teil2Theme }).theme.monologMinWords })
          : t('sprechenA2.feedback.monologMissing')
    : feedback === 'ok'
      ? t('sprechenA2.feedback.great')
      : feedback === 'short'
        ? t('sprechenA2.feedback.tooShort')
        : t('sprechenA2.feedback.missing');

  const models = useMemo(() => {
    if (step.kind === 'teil1')
      return [{ de: step.prompt.modelAnswer.de, tr: step.prompt.modelAnswer.tr }];
    if (step.kind === 'teil2-monolog')
      return [{ de: step.theme.modelMonolog.de, tr: step.theme.modelMonolog.tr }];
    if (step.kind === 'teil2-followup')
      return [{ de: step.followup.modelAnswer.de, tr: step.followup.modelAnswer.tr }];
    if (step.kind === 'teil3-user' && step.turn.modelAnswer)
      return [{ de: step.turn.modelAnswer.de, tr: step.turn.modelAnswer.tr }];
    return [];
  }, [step]);

  return (
    <View style={{ marginTop: spacing.base }}>
      <View style={[styles.feedbackPill, { backgroundColor: tone.bg, borderColor: tone.border, borderRadius: radius.lg }]}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: feedback === 'ok' ? c.neon : feedback === 'okay' ? c.purpleLight : c.gold }}>
          {message}
        </Text>
        {isMonolog && (bonuses.perfekt || bonuses.sub) ? (
          <View style={{ marginTop: 6 }}>
            {bonuses.perfekt ? (
              <Text style={{ fontSize: 12, color: c.textMed, marginTop: 2 }}>{t('sprechenA2.feedback.bonusPerfekt')}</Text>
            ) : null}
            {bonuses.sub ? (
              <Text style={{ fontSize: 12, color: c.textMed, marginTop: 2 }}>{t('sprechenA2.feedback.bonusSubordinate')}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {models.length > 0 ? (
        <GlassCard style={{ marginTop: spacing.md }}>
          <Text style={[styles.stepCategory, { color: c.textLow }]}>
            {t('sprechenA2.feedback.model').toUpperCase()}
          </Text>
          {models.map((m, i) => (
            <View key={i} style={{ marginBottom: i === models.length - 1 ? 0 : spacing.md }}>
              <Text style={{ fontWeight: '600', fontSize: 15, lineHeight: 22, color: c.textHigh }}>{m.de}</Text>
              <Text style={{ fontSize: 13, color: c.textLow, marginTop: 2 }}>{m.tr}</Text>
            </View>
          ))}
        </GlassCard>
      ) : null}

      <PrimaryButton label={t('sprechenA2.feedback.next')} onPress={onNext} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  counter: { fontSize: 13, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.md },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  introTitle: { fontSize: 26, fontWeight: '900', marginTop: spacing.md },
  introSub: { fontSize: 14, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  tipTitle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  tipBody: { fontSize: 13, lineHeight: 20 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
  partIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  partNum: { fontSize: 11, marginBottom: 2 },
  partTitle: { fontSize: 15, fontWeight: '700' },
  partDesc: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  stepCategory: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.sm },
  stepAccentLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.sm },
  stepTitle: { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  stepQuestion: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  stepTr: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  stepPrompt: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  speakerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, alignSelf: 'flex-start', marginTop: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, fontSize: 16, textAlignVertical: 'top' },
  micBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5 },
  micText: { fontSize: 15, fontWeight: '600' },
  micError: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  feedbackPill: { paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scoreRing: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  scorePercent: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  resultTitle: { fontSize: 22, fontWeight: '800', marginTop: spacing.lg, textAlign: 'center' },
  resultSub: { fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
  resultNote: { fontSize: 13, marginTop: spacing.md, textAlign: 'center', lineHeight: 20 },
});
