// A1 Sprechen exam simulator.
// Drives the learner through Teil 1 (Sich vorstellen), Teil 2 (Themen & Wort)
// and Teil 3 (Bitten formulieren) using the offline content pool in
// lib/sprechen-a1.ts. Fully offline — no API calls.
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
import {
  TEIL1_PROMPTS,
  TEIL2_THEMES,
  TEIL3_CARDS,
  DEFAULT_TEIL1_COUNT,
  DEFAULT_TEIL2_THEME_COUNT,
  DEFAULT_TEIL2_CARDS_PER_THEME,
  DEFAULT_TEIL3_CARD_COUNT,
  gradeResponse,
  pickN,
  type SprechenPart,
  type SprechenTeil1Prompt,
  type SprechenTeil2Card,
  type SprechenTeil2Theme,
  type SprechenTeil3Card,
} from '@/lib/sprechen-a1';

type Step =
  | { kind: 'teil1'; prompt: SprechenTeil1Prompt }
  | { kind: 'teil2-ask'; theme: SprechenTeil2Theme; card: SprechenTeil2Card }
  | { kind: 'teil2-answer'; theme: SprechenTeil2Theme; card: SprechenTeil2Card }
  | { kind: 'teil3'; card: SprechenTeil3Card };

function partOf(step: Step): SprechenPart {
  if (step.kind === 'teil1') return 'teil1';
  if (step.kind === 'teil3') return 'teil3';
  return 'teil2';
}

function buildDeck(): Step[] {
  const steps: Step[] = pickN(TEIL1_PROMPTS, DEFAULT_TEIL1_COUNT).map((prompt) => ({
    kind: 'teil1' as const,
    prompt,
  }));
  const themes = pickN(TEIL2_THEMES, DEFAULT_TEIL2_THEME_COUNT);
  for (const theme of themes) {
    const cards = pickN(theme.cards, DEFAULT_TEIL2_CARDS_PER_THEME);
    cards.forEach((card, i) => {
      const kind = i % 2 === 0 ? ('teil2-ask' as const) : ('teil2-answer' as const);
      steps.push({ kind, theme, card });
    });
  }
  for (const card of pickN(TEIL3_CARDS, DEFAULT_TEIL3_CARD_COUNT)) {
    steps.push({ kind: 'teil3' as const, card });
  }
  return steps;
}

const SPRECHEN_RATE = 1.0;

export default function SprechenA1Screen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isPremium = useUserStore((s) => s.isPremium);

  const [deck, setDeck] = useState<Step[]>(() => buildDeck());
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'ok' | 'short' | 'missing' | null>(null);
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
    return () => {
      try { speechRecognition?.stop(); } catch { /* no-op */ }
    };
  }, []);

  useEffect(() => {
    if (!isPremium) router.replace('/shop');
  }, [isPremium]);

  const currentStep = deck[index];
  useEffect(() => {
    if (phase !== 'quiz' || !currentStep) return;
    if (currentStep.kind === 'teil1') {
      speakGerman(currentStep.prompt.question.de, { rate: SPRECHEN_RATE });
    } else if (currentStep.kind === 'teil2-answer') {
      speakGerman(currentStep.card.modelQuestion.de, { rate: SPRECHEN_RATE });
    }
  }, [phase, currentStep]);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  useEffect(() => {
    void preloadGermanVoice();
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

  const startSession = useCallback(() => {
    setDeck(buildDeck());
    setPhase('quiz');
    setIndex(0);
    setInput('');
    setFeedback(null);
    setCorrect(0);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentStep || feedback !== null) return;
    const accept =
      currentStep.kind === 'teil1'
        ? currentStep.prompt.acceptKeywords
        : currentStep.kind === 'teil3'
          ? currentStep.card.acceptKeywords
          : currentStep.card.acceptKeywords;
    const grade = gradeResponse(input, accept);
    let next: 'ok' | 'short' | 'missing';
    if (grade.words === 0 || grade.words < 2) {
      next = 'short';
    } else if (!grade.ok) {
      next = 'missing';
    } else {
      next = 'ok';
      setCorrect((n) => n + 1);
    }
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
    }
  }, [deck.length, index]);

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[c.purpleGlow, 'transparent']}
          style={styles.heroGrad}
          pointerEvents="none"
        />
        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
          <IconButton icon="arrow-back" accessibilityLabel="Geri" onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: c.textHigh }]}>{t('sprechen.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.base, paddingBottom: 96 + insets.bottom }}
        >
          <View style={[styles.badge, { backgroundColor: c.purpleBg, borderRadius: radius.pill }]}>
            <Text style={[styles.badgeText, { color: c.purpleLight }]}>{t('sprechen.intro.badge')}</Text>
          </View>

          <Text style={[styles.introTitle, { color: c.textHigh }]}>{t('sprechen.intro.title')}</Text>
          <Text style={[styles.introSub, { color: c.textLow }]}>{t('sprechen.intro.subtitle')}</Text>

          <PartIntroCard number={1} title={t('sprechen.intro.teil1Label')} description={t('sprechen.intro.teil1Desc')} icon="person-circle" />
          <PartIntroCard number={2} title={t('sprechen.intro.teil2Label')} description={t('sprechen.intro.teil2Desc')} icon="chatbubble" />
          <PartIntroCard number={3} title={t('sprechen.intro.teil3Label')} description={t('sprechen.intro.teil3Desc')} icon="sparkles" />

          <GlassCard style={{ marginTop: spacing.sm, borderColor: c.purpleBg, borderWidth: 1 }}>
            <Text style={[styles.tipTitle, { color: c.purpleLight }]}>{t('sprechen.intro.tipTitle')}</Text>
            <Text style={[styles.tipBody, { color: c.textLow }]}>{t('sprechen.intro.tipBody')}</Text>
          </GlassCard>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.base, paddingTop: spacing.md, backgroundColor: c.bg, borderTopColor: c.border }]}>
          <PrimaryButton label={t('sprechen.intro.start')} onPress={startSession} />
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
          <Text style={[styles.resultTitle, { color: c.textHigh }]}>{t('sprechen.result.title')}</Text>
          <Text style={[styles.resultSub, { color: c.textLow }]}>{t('sprechen.result.score', { correct, total })}</Text>
          <Text style={[styles.resultNote, { color: c.textMed }]}>{passed ? t('sprechen.result.passed') : t('sprechen.result.needsWork')}</Text>

          <GlassCard style={{ width: '100%', marginTop: spacing.lg }}>
            <Text style={[styles.tipTitle, { color: c.purpleLight }]}>💡 {t('sprechen.result.examDayTitle')}</Text>
            <Text style={[styles.tipBody, { color: c.textLow }]}>{t('sprechen.result.examDayBody')}</Text>
          </GlassCard>

          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.lg }}>
            <PrimaryButton label={t('sprechen.result.retry')} onPress={startSession} />
            <SecondaryButton label={t('sprechen.result.back')} variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  if (!currentStep) return null;
  const part = partOf(currentStep);
  const partLabel = t(`sprechen.partLabel.${part}` as Parameters<typeof t>[0]);

  const placeholder =
    currentStep.kind === 'teil1'
      ? t('sprechen.teil1.placeholder')
      : currentStep.kind === 'teil2-ask'
        ? t('sprechen.teil2.placeholderAsk')
        : currentStep.kind === 'teil2-answer'
          ? t('sprechen.teil2.placeholderAnswer')
          : t('sprechen.teil3.placeholder');

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
          {t('sprechen.progress', { current: index + 1, total: deck.length })}
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

        {feedback === null ? (
          <View style={{ marginTop: spacing.base }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={placeholder}
              placeholderTextColor={c.textMuted}
              multiline
              editable={!isListening}
              style={[styles.input, { backgroundColor: c.surface, borderColor: isListening ? c.red : c.border, borderRadius: radius.lg, color: c.textHigh }]}
            />

            <Pressable
              onPress={toggleMic}
              style={[styles.micBar, {
                backgroundColor: isListening ? 'rgba(239,68,68,0.15)' : c.purpleBg,
                borderColor: isListening ? c.red : c.purple,
                borderRadius: radius.lg,
                marginTop: spacing.md,
              }]}
            >
              <Ionicons name={isListening ? 'stop' : 'mic'} size={22} color={isListening ? c.red : c.purple} />
              <Text style={[styles.micText, { color: isListening ? c.red : c.textMed, marginLeft: spacing.md }]}>
                {isListening ? t('sprechen.mic.listening') : t('sprechen.mic.tapToSpeak')}
              </Text>
            </Pressable>

            {micError === 'permission' ? (
              <Text style={[styles.micError, { color: c.textLow }]}>{t('sprechen.mic.permissionDenied')}</Text>
            ) : micError === 'unavailable' ? (
              <Text style={[styles.micError, { color: c.textLow }]}>{t('sprechen.mic.notAvailable')}</Text>
            ) : null}

            <PrimaryButton
              label={t('sprechen.feedback.next')}
              onPress={handleSubmit}
              disabled={isListening}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          <FeedbackCard feedback={feedback} step={currentStep} onNext={handleNext} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PartIntroCard({ number, title, description, icon }: { number: number; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }) {
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
    const cat = t(`sprechen.teil1.categories.${step.prompt.category}` as Parameters<typeof t>[0]);
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

  if (step.kind === 'teil2-ask') {
    return (
      <GlassCard>
        <Text style={[styles.stepCategory, { color: c.textLow }]}>{t('sprechen.teil2.themeLabel').toUpperCase()}</Text>
        <Text style={[styles.stepQuestion, { color: c.textHigh }]}>{step.theme.theme.de}</Text>
        <Text style={[styles.stepTr, { color: c.textLow }]}>{step.theme.theme.tr}</Text>
        <View style={[styles.wordChip, { backgroundColor: c.purpleBg, borderRadius: radius.lg }]}>
          <Text style={[styles.stepCategory, { color: c.purpleLight }]}>{t('sprechen.teil2.wordLabel').toUpperCase()}</Text>
          <Text style={[styles.wordDisplay, { color: c.textHigh }]}>{step.card.word}</Text>
          <Text style={[styles.stepTr, { color: c.textLow }]}>{step.card.wordTr}</Text>
        </View>
        <Text style={[styles.stepPrompt, { color: c.textMed }]}>{t('sprechen.teil2.askPrompt')}</Text>
      </GlassCard>
    );
  }

  if (step.kind === 'teil2-answer') {
    return (
      <GlassCard>
        <Text style={[styles.stepCategory, { color: c.textLow }]}>
          {t('sprechen.teil2.themeLabel').toUpperCase()} · {step.theme.theme.de}
        </Text>
        <Text style={[styles.stepQuestion, { color: c.textHigh }]}>{step.card.modelQuestion.de}</Text>
        <Text style={[styles.stepTr, { color: c.textLow }]}>{step.card.modelQuestion.tr}</Text>
        <Text style={[styles.stepPrompt, { color: c.purpleLight }]}>{t('sprechen.teil2.answerPrompt')}</Text>
      </GlassCard>
    );
  }

  // teil3
  return (
    <GlassCard style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
      {/* Daireli emoji */}
      <View style={[styles.emojiCircle, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
        <Text style={styles.emojiLarge}>{step.card.emoji}</Text>
      </View>

      {/* Konu adı */}
      <Text style={[styles.teil3Topic, { color: c.textHigh }]}>{step.card.topic.de}</Text>

      {/* Senaryo pill */}
      <View style={[styles.scenePill, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
        <Text style={[styles.scenePillText, { color: c.purpleLight }]}>📍 {step.card.scene.tr}</Text>
      </View>

      {/* Prompt */}
      <Text style={[styles.stepPrompt, { color: c.textMed, textAlign: 'center', marginTop: spacing.md }]}>
        {t('sprechen.teil3.prompt')}
      </Text>
    </GlassCard>
  );
}

function FeedbackCard({ feedback, step, onNext }: { feedback: 'ok' | 'short' | 'missing'; step: Step; onNext: () => void }) {
  const c = useThemeColors();
  const t = useT();

  const tone = feedback === 'ok'
    ? { bg: c.correctBg, border: c.neon }
    : { bg: 'rgba(245,158,11,0.15)', border: c.gold };

  const message = feedback === 'ok'
    ? t('sprechen.feedback.great')
    : feedback === 'short'
      ? t('sprechen.feedback.tooShort')
      : t('sprechen.feedback.missing');

  const models: { de: string; tr: string }[] = useMemo(() => {
    if (step.kind === 'teil1') return [{ de: step.prompt.modelAnswer.de, tr: step.prompt.modelAnswer.tr }];
    if (step.kind === 'teil2-ask') return [{ de: step.card.modelQuestion.de, tr: step.card.modelQuestion.tr }];
    if (step.kind === 'teil2-answer') return [{ de: step.card.modelAnswer.de, tr: step.card.modelAnswer.tr }];
    return step.card.modelRequests.map((r) => ({ de: r.de, tr: r.tr }));
  }, [step]);

  return (
    <View style={{ marginTop: spacing.base }}>
      <View style={[styles.feedbackPill, { backgroundColor: tone.bg, borderColor: tone.border, borderRadius: radius.lg }]}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: feedback === 'ok' ? c.neon : c.gold }}>{message}</Text>
      </View>

      <GlassCard style={{ marginTop: spacing.md }}>
        <Text style={[styles.stepCategory, { color: c.textLow }]}>{t('sprechen.feedback.model').toUpperCase()}</Text>
        {models.map((m, i) => (
          <View key={i} style={{ marginBottom: i === models.length - 1 ? 0 : spacing.md }}>
            <Text style={{ fontWeight: '600', fontSize: 15, lineHeight: 22, color: c.textHigh }}>{m.de}</Text>
            <Text style={{ fontSize: 13, color: c.textLow, marginTop: 2 }}>{m.tr}</Text>
          </View>
        ))}

        {step.kind === 'teil3' ? (
          <View style={{ marginTop: spacing.base }}>
            <Text style={[styles.stepCategory, { color: c.textLow }]}>{t('sprechen.teil3.partnerReplies').toUpperCase()}</Text>
            {step.card.modelReplies.map((r, i) => (
              <View key={i} style={{ marginBottom: i === step.card.modelReplies.length - 1 ? 0 : spacing.sm }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: c.textMed }}>{r.de}</Text>
                <Text style={{ fontSize: 12, color: c.textLow }}>{r.tr}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {feedback !== 'ok' && step.kind === 'teil1' && step.prompt.hint ? (
          <View style={{ marginTop: spacing.base }}>
            <Text style={[styles.stepCategory, { color: c.textLow }]}>{t('sprechen.teil1.hint').toUpperCase()}</Text>
            <Text style={{ fontSize: 13, lineHeight: 20, color: c.textLow }}>{step.prompt.hint.tr}</Text>
          </View>
        ) : null}
      </GlassCard>

      <PrimaryButton label={t('sprechen.feedback.next')} onPress={onNext} style={{ marginTop: spacing.md }} />
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
  stepQuestion: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  stepTr: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  stepPrompt: { fontSize: 14, marginTop: spacing.md, fontWeight: '600', lineHeight: 22 },
  wordChip: { paddingHorizontal: 16, paddingVertical: 14, alignSelf: 'flex-start', minWidth: 180, marginTop: spacing.md },
  wordDisplay: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  input: { minHeight: 100, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, fontSize: 16, textAlignVertical: 'top' },
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
  emojiCircle: {
    width: 132, height: 132, borderRadius: 66,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3, shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  emojiLarge: { fontSize: 88, lineHeight: 100 },
  teil3Topic: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: spacing.md, lineHeight: 30 },
  scenePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1,
    marginTop: spacing.sm,
  },
  scenePillText: { fontSize: 13, fontWeight: '700' },
  speakerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, alignSelf: 'flex-start', marginTop: 14 },
});
