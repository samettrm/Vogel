import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, PrimaryButton, SecondaryButton, IconButton } from '@/src/components/ui';
import { useThemeColors, spacing, radius } from '@/src/theme';
import { useT } from '@/src/i18n';
import { useUserStore } from '@/src/store/useUserStore';
import { lookupWord, suggestGermanCorrections } from '@/services/words/word-service';
import type { DictionaryWord, VerbConjugation, WordLanguage } from '@/services/api/types';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/storage';
import { speakGerman } from '@/lib/german-tts';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function WordDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isPremium = useUserStore((s) => s.isPremium);
  const { id, lang } = useLocalSearchParams<{ id: string; lang?: string }>();
  const language: WordLanguage = lang === 'de' ? 'de' : 'en';

  const [word, setWord] = useState<DictionaryWord | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [speaking, setSpeaking] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    const result = await lookupWord(id ?? '');
    if (result.ok) {
      setWord(result.data);
      setStatus('ready');
      const fav = await isFavorite(result.data.id, result.data.language);
      setFavorited(fav);
    } else {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSpeak = () => {
    if (!word) return;
    setSpeaking(true);
    speakGerman(word.word).finally(() => setSpeaking(false));
  };

  const handleToggleFav = async () => {
    if (!word) return;
    if (favorited) {
      await removeFavorite(word.id, word.language);
      setFavorited(false);
    } else {
      await addFavorite({
        id: word.id,
        word: word.word,
        language: word.language,
        type: word.type,
        article: word.article,
        shortDef: word.shortDef,
        savedAt: Date.now(),
      });
      setFavorited(true);
    }
  };

  const handleShare = async () => {
    if (!word) return;
    const title = word.article ? `${word.article} ${word.word}` : word.word;
    const meaning = word.shortDef ? ` — ${word.shortDef}` : '';
    try {
      await Share.share({ message: `${title}${meaning}\n\nVogel` });
    } catch { /* dismissed */ }
  };

  const displayWord = word ? (word.article ? `${word.article} ${word.word}` : word.word) : '';
  const meanings = word ? word.definitions.filter((d) => d.meaning.trim().length > 0) : [];
  const examples = word ? word.examples : [];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero gradient */}
      <LinearGradient
        colors={[c.purpleGlow, 'transparent']}
        style={styles.heroGrad}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6, paddingHorizontal: spacing.base }]}>
        <IconButton icon="arrow-back" accessibilityLabel="Geri" onPress={() => router.back()} />
        <Text style={[styles.stickyTitle, { color: c.textHigh }]} numberOfLines={1}>
          {word?.word ?? ''}
        </Text>
        {status === 'ready' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <IconButton
              icon="share-outline"
              accessibilityLabel="Paylaş"
              onPress={handleShare}
            />
            <IconButton
              icon={favorited ? 'bookmark' : 'bookmark-outline'}
              accessibilityLabel="Kaydet"
              variant={favorited ? 'primary' : 'glass'}
              onPress={handleToggleFav}
            />
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Loading */}
      {status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.purple} size="large" />
        </View>
      ) : null}

      {/* Error */}
      {status === 'error' ? (
        <ErrorState word={id ?? ''} language={language} onRetry={load} />
      ) : null}

      {/* Ready */}
      {status === 'ready' && word ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 }}
        >
          {/* Hero */}
          <View style={{ paddingHorizontal: spacing.base }}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
              <Text style={[styles.typeBadgeText, { color: c.purpleLight }]}>
                {word.type.toUpperCase()}
              </Text>
            </View>

            {/* Word + article */}
            <Text style={[styles.wordTitle, { color: c.textHigh }]}>
              {word.article ? (
                <Text style={{ color: c.textLow }}>{word.article} </Text>
              ) : null}
              {word.word}
            </Text>

            {/* Short def */}
            <Text style={[styles.shortDef, { color: c.textMed }]}>{word.shortDef}</Text>

            {/* Audio row */}
            <Pressable
              onPress={handleSpeak}
              style={({ pressed }) => [styles.audioRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.audioBtn, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
                <Ionicons
                  name={speaking ? 'stop' : 'volume-high'}
                  size={18}
                  color={c.purpleLight}
                />
              </View>
              <Text style={[styles.audioHint, { color: c.textLow }]}>
                {speaking ? t('word.audioPlaying') : t('word.audioHint')}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: c.border, marginHorizontal: spacing.base }]} />

          {/* Meanings */}
          {meanings.length > 0 ? (
            <Section title={t('word.sections.meanings')} color={c.textHigh}>
              {meanings.map((def, i) => (
                <GlassCard key={def.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.defRow}>
                    <View style={[styles.defIndex, { backgroundColor: c.purpleBg }]}>
                      <Text style={{ color: c.purpleLight, fontWeight: '700', fontSize: 12 }}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.defText, { color: c.textHigh }]}>{def.meaning}</Text>
                  </View>
                </GlassCard>
              ))}
            </Section>
          ) : null}

          {/* Examples */}
          {examples.length > 0 ? (
            <Section title={t('word.sections.examples')} color={c.textHigh}>
              {examples.map((ex, i) => (
                <View
                  key={i}
                  style={[styles.exampleCard, { backgroundColor: c.surface, borderLeftColor: c.purple, borderRadius: radius.md }]}
                >
                  <Text style={[styles.exNum, { color: c.textLow }]}>{`0${i + 1}`}</Text>
                  <Text style={[styles.exText, { color: c.textMed }]}>„{ex.text}"</Text>
                  {ex.translation ? (
                    <Text style={[styles.exTr, { color: c.textLow }]}>{ex.translation}</Text>
                  ) : null}
                </View>
              ))}
            </Section>
          ) : null}

          {/* Synonyms */}
          {word.synonyms.length > 0 ? (
            <Section title={t('word.sections.synonyms')} color={c.textHigh}>
              <View style={styles.chips}>
                {word.synonyms.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => router.push({ pathname: '/word/[id]', params: { id: s, lang: word.language } })}
                    style={[styles.chip, { backgroundColor: c.neonBg, borderColor: c.neon }]}
                  >
                    <Text style={{ color: c.neon, fontWeight: '700', fontSize: 13 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>
          ) : null}

          {/* Antonyms */}
          {word.antonyms.length > 0 ? (
            <Section title={t('word.sections.antonyms')} color={c.textHigh}>
              <View style={styles.chips}>
                {word.antonyms.map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => router.push({ pathname: '/word/[id]', params: { id: a, lang: word.language } })}
                    style={[styles.chip, { backgroundColor: c.redBg, borderColor: c.red }]}
                  >
                    <Text style={{ color: c.red, fontWeight: '700', fontSize: 13 }}>{a}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>
          ) : null}

          {/* Verb case government */}
          {word.verbCase ? (
            <Section title={t('word.verbCase.title')} color={c.textHigh}>
              <GlassCard>
                <View style={[styles.typeBadge, { backgroundColor: c.purpleBg, borderColor: c.purple, alignSelf: 'flex-start' }]}>
                  <Text style={[styles.typeBadgeText, { color: c.purpleLight }]}>
                    {t(`word.verbCase.${word.verbCase.replace(/-/g, '')}` as Parameters<typeof t>[0]) || word.verbCase}
                  </Text>
                </View>
                <Text style={[styles.defText, { color: c.textMed, marginTop: spacing.md }]}>
                  {t(`word.verbCase.${word.verbCase.replace(/-/g, '')}Desc` as Parameters<typeof t>[0]) || ''}
                </Text>
              </GlassCard>
            </Section>
          ) : null}

          {/* Conjugation */}
          {word.verb ? (
            <Section title={t('word.sections.conjugation')} color={c.textHigh}>
              {isPremium ? (
                <ConjugationTable verb={word.verb} />
              ) : (
                <LockedConjugationCard />
              )}
            </Section>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

function ConjugationTable({ verb }: { verb: VerbConjugation }) {
  const c = useThemeColors();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const tense = verb.conjugations[Math.min(selectedIdx, verb.conjugations.length - 1)];

  return (
    <GlassCard>
      {/* Regular / Irregular rozeti */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
        <View style={[styles.typeBadge, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
          <Text style={[styles.typeBadgeText, { color: c.purpleLight }]}>
            {verb.regular ? 'REGULAR' : 'IRREGULAR'}
          </Text>
        </View>
      </View>

      {/* Zaman seçici butonlar — flex:1 ile eşit paylaşım, no flexWrap */}
      {verb.conjugations.length > 1 && (
        <View style={styles.tenseRow}>
          {verb.conjugations.map((ten, i) => (
            <Pressable
              key={ten.nameDe}
              onPress={() => setSelectedIdx(i)}
              style={[
                styles.tenseBtn,
                {
                  backgroundColor: i === selectedIdx ? c.purpleBg : c.glassBg,
                  borderColor: i === selectedIdx ? c.purple : c.glassBorderStrong,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.tenseBtnText, { color: i === selectedIdx ? c.purpleLight : c.textLow }]}
              >
                {ten.nameDe}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Çekim formları */}
      {tense?.forms.map((form) => (
        <View key={form.pronoun} style={[styles.formRow, { borderBottomColor: c.divider }]}>
          <Text style={[styles.pronoun, { color: c.textLow }]}>{form.pronoun}</Text>
          <Text style={[styles.form, { color: c.textHigh }]}>{form.form}</Text>
        </View>
      ))}

      {/* Örnek cümle — ilk pronoun'u kullan, hardcoded "Ich" yok */}
      {tense?.forms[0] ? (
        <Text style={[styles.tenseSentence, { color: c.textLow }]}>
          {`${tense.forms[0].pronoun.charAt(0).toUpperCase()}${tense.forms[0].pronoun.slice(1)} ${tense.forms[0].form}.`}
        </Text>
      ) : null}
    </GlassCard>
  );
}

function LockedConjugationCard() {
  const c = useThemeColors();
  const t = useT();
  return (
    <GlassCard>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.lockIconBox, { backgroundColor: c.purpleBg }]}>
          <Ionicons name="lock-closed" size={18} color={c.purpleLight} />
        </View>
        <Text style={[styles.lockedTitle, { color: c.textHigh }]}>
          {t('word.conjugationLocked.title')}
        </Text>
      </View>
      <Text style={[styles.lockedBody, { color: c.textLow }]}>
        {t('word.conjugationLocked.body')}
      </Text>
      <Pressable
        onPress={() => router.push('/shop')}
        style={({ pressed }) => ({ marginTop: spacing.base, opacity: pressed ? 0.9 : 1 })}
      >
        <LinearGradient
          colors={['#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.lockedCta, { borderRadius: radius.lg }]}
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={styles.lockedCtaText}>{t('word.conjugationLocked.cta')}</Text>
        </LinearGradient>
      </Pressable>
    </GlassCard>
  );
}

function ErrorState({
  word,
  language,
  onRetry,
}: {
  word: string;
  language: WordLanguage;
  onRetry: () => void;
}) {
  const c = useThemeColors();
  const t = useT();
  const suggestions =
    language === 'de' && word.trim().split(/\s+/).length === 1
      ? suggestGermanCorrections(word.trim(), 3)
      : [];

  return (
    <View style={styles.centered}>
      <View style={[styles.errorIcon, { backgroundColor: c.surfaceElevated }]}>
        <Ionicons name="search" size={32} color={c.textLow} />
      </View>
      <Text style={[styles.errorTitle, { color: c.textHigh }]}>{t('word.error.title')}</Text>
      <Text style={[styles.errorBody, { color: c.textLow }]}>
        {word ? t('word.error.withWord', { word }) : t('word.error.noWord')}
      </Text>

      {suggestions.length > 0 ? (
        <View style={{ width: '100%', paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
          <Text style={{ color: c.textLow, textAlign: 'center', marginBottom: spacing.md, fontSize: 13 }}>
            {t('word.didYouMean.label')}
          </Text>
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                onPress={() =>
                  router.replace({ pathname: '/word/[id]', params: { id: s, lang: language } })
                }
                style={[styles.chip, { backgroundColor: c.purpleBg, borderColor: c.purple }]}
              >
                <Text style={{ color: c.purpleLight, fontWeight: '700', fontSize: 13 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
        <SecondaryButton
          label={t('common.back')}
          variant="ghost"
          style={{ flex: 1 }}
          onPress={() => router.back()}
        />
        <PrimaryButton
          label={t('common.retry')}
          style={{ flex: 1 }}
          onPress={onRetry}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  stickyTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', paddingHorizontal: 4 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  wordTitle: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: spacing.sm },
  shortDef: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.base },
  audioBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  audioHint: { fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: spacing.md, textTransform: 'uppercase' },
  defRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  defIndex: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  defText: { flex: 1, fontSize: 15, lineHeight: 24 },
  exampleCard: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 12, paddingRight: 16, marginBottom: spacing.sm },
  exNum: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  exText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  exTr: { fontSize: 13, marginTop: 4, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1 },
  tenseName: { fontSize: 13, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  tenseRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  tenseBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5 },
  tenseBtnText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tenseSentence: { fontSize: 12, fontStyle: 'italic', marginTop: spacing.sm, lineHeight: 18 },
  formRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  pronoun: { width: 80, fontSize: 13 },
  form: { fontSize: 14, fontWeight: '600' },
  lockIconBox: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { flex: 1, marginLeft: spacing.md, fontSize: 16, fontWeight: '800' },
  lockedBody: { marginTop: spacing.md, fontSize: 14, lineHeight: 22 },
  lockedCta: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  lockedCtaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '800', marginTop: spacing.lg, textAlign: 'center' },
  errorBody: { fontSize: 14, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
});
