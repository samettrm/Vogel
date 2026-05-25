import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard, PrimaryButton, SecondaryButton, IconButton, ProgressBar } from '@/src/components/ui';
import { useThemeColors, spacing, radius } from '@/src/theme';
import { useT } from '@/src/i18n';
import { useUserStore } from '@/src/store/useUserStore';
import { getLevelDeck, CEFR_LEVELS, type CefrLevel } from '@/services/words/word-service';
import type { DictionaryWord } from '@/services/api/types';
import {
  saveFlashSession,
  addLearnedWord,
  logActivity,
  touchStreak,
  getFlashSessionsToday,
} from '@/lib/storage';
import { speakGerman } from '@/lib/german-tts';

const FREE_FLASHCARD_DAILY_LIMIT = 5;
type Result = 'know' | 'hard' | 'again';
type Phase = 'checking' | 'ok' | 'blocked' | 'done';

export default function FlashcardsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isPremium = useUserStore((s) => s.isPremium);
  const params = useLocalSearchParams<{ level?: string }>();
  const level: CefrLevel = CEFR_LEVELS.includes(params.level as CefrLevel)
    ? (params.level as CefrLevel)
    : 'A1';

  const [phase, setPhase] = useState<Phase>('checking');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState({ know: 0, hard: 0, again: 0 });
  const [finalTotal, setFinalTotal] = useState(0);
  const [finalScores, setFinalScores] = useState({ know: 0, hard: 0, again: 0 });

  // Gate non-premium level access.
  useEffect(() => {
    if (!isPremium) {
      router.replace('/shop');
    }
  }, [isPremium]);

  // Check daily quota.
  useEffect(() => {
    if (!isPremium) return; // already redirected
    getFlashSessionsToday().then((n) => {
      setPhase(n >= FREE_FLASHCARD_DAILY_LIMIT ? 'blocked' : 'ok');
    });
  }, [isPremium]);

  const deck = useMemo<DictionaryWord[]>(() => getLevelDeck(level, 20), [level]);
  const current = deck[index];

  const handleResult = useCallback(
    async (result: Result) => {
      const next = { ...scores, [result]: scores[result] + 1 };
      setScores(next);
      setRevealed(false);

      if (result === 'know' || result === 'hard') {
        await logActivity(1);
        if (current) {
          await addLearnedWord({
            id: current.id,
            word: current.word,
            language: current.language,
            type: current.type,
            article: current.article,
            shortDef: current.shortDef,
          });
        }
      }

      if (index + 1 >= deck.length) {
        await touchStreak();
        await saveFlashSession({ ...next, total: deck.length });
        setFinalTotal(deck.length);
        setFinalScores(next);
        setPhase('done');
      } else {
        setIndex((i) => i + 1);
      }
    },
    [index, scores, deck, current],
  );

  // ── Checking ─────────────────────────────────────────────────────────────
  if (phase === 'checking') {
    return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  }

  // ── Daily limit blocked ───────────────────────────────────────────────────
  if (phase === 'blocked') {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[c.purpleGlow, 'transparent']}
          style={styles.heroBg}
          pointerEvents="none"
        />
        <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
          <IconButton icon="close" accessibilityLabel="Kapat" onPress={() => router.back()} />
        </View>
        <View style={styles.centered}>
          <Text style={{ fontSize: 56 }}>🎯</Text>
          <Text style={[styles.limitTitle, { color: c.textHigh }]}>
            {t('flashcards.limit.title')}
          </Text>
          <View style={[styles.quotaPill, { borderColor: c.neonGlow }]}>
            <Ionicons name="checkmark-circle" size={13} color={c.neon} />
            <Text style={[styles.quotaText, { color: c.neon }]}>
              {t('flashcards.limit.quota', {
                used: FREE_FLASHCARD_DAILY_LIMIT,
                total: FREE_FLASHCARD_DAILY_LIMIT,
              })}
            </Text>
          </View>
          <Text style={[styles.limitBody, { color: c.textLow }]}>
            {t('flashcards.limit.body', { limit: FREE_FLASHCARD_DAILY_LIMIT })}
          </Text>

          <View style={{ width: '100%', marginTop: spacing.xl }}>
            <GlassCard>
              <Text style={[styles.benefitsTitle, { color: c.textLow }]}>
                {t('flashcards.limit.benefitsTitle')}
              </Text>
              <BenefitRow text={t('flashcards.limit.benefit1')} color={c.neon} />
              <BenefitRow text={t('flashcards.limit.benefit2')} color={c.neon} />
              <BenefitRow text={t('flashcards.limit.benefit3')} color={c.neon} />
            </GlassCard>
          </View>

          <View style={{ width: '100%', marginTop: spacing.xl, gap: spacing.md }}>
            <PrimaryButton label={t('flashcards.limit.cta')} onPress={() => router.replace('/shop')} />
            <SecondaryButton
              label={t('flashcards.limit.back')}
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Done / Results ────────────────────────────────────────────────────────
  if (phase === 'done') {
    const accuracy = finalTotal > 0 ? Math.round((finalScores.know / finalTotal) * 100) : 0;
    const feedbackKey =
      accuracy >= 80
        ? 'flashcards.results.excellent'
        : accuracy >= 50
          ? 'flashcards.results.good'
          : 'flashcards.results.keepGoing';
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[c.neonGlowSoft, 'transparent']}
          style={styles.heroBg}
          pointerEvents="none"
        />
        <View style={styles.centered}>
          <Text style={{ fontSize: 60 }}>{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⭐' : '💪'}</Text>
          <Text style={[styles.feedbackText, { color: c.neon }]}>
            {t(feedbackKey as Parameters<typeof t>[0])}
          </Text>
          <View style={[styles.statsBox, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
            <StatRow label={t('flashcards.results.wordsLearned', { count: finalScores.know })} color={c.neon} />
            <StatRow label={t('flashcards.results.summary', { total: finalTotal, correct: finalScores.know })} color={c.textMed} />
            <StatRow label={t('flashcards.results.accuracy', { accuracy })} color={c.textLow} />
          </View>
          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.xl }}>
            <PrimaryButton
              label={t('flashcards.results.practiceAgain')}
              onPress={() => {
                setIndex(0);
                setScores({ know: 0, hard: 0, again: 0 });
                setRevealed(false);
                setPhase('ok');
              }}
            />
            <SecondaryButton
              label={t('flashcards.results.backHome')}
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  if (!current) return null;

  const displayWord = current.article ? `${current.article} ${current.word}` : current.word;
  const example = current.examples[0];
  const progress = deck.length > 0 ? index / deck.length : 0;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[c.purpleGlow, 'transparent']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
        <IconButton icon="close" accessibilityLabel="Kapat" onPress={() => router.back()} />
        <Text style={[styles.counter, { color: c.textLow }]}>
          {index + 1} / {deck.length}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.sm }}>
        <ProgressBar value={progress} />
      </View>

      {/* Score pills */}
      <View style={[styles.scoreRow, { paddingHorizontal: spacing.base }]}>
        <ScorePill label={t('flashcards.score.know')} value={scores.know} color={c.neon} />
        <ScorePill label={t('flashcards.score.hard')} value={scores.hard} color={c.gold} />
        <ScorePill label={t('flashcards.score.again')} value={scores.again} color={c.red} />
      </View>

      {/* Flash card */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 100, flexGrow: 1 }}
      >
        <GlassCard
          onPress={revealed ? undefined : () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRevealed(true);
          }}
          style={{ minHeight: 200, justifyContent: 'center' }}
        >
          {/* Front — German word */}
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.badge, { color: c.textLow }]}>
              {current.type.toUpperCase()}
            </Text>
            <View style={styles.wordRow}>
              <Text style={[styles.wordText, { color: c.textHigh }]}>{displayWord}</Text>
              <Pressable onPress={() => speakGerman(current.word)} hitSlop={8} style={{ marginLeft: 8 }}>
                <Ionicons name="volume-medium" size={22} color={c.textLow} />
              </Pressable>
            </View>
            {current.pronunciation ? (
              <Text style={[styles.pronText, { color: c.textLow }]}>/{current.pronunciation}/</Text>
            ) : null}
          </View>

          {/* Back — revealed definition */}
          {revealed ? (
            <View style={[styles.revealedBox, { borderTopColor: c.border }]}>
              <Text style={[styles.defLabel, { color: c.purpleLight }]}>
                {t('flashcards.card.definition')}
              </Text>
              <Text style={[styles.defText, { color: c.textHigh }]}>{current.shortDef}</Text>
              {example ? (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={[styles.exText, { color: c.textMed }]}>„{example.text}"</Text>
                  {example.translation ? (
                    <Text style={[styles.exTrText, { color: c.textLow }]}>{example.translation}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
              <Text style={[styles.tapHint, { color: c.textMuted }]}>
                {t('flashcards.card.tapToReveal')}
              </Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>

      {/* Action buttons — only visible after reveal */}
      {revealed ? (
        <View
          style={[
            styles.actions,
            {
              paddingBottom: insets.bottom + spacing.base,
              paddingHorizontal: spacing.base,
              backgroundColor: c.bg,
              borderTopColor: c.border,
            },
          ]}
        >
          <ActionBtn
            label={t('flashcards.score.again')}
            color={c.red}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleResult('again');
            }}
          />
          <ActionBtn
            label={t('flashcards.score.hard')}
            color={c.gold}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleResult('hard');
            }}
          />
          <ActionBtn
            label={t('flashcards.score.know')}
            color={c.neon}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleResult('know');
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.scorePill}>
      <View style={[styles.scoreDot, { backgroundColor: color }]} />
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{label} {value}</Text>
    </View>
  );
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, { borderColor: color, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function BenefitRow({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={18} color={color} />
      <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#CBD5E1' }}>
        {text}
      </Text>
    </View>
  );
}

function StatRow({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: '600', color, marginVertical: 3, textAlign: 'center' }}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  counter: { fontSize: 13, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 10 },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  badge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  wordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  wordText: { fontSize: 32, fontWeight: '900', textAlign: 'center' },
  pronText: { fontSize: 13, marginTop: 4 },
  tapHint: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  revealedBox: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.base, paddingTop: spacing.base },
  defLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  defText: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  exText: { fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  exTrText: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  limitTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 20, lineHeight: 32 },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,255,136,0.10)',
    borderWidth: 1,
  },
  quotaText: { fontSize: 12, fontWeight: '700' },
  limitBody: { textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 22 },
  benefitsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  feedbackText: { fontSize: 20, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  statsBox: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.base, marginTop: spacing.lg, width: '100%' },
});
