import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, PrimaryButton, SecondaryButton, IconButton, ProgressBar } from '@/src/components/ui';
import { useThemeColors, spacing, radius, getLevelColor } from '@/src/theme';
import { useT } from '@/src/i18n';
import { useUserStore } from '@/src/store/useUserStore';
import {
  getLevelWords,
  getLevelWordCount,
  CEFR_LEVELS,
  type CefrLevel,
} from '@/services/words/word-service';
import { getLearnedWords, getExamScores } from '@/lib/storage';

export default function LevelsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isPremium = useUserStore((s) => s.isPremium);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [examScores, setExamScores] = useState<Record<string, number>>({});

  const levelData = useMemo(
    () =>
      CEFR_LEVELS.map((level) => ({
        level,
        total: getLevelWordCount(level),
        ids: getLevelWords(level).map((w) => `${w.language}:${w.id.toLowerCase()}`),
      })),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      getLearnedWords().then((list) => {
        setLearnedIds(new Set(list.map((w) => `${w.language}:${w.id.toLowerCase()}`)));
      });
      getExamScores().then(setExamScores);
    }, []),
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[c.purpleGlow, c.neonGlow, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={styles.heroGrad}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingHorizontal: spacing.base }]}>
        <IconButton icon="arrow-back" accessibilityLabel="Geri" onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: c.textHigh }]}>{t('levels.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* GOETHE · TELC hero badge */}
        <View style={[styles.heroBadge, { backgroundColor: c.purpleBg, borderColor: c.purpleGlow, borderWidth: 1 }]}>
          <Ionicons name="ribbon" size={16} color={c.purpleLight} />
          <Text style={[styles.heroBadgeText, { color: c.purpleLight }]}>
            GOETHE · TELC  SINAV SİSTEMİ
          </Text>
          <Ionicons name="ribbon" size={16} color={c.purpleLight} />
        </View>

        <Text style={[styles.subtitle, { color: c.textLow }]}>{t('levels.subtitle')}</Text>

        <View style={{ gap: spacing.lg }}>
          {levelData.map(({ level, total, ids }) => {
            const learned = ids.filter((id) => learnedIds.has(id)).length;
            const progress = total > 0 ? learned / total : 0;
            const lc = getLevelColor(level as CefrLevel, c);
            const score = examScores[level];
            const passed = (score ?? 0) >= 60;

            return (
              /* Glow wrapper — iOS shadow creates the halo, elevation for Android */
              <View
                key={level}
                style={[
                  styles.cardGlow,
                  {
                    shadowColor: lc.main,
                    shadowOpacity: passed ? 0.55 : 0.28,
                    shadowRadius: passed ? 18 : 12,
                  },
                ]}
              >
                <GlassCard style={{ borderColor: lc.main, borderWidth: 1.5, overflow: 'hidden' }}>
                  {/* Top color stripe */}
                  <LinearGradient
                    colors={[lc.bg, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardStripe}
                    pointerEvents="none"
                  />

                  {/* Badge + description row */}
                  <View style={styles.row}>
                    <View style={[
                      styles.levelBadge,
                      {
                        backgroundColor: lc.main,
                        shadowColor: lc.main,
                        shadowOpacity: 0.9,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 10,
                      },
                    ]}>
                      <Text style={styles.levelBadgeText}>{level}</Text>
                      {passed && (
                        <View style={[styles.passedDot, { backgroundColor: c.neon, borderColor: c.bg }]}>
                          <Ionicons name="checkmark" size={11} color="#0F172A" />
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[styles.levelDesc, { color: c.textHigh }]}>
                        {t(`levels.descriptions.${level}` as Parameters<typeof t>[0])}
                      </Text>
                      <Text style={[styles.wordCount, { color: c.textLow }]}>
                        {t('levels.wordCount', { count: total })}
                      </Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <ProgressBar
                    value={progress}
                    style={{ marginTop: spacing.md }}
                  />
                  <Text style={[styles.progressText, { color: c.textLow }]}>
                    {t('levels.progress', { learned, total })}
                  </Text>

                  {/* Best score badge */}
                  {score !== undefined && (
                    <View style={[
                      styles.scorePill,
                      {
                        backgroundColor: passed ? c.neonBg : c.surfaceElevated,
                        borderColor: passed ? c.neon : c.border,
                      },
                    ]}>
                      <Ionicons
                        name={passed ? 'trophy' : 'stats-chart'}
                        size={12}
                        color={passed ? c.neon : c.textLow}
                      />
                      <Text style={[styles.scorePillText, { color: passed ? c.neon : c.textLow }]}>
                        {t('levels.examBest', { percent: score })}
                      </Text>
                    </View>
                  )}

                  {/* Flashcard button row */}
                  <SecondaryButton
                    label={isPremium ? `📚  ${t('levels.studyShort')}` : `🔒  ${t('levels.studyShort')}`}
                    variant="glass"
                    style={{ marginTop: spacing.md }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!isPremium) { router.push('/shop'); return; }
                      router.push({ pathname: '/flashcards', params: { level } });
                    }}
                  />

                  {/* Exam button — glowing, level-colored */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (!isPremium) { router.push('/shop'); return; }
                      router.push({ pathname: '/exam', params: { level } });
                    }}
                    style={({ pressed }) => [
                      styles.examBtn,
                      {
                        backgroundColor: lc.bg,
                        borderColor: lc.main,
                        borderRadius: radius.lg,
                        opacity: pressed ? 0.75 : 1,
                        shadowColor: lc.main,
                        shadowOpacity: 0.7,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 8,
                      },
                    ]}
                  >
                    <Ionicons name="document-text" size={18} color={lc.main} />
                    <Text style={[styles.examBtnText, { color: lc.main }]}>
                      {isPremium ? t('levels.examShort') : `🔒  ${t('levels.examShort')}`}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={lc.main} />
                  </Pressable>

                  {/* Sprechen — A1 */}
                  {level === 'A1' && (
                    <PrimaryButton
                      label={isPremium ? t('sprechen.homeButton') : `🔒 ${t('sprechen.homeButton')}`}
                      style={{ marginTop: spacing.sm }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        if (!isPremium) { router.push('/shop'); return; }
                        router.push('/sprechen-a1');
                      }}
                    />
                  )}

                  {/* Sprechen — A2 */}
                  {level === 'A2' && (
                    <PrimaryButton
                      label={isPremium ? t('sprechenA2.homeButton') : `🔒 ${t('sprechenA2.homeButton')}`}
                      style={{ marginTop: spacing.sm }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        if (!isPremium) { router.push('/shop'); return; }
                        router.push('/sprechen-a2');
                      }}
                    />
                  )}
                </GlassCard>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  heroBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: spacing.md, textAlign: 'center' },
  cardGlow: {
    borderRadius: radius.xl,
    shadowOffset: { width: 0, height: 0 },
  },
  cardStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  passedDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  levelDesc: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  wordCount: { fontSize: 12, marginTop: 2 },
  progressText: { fontSize: 12, marginTop: spacing.sm },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  scorePillText: { fontSize: 12, fontWeight: '700' },
  examBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    marginTop: spacing.sm,
    borderWidth: 1.5,
  },
  examBtnText: { fontSize: 15, fontWeight: '800', flex: 1, textAlign: 'center' },
});
