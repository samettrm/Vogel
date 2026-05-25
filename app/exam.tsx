import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, PrimaryButton, SecondaryButton, IconButton, ProgressBar } from '@/src/components/ui';
import { useThemeColors, spacing, radius, getLevelColor } from '@/src/theme';
import { useT } from '@/src/i18n';
import { useUserStore } from '@/src/store/useUserStore';
import { getLevelWords, CEFR_LEVELS, type CefrLevel } from '@/services/words/word-service';
import { READING_PASSAGES } from '@/lib/german-reading';
import type { WordSummary } from '@/services/api/types';
import { logActivity, touchStreak, recordExamScore } from '@/lib/storage';
import { speakGerman } from '@/lib/german-tts';

const VOCAB_COUNT = 8;
const LISTENING_COUNT = 6;
const READING_COUNT = 4;
const GRAMMAR_COUNT = 6;
const PASS_PERCENT = 60;
const ARTICLES = ['der', 'die', 'das'];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

type Section = 'vocab' | 'listening' | 'reading' | 'grammar';

interface SectionStyle {
  main: string;
  bg: string;
  glow: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradColors: readonly [string, string];
}

interface Question {
  section: Section;
  display: string;
  speak?: string;
  passage?: string;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMeaningQuestions(
  words: WordSummary[],
  count: number,
  section: 'vocab' | 'listening',
): Question[] {
  const pool = words.filter((w) => w.shortDef && w.shortDef.trim().length > 0);
  if (pool.length < 4) return [];
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((word) => {
      const correct = word.shortDef.trim();
      const used = new Set([correct.toLowerCase()]);
      const distractors: string[] = [];
      let guard = 0;
      while (distractors.length < 3 && guard < 300) {
        guard += 1;
        const cand = pool[Math.floor(Math.random() * pool.length)].shortDef.trim();
        if (cand && !used.has(cand.toLowerCase())) {
          used.add(cand.toLowerCase());
          distractors.push(cand);
        }
      }
      const options = shuffle([correct, ...distractors]);
      const full = word.article ? `${word.article} ${word.word}` : word.word;
      return {
        section,
        display: section === 'listening' ? '' : full,
        speak: section === 'listening' ? full : undefined,
        options,
        correctIndex: options.indexOf(correct),
      };
    })
    .filter((q) => q.options.length === 4);
}

function buildArticleQuestions(words: WordSummary[], count: number): Question[] {
  const nouns = words.filter(
    (w) => w.type === 'noun' && !!w.article && ARTICLES.includes(w.article),
  );
  return shuffle(nouns)
    .slice(0, Math.min(count, nouns.length))
    .map((w) => ({
      section: 'grammar' as const,
      display: w.word,
      options: ARTICLES,
      correctIndex: ARTICLES.indexOf(w.article as string),
    }));
}

function buildReadingQuestions(level: CefrLevel, count: number): Question[] {
  const atLevel = shuffle(READING_PASSAGES.filter((p) => p.level === level));
  const others = shuffle(READING_PASSAGES.filter((p) => p.level !== level));
  const out: Question[] = [];
  for (const passage of [...atLevel, ...others]) {
    for (const rq of passage.questions) {
      out.push({
        section: 'reading',
        display: rq.q,
        passage: passage.text,
        options: rq.options,
        correctIndex: rq.correct,
      });
      if (out.length >= count) return out;
    }
  }
  return out;
}

function buildExam(words: WordSummary[], level: CefrLevel): Question[] {
  return [
    ...buildMeaningQuestions(words, VOCAB_COUNT, 'vocab'),
    ...buildMeaningQuestions(words, LISTENING_COUNT, 'listening'),
    ...buildReadingQuestions(level, READING_COUNT),
    ...buildArticleQuestions(words, GRAMMAR_COUNT),
  ];
}

export default function ExamScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const params = useLocalSearchParams<{ level?: string }>();
  const isPremium = useUserStore((s) => s.isPremium);
  const level: CefrLevel = CEFR_LEVELS.includes(params.level as CefrLevel)
    ? (params.level as CefrLevel)
    : 'A1';

  const lc = getLevelColor(level, c);

  // Section accent colors
  const sectionStyle: Record<Section, SectionStyle> = {
    vocab:     { main: c.neon,    bg: c.neonBg,    glow: c.neonGlow,    icon: 'book',         gradColors: [c.neonGlow, 'transparent'] },
    listening: { main: c.purple,  bg: c.purpleBg,  glow: c.purpleGlow,  icon: 'headset',      gradColors: [c.purpleGlow, 'transparent'] },
    reading:   { main: c.gold,    bg: c.goldBg,    glow: c.goldGlow,    icon: 'newspaper',    gradColors: [c.goldGlow, 'transparent'] },
    grammar:   { main: c.cyan,    bg: c.cyanBg,    glow: c.cyanGlow,    icon: 'pencil',       gradColors: [c.cyanGlow, 'transparent'] },
  };

  const [questions, setQuestions] = useState<Question[]>(() =>
    buildExam(getLevelWords(level), level),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [phase, setPhase] = useState<'quiz' | 'done'>('quiz');

  useEffect(() => {
    if (!isPremium) router.replace('/shop');
  }, [isPremium]);

  useEffect(() => {
    const q = questions[index];
    if (phase === 'quiz' && q && q.section === 'listening' && q.speak) {
      speakGerman(q.speak, { rate: 0.4 });
    }
  }, [index, phase, questions]);

  const restart = useCallback(() => {
    setQuestions(buildExam(getLevelWords(level), level));
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setPhase('quiz');
  }, [level]);

  const handleAnswer = (optionIndex: number) => {
    const question = questions[index];
    if (selected !== null || !question) return;
    setSelected(optionIndex);
    const isRight = optionIndex === question.correctIndex;
    Haptics.notificationAsync(
      isRight ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    const newCorrect = correct + (isRight ? 1 : 0);
    if (isRight) setCorrect(newCorrect);
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        const percent = Math.round((newCorrect / questions.length) * 100);
        touchStreak();
        logActivity(1);
        recordExamScore(level, percent);
        setPhase('done');
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 850);
  };

  // ── Not enough words ─────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
          <IconButton icon="close" accessibilityLabel="Kapat" onPress={() => router.back()} />
        </View>
        <View style={styles.centered}>
          <Text style={{ color: c.textLow, textAlign: 'center', fontSize: 14 }}>
            {t('exam.empty')}
          </Text>
        </View>
      </View>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total = questions.length;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= PASS_PERCENT;
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={passed ? [c.neonGlow, c.purpleGlow, 'transparent'] : [c.purpleGlow, 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.centered}>
          {/* Score ring with glow */}
          <View style={[
            styles.scoreRingWrap,
            {
              shadowColor: passed ? c.neon : c.purple,
              shadowOpacity: 0.8,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 0 },
              elevation: 16,
            },
          ]}>
            <View style={[
              styles.scoreRing,
              {
                backgroundColor: passed ? c.neonBg : c.purpleBg,
                borderColor: passed ? c.neon : c.purple,
                borderRadius: radius.xl,
              },
            ]}>
              <Text style={{ fontSize: 40 }}>{passed ? '🏆' : '💪'}</Text>
              <Text style={[styles.scorePercent, { color: passed ? c.neon : c.purpleLight }]}>
                %{percent}
              </Text>
              <Text style={[styles.scoreLabel, { color: passed ? c.neonLight : c.purpleLight }]}>
                {passed ? 'GEÇTİN!' : 'DEVAM ET'}
              </Text>
            </View>
          </View>

          <Text style={[styles.resultTitle, { color: c.textHigh }]}>
            {passed ? t('exam.result.passedTitle') : t('exam.result.failedTitle')}
          </Text>

          {/* Score breakdown */}
          <View style={[styles.scoreBreakdown, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreItemVal, { color: c.neon }]}>{correct}</Text>
              <Text style={[styles.scoreItemLbl, { color: c.textLow }]}>Doğru</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: c.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreItemVal, { color: c.red }]}>{questions.length - correct}</Text>
              <Text style={[styles.scoreItemLbl, { color: c.textLow }]}>Yanlış</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: c.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreItemVal, { color: lc.main }]}>{level}</Text>
              <Text style={[styles.scoreItemLbl, { color: c.textLow }]}>Seviye</Text>
            </View>
          </View>

          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.lg }}>
            <PrimaryButton label={t('exam.result.retry')} onPress={restart} />
            <SecondaryButton
              label={t('exam.result.study')}
              variant="purple"
              onPress={() => router.replace({ pathname: '/flashcards', params: { level } })}
            />
            <SecondaryButton
              label={t('exam.result.back')}
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const question = questions[index];
  const sc = sectionStyle[question.section];
  const prompt =
    question.section === 'vocab'
      ? t('exam.vocabPrompt')
      : question.section === 'listening'
        ? t('exam.listenPrompt')
        : question.section === 'reading'
          ? t('exam.readPrompt')
          : t('exam.articlePrompt');

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Dynamic section-colored gradient */}
      <LinearGradient
        colors={sc.gradColors}
        style={styles.heroGrad}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
        <IconButton icon="close" accessibilityLabel="Kapat" onPress={() => router.back()} />
        <Text style={[styles.questionCounter, { color: c.textLow }]}>
          {t('exam.question', { current: index + 1, total: questions.length })}
        </Text>
        <View style={[styles.levelChip, { backgroundColor: lc.bg, borderColor: lc.main }]}>
          <Text style={[styles.levelChipText, { color: lc.main }]}>{level}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm }}>
        <ProgressBar value={index / questions.length} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 40 }}
      >
        {/* Section badge — colored by section */}
        <View style={[
          styles.sectionBadge,
          { backgroundColor: sc.bg, borderRadius: radius.pill, borderColor: sc.main, borderWidth: 1 },
        ]}>
          <Ionicons name={sc.icon} size={13} color={sc.main} />
          <Text style={[styles.sectionLabel, { color: sc.main }]}>
            {t(`exam.section.${question.section}` as Parameters<typeof t>[0])}
          </Text>
        </View>

        {/* Question card — glowing border matching section color */}
        {question.section === 'reading' ? (
          <>
            <GlassCard style={{ marginBottom: spacing.md, borderColor: sc.main, borderWidth: 1 }}>
              <Text style={[styles.passageText, { color: c.textMed }]}>{question.passage}</Text>
            </GlassCard>
            <GlassCard style={{ borderColor: sc.main, borderWidth: 1, shadowColor: sc.main, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}>
              <Text style={[styles.promptLabel, { color: sc.main }]}>{prompt}</Text>
              <Text style={[styles.questionText, { color: c.textHigh }]}>{question.display}</Text>
            </GlassCard>
          </>
        ) : (
          <GlassCard style={{
            alignItems: 'center',
            paddingVertical: spacing.xl,
            borderColor: sc.main,
            borderWidth: 1,
            shadowColor: sc.main,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          }}>
            <Text style={[styles.promptLabel, { color: sc.main }]}>{prompt}</Text>

            {question.section === 'listening' ? (
              <Pressable
                onPress={() => question.speak && speakGerman(question.speak, { rate: 0.4 })}
                style={{ alignItems: 'center', marginTop: spacing.base }}
              >
                {/* Outer glow ring */}
                <View style={[
                  styles.playRingOuter,
                  {
                    borderColor: sc.glow,
                    shadowColor: sc.main,
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 10,
                  },
                ]}>
                  <View style={[styles.playCircle, { backgroundColor: sc.bg, borderColor: sc.main, borderWidth: 2.5 }]}>
                    <Ionicons name="volume-high" size={42} color={sc.main} />
                  </View>
                </View>
                <Text style={[styles.replayHint, { color: sc.main }]}>
                  {t('exam.replay')}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.displayWord, { color: c.textHigh }]}>{question.display}</Text>
            )}
          </GlassCard>
        )}

        {/* Options with A/B/C/D prefixes */}
        <View style={{ gap: spacing.md, marginTop: spacing.base }}>
          {question.options.map((opt, i) => {
            const letter = OPTION_LETTERS[i] ?? String(i + 1);
            let bg: string = c.surface;
            let border: string = c.border;
            let textColor: string = c.textHigh;
            let letterBg: string = c.surfaceElevated;
            let letterColor: string = c.textLow;

            if (selected !== null) {
              if (i === question.correctIndex) {
                bg = c.correctBg;
                border = c.neon;
                textColor = c.neon;
                letterBg = c.neon;
                letterColor = '#0F172A';
              } else if (i === selected) {
                bg = c.wrongBg;
                border = c.red;
                textColor = c.red;
                letterBg = c.red;
                letterColor = '#fff';
              }
            }

            return (
              <Pressable
                key={`${i}-${opt}`}
                onPress={() => handleAnswer(i)}
                disabled={selected !== null}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    borderRadius: radius.lg,
                    opacity: pressed ? 0.8 : 1,
                    shadowColor: selected !== null && i === question.correctIndex ? c.neon : 'transparent',
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                {/* Letter circle */}
                <View style={[styles.letterCircle, { backgroundColor: letterBg }]}>
                  <Text style={[styles.letterText, { color: letterColor }]}>{letter}</Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
                {selected !== null && i === question.correctIndex ? (
                  <Ionicons name="checkmark-circle" size={22} color={c.neon} />
                ) : selected === i ? (
                  <Ionicons name="close-circle" size={22} color={c.red} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  questionCounter: { fontSize: 13, fontWeight: '600' },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    minWidth: 44,
    alignItems: 'center',
  },
  levelChipText: { fontSize: 12, fontWeight: '900' },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  passageText: { fontSize: 14, lineHeight: 24 },
  promptLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  questionText: { fontSize: 16, fontWeight: '600', marginTop: spacing.sm, lineHeight: 26 },
  displayWord: { fontSize: 32, fontWeight: '900', marginTop: spacing.md, textAlign: 'center' },
  playRingOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayHint: { fontSize: 12, marginTop: spacing.md, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  scoreRingWrap: { borderRadius: radius.xl },
  scoreRing: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderRadius: radius.xl,
  },
  scorePercent: { fontSize: 36, fontWeight: '900', marginTop: 2 },
  scoreLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  resultTitle: { fontSize: 22, fontWeight: '800', marginTop: spacing.lg, textAlign: 'center' },
  scoreBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    width: '100%',
  },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreItemVal: { fontSize: 24, fontWeight: '900' },
  scoreItemLbl: { fontSize: 11, marginTop: 2 },
  scoreDivider: { width: 1, height: 36 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  letterCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontSize: 13, fontWeight: '800' },
  optionText: { fontSize: 15, fontWeight: '500', flex: 1 },
});
