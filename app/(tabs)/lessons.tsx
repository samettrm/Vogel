import React, { useCallback, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ALL_COURSES, AVAILABLE_LEVELS } from '../../src/data/courses';
import { useUserStore } from '../../src/store/useUserStore';
import { getLevelColor, radius, spacing, textStyles, useThemeColors } from '../../src/theme';
import { useT } from '../../src/i18n';
import { scoreUnitForUser } from '../../src/services/personalization';
import type { CEFRLevel, Lesson, Unit } from '../../src/types';

// ════════════════════════════════════════════════════════════════
// LESSONS SCREEN — 330 ders listesi
//
// 🚀 PERF NOTLARI:
//   - FlatList virtualization: sadece görünür kartlar render olur
//   - STATIC_ITEMS_CACHE: ders meta-data'sı bir kez hesaplanır
//   - LessonCard React.memo: store update'lerinde gereksiz render önlenir
//   - Background glow KALDIRILDI (Android blur expensive)
//   - Per-item FadeIn KALDIRILDI (330 paralel reanimated bloke ediyordu)
// ════════════════════════════════════════════════════════════════

type LessonItem = {
  level: CEFRLevel;
  courseTitle: string;
  unitTitle: string;
  unit: Unit; // Personalization scoring için
  lesson: Lesson;
  status: 'completed' | 'in-progress' | 'untouched';
  correctCount: number;
  total: number;
};

type StatusFilter = 'all' | 'completed' | 'in-progress' | 'untouched' | 'exam';

// 🚀 PERF: Module-level lazy cache — sadece bir kere hesaplanır
type StaticItem = Omit<LessonItem, 'status' | 'correctCount'>;
let STATIC_ITEMS_CACHE: StaticItem[] | null = null;
function getStaticItems(): StaticItem[] {
  if (STATIC_ITEMS_CACHE) return STATIC_ITEMS_CACHE;
  const items: StaticItem[] = [];
  for (const course of ALL_COURSES) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        items.push({
          level: course.level,
          courseTitle: course.title,
          unitTitle: unit.title,
          unit,
          lesson,
          total: lesson.exercises?.length ?? 0,
        });
      }
    }
  }
  STATIC_ITEMS_CACHE = items;
  return items;
}

const ITEM_SEPARATOR_HEIGHT = 8;
const APPROX_CARD_HEIGHT = 88;

export default function LessonsScreen() {
  const c = useThemeColors();
  const t = useT();
  const completedLessons = useUserStore((s) => s.completedLessons);
  const lessonExerciseProgress = useUserStore((s) => s.lessonExerciseProgress);
  const learningMotivations = useUserStore((s) => s.learningMotivations);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 📜 Yukarı çık butonu
  const listRef = useRef<FlatList<LessonItem>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > 500;
    if (shouldShow !== showScrollTop) {
      setShowScrollTop(shouldShow);
      Animated.timing(scrollTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showScrollTop, scrollTopOpacity]);

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const allItems = useMemo<LessonItem[]>(() => {
    const statics = getStaticItems();
    const result: LessonItem[] = new Array(statics.length);
    for (let i = 0; i < statics.length; i++) {
      const s = statics[i];
      const progress = lessonExerciseProgress[s.lesson.id];
      let correctCount = 0;
      let hasAnyProgress = false;
      if (progress) {
        for (const exId in progress) {
          hasAnyProgress = true;
          if (progress[exId] === 'correct') correctCount++;
        }
      }
      let status: LessonItem['status'] = 'untouched';
      if (completedLessons.has(s.lesson.id)) status = 'completed';
      else if (hasAnyProgress) status = 'in-progress';
      result[i] = { ...s, status, correctCount };
    }
    return result;
  }, [completedLessons, lessonExerciseProgress]);

  const filteredItems = useMemo(() => {
    const lowerSearch = search.toLocaleLowerCase('tr-TR').trim();
    return allItems.filter((item) => {
      if (levelFilter !== 'all' && item.level !== levelFilter) return false;
      if (statusFilter === 'exam') {
        if (!(item.unit.tags?.includes('exam') ?? false)) return false;
      } else if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (lowerSearch.length > 0) {
        const haystack = (
          item.lesson.title + ' ' + item.unitTitle + ' ' + item.courseTitle
        ).toLocaleLowerCase('tr-TR');
        if (!haystack.includes(lowerSearch)) return false;
      }
      return true;
    });
  }, [allItems, search, levelFilter, statusFilter]);

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    for (const item of allItems) {
      if (item.status === 'completed') completed++;
      else if (item.status === 'in-progress') inProgress++;
    }
    return { completed, inProgress, total: allItems.length };
  }, [allItems]);

  const recommended = useMemo(() => {
    const inProgressItem = allItems.find((i) => i.status === 'in-progress');
    if (inProgressItem) return inProgressItem;

    if (!learningMotivations || learningMotivations.length === 0) {
      return allItems.find((i) => i.status === 'untouched') ?? null;
    }

    const untouched = allItems.filter((i) => i.status === 'untouched');
    if (untouched.length === 0) return null;

    const firstUntouchedPerUnit = new Map<string, LessonItem>();
    for (const item of untouched) {
      if (!firstUntouchedPerUnit.has(item.unit.id)) {
        firstUntouchedPerUnit.set(item.unit.id, item);
      }
    }

    let best: LessonItem | null = null;
    let bestScore = -1;
    for (const item of firstUntouchedPerUnit.values()) {
      const score = scoreUnitForUser(item.unit, learningMotivations);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (best && bestScore >= 0.4) return best;
    return untouched[0];
  }, [allItems, learningMotivations]);

  const handleQuickPractice = useCallback(() => {
    const eligible = allItems.filter((i) => i.status === 'completed' || i.status === 'in-progress');
    if (eligible.length === 0) {
      router.push(`/lesson/${allItems[0]?.lesson.id ?? ''}`);
      return;
    }
    const random = eligible[Math.floor(Math.random() * eligible.length)];
    router.push(`/lesson/${random.lesson.id}`);
  }, [allItems]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setLevelFilter('all');
    setStatusFilter('all');
  }, []);

  const hasFilters = search.length > 0 || levelFilter !== 'all' || statusFilter !== 'all';
  const styles = useMemo(() => makeStyles(c), [c]);

  // 🚀 PERF: renderItem'i useCallback ile stabilize et
  const renderItem = useCallback(
    ({ item }: { item: LessonItem }) => <LessonCard item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: LessonItem) => item.lesson.id, []);

  // 🚀 PERF: getItemLayout — FlatList'in scroll'u önceden hesaplaması için
  const getItemLayout = useCallback(
    (_data: ArrayLike<LessonItem> | null | undefined, index: number) => ({
      length: APPROX_CARD_HEIGHT,
      offset: (APPROX_CARD_HEIGHT + ITEM_SEPARATOR_HEIGHT) * index,
      index,
    }),
    [],
  );

  const ListHeader = useMemo(() => (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('lessons.title')}</Text>
        <Text style={styles.subtitle}>
          {t('lessons.subtitleCount', { total: stats.total, completed: stats.completed })}
        </Text>
      </View>

      <Pressable
        onPress={handleQuickPractice}
        style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
      >
        <View style={styles.quickLeft}>
          <View style={styles.quickIconBox}>
            <Ionicons name="flash" size={22} color={c.bg} />
          </View>
          <View style={styles.quickTextCol}>
            <Text style={styles.quickTitle}>{t('lessons.quickPractice')}</Text>
            <Text style={styles.quickSubtitle}>{t('lessons.quickPracticeDesc')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textLow} />
      </Pressable>

      {recommended ? (
        <Pressable
          onPress={() => router.push(`/lesson/${recommended.lesson.id}`)}
          style={({ pressed }) => [styles.recommendedCard, pressed && styles.recommendedCardPressed]}
        >
          <View style={styles.recommendedHeader}>
            <View style={styles.recommendedIconBox}>
              <Ionicons name="star" size={20} color={c.textOnNeon} />
            </View>
            <View style={styles.recommendedTextCol}>
              <Text style={styles.recommendedLabel}>{t('recommended.title')}</Text>
              <Text style={styles.recommendedTitle} numberOfLines={1}>{recommended.lesson.title}</Text>
              <Text style={styles.recommendedMeta} numberOfLines={1}>
                {recommended.level} · {recommended.unitTitle}
              </Text>
            </View>
          </View>
          <View style={styles.recommendedCtaRow}>
            <Text style={styles.recommendedCta}>{t('recommended.cta')}</Text>
            <Ionicons name="arrow-forward" size={16} color={c.textOnNeon} />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: c.neon }]}>
          <Text style={[styles.statValue, { color: c.neon }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>{t('lessons.completed')}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: c.cyan }]}>
          <Text style={[styles.statValue, { color: c.cyan }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>{t('lessons.inProgress')}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: c.textLow }]}>
          <Text style={[styles.statValue, { color: c.textHigh }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('lessons.total')}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={c.textLow} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('lessons.search')}
          placeholderTextColor={c.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={c.textLow} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <FilterChip c={c} label={t('lessons.allLevels')} active={levelFilter === 'all'} onPress={() => setLevelFilter('all')} />
        {AVAILABLE_LEVELS.map((lvl) => {
          const lc = getLevelColor(lvl, c);
          return (
            <FilterChip
              key={lvl}
              c={c}
              label={lvl}
              active={levelFilter === lvl}
              onPress={() => setLevelFilter(lvl)}
              color={lc.main}
              colorBg={lc.bg}
            />
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <FilterChip c={c} label={t('lessons.all')} active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
        <FilterChip c={c} label="🎓 Sınav" active={statusFilter === 'exam'} onPress={() => setStatusFilter('exam')} color={c.gold} colorBg={c.goldBg} />
        <FilterChip c={c} label={t('lessons.completed')} active={statusFilter === 'completed'} onPress={() => setStatusFilter('completed')} color={c.neon} colorBg={c.neonBg} />
        <FilterChip c={c} label={t('lessons.inProgress')} active={statusFilter === 'in-progress'} onPress={() => setStatusFilter('in-progress')} color={c.cyan} colorBg={'rgba(34, 211, 238, 0.15)'} />
        <FilterChip c={c} label={t('lessons.notStarted')} active={statusFilter === 'untouched'} onPress={() => setStatusFilter('untouched')} color={c.textLow} />
      </ScrollView>
    </View>
  ), [c, t, styles, stats, recommended, handleQuickPractice, search, levelFilter, statusFilter]);

  const ListEmpty = useMemo(() => (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={48} color={c.textLow} />
      <Text style={styles.emptyTitle}>{t('lessons.noResults')}</Text>
      <Text style={styles.emptySubtitle}>{t('lessons.noResultsDesc')}</Text>
      {hasFilters ? (
        <Pressable
          onPress={clearFilters}
          style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.clearButtonText}>{t('lessons.clearFilters')}</Text>
        </Pressable>
      ) : null}
    </View>
  ), [c, t, hasFilters, clearFilters, styles]);

  const ItemSeparator = useCallback(
    () => <View style={{ height: ITEM_SEPARATOR_HEIGHT }} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 🚀 PERF: FlatList virtualization — sadece görünür kartlar render */}
      <FlatList
        ref={listRef}
        data={filteredItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={ItemSeparator}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      />

      {/* 📜 Yukarı çık butonu — 500px+ scroll edilince görünür */}
      <Animated.View
        style={[styles.scrollTopButton, { opacity: scrollTopOpacity }]}
        pointerEvents={showScrollTop ? 'auto' : 'none'}
      >
        <Pressable
          onPress={handleScrollToTop}
          style={({ pressed }) => [styles.scrollTopInner, pressed && styles.scrollTopPressed]}
        >
          <Ionicons name="arrow-up" size={20} color={c.textOnNeon} />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

function FilterChip({
  c, label, active, onPress, color, colorBg,
}: {
  c: ReturnType<typeof useThemeColors>;
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  colorBg?: string;
}) {
  const hasColor = color !== undefined;
  const accent = color ?? c.neon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        chipStyles(c).chip,
        hasColor && !active && {
          borderColor: accent,
          backgroundColor: c.glassBg,
          opacity: 0.55,
        },
        hasColor && active && {
          borderColor: accent,
          backgroundColor: colorBg ?? c.glassBg,
        },
        !hasColor && active && {
          backgroundColor: c.glassBg,
          borderColor: accent,
        },
        pressed && { opacity: hasColor && !active ? 0.4 : 0.7, transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text
        style={[
          chipStyles(c).chipText,
          hasColor && { color: accent },
          !hasColor && active && { color: accent },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function chipStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.base, paddingVertical: 6,
      borderRadius: radius.pill, borderWidth: 1.5,
      borderColor: c.glassBorderStrong, backgroundColor: c.glassBg,
    },
    chipText: { ...textStyles.bodyBold, color: c.textLow, fontSize: 12, letterSpacing: 0.5 },
  });
}

function LessonCardImpl({ item }: { item: LessonItem }) {
  const c = useThemeColors();
  const t = useT();
  const onPress = useCallback(() => router.push(`/lesson/${item.lesson.id}`), [item.lesson.id]);

  const statusMeta = item.status === 'completed'
    ? { icon: 'checkmark-circle' as const, color: c.neon, bgColor: c.neonBg, label: t('lessons.completedBadge') }
    : item.status === 'in-progress'
      ? { icon: 'time' as const, color: c.cyan, bgColor: 'rgba(34, 211, 238, 0.15)', label: t('lessons.inProgressBadge') }
      : { icon: 'play-circle' as const, color: c.textLow, bgColor: c.glassBg, label: t('lessons.notStartedBadge') };

  const lc = getLevelColor(item.level, c);
  const progressPercent = item.total > 0 ? Math.round((item.correctCount / item.total) * 100) : 0;
  const styles = cardStylesFn(c);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.statusIcon, { backgroundColor: statusMeta.bgColor, borderColor: statusMeta.color }]}>
          <Ionicons name={statusMeta.icon} size={20} color={statusMeta.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: lc.bg, borderColor: lc.main },
              ]}
            >
              <Text style={[styles.levelBadgeText, { color: lc.light }]}>{item.level}</Text>
            </View>
            <Text style={styles.unitText} numberOfLines={1}>{item.unitTitle}</Text>
          </View>
          <Text style={styles.lessonTitle} numberOfLines={1}>{item.lesson.title}</Text>
          <View style={styles.bottomRow}>
            <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            {item.status !== 'untouched' ? (
              <Text style={styles.progressText}>{item.correctCount}/{item.total} ({progressPercent}%)</Text>
            ) : (
              <Text style={styles.progressText}>{t('lessons.questionsCount', { n: item.total })}</Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={c.textLow} />
      </View>
    </Pressable>
  );
}

// 🚀 PERF: LessonCard React.memo — sadece item değiştiğinde re-render.
const LessonCard = React.memo(LessonCardImpl, (prev, next) =>
  prev.item.lesson.id === next.item.lesson.id &&
  prev.item.status === next.item.status &&
  prev.item.correctCount === next.item.correctCount &&
  prev.item.total === next.item.total,
);

function cardStylesFn(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.lg, padding: spacing.base,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    statusIcon: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    content: { flex: 1, gap: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    levelBadge: {
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
      borderWidth: 1,
    },
    levelBadgeText: { ...textStyles.label, fontSize: 9, letterSpacing: 0.5 },
    unitText: { ...textStyles.body, color: c.textLow, fontSize: 11, flex: 1 },
    lessonTitle: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
    statusLabel: { ...textStyles.label, fontSize: 10 },
    progressText: { ...textStyles.body, color: c.textMuted, fontSize: 11 },
  });
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    listContent: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    headerWrap: {
      gap: spacing.base,
      marginBottom: spacing.base,
    },
    header: { paddingVertical: spacing.sm },
    title: { ...textStyles.display, color: c.textHigh },
    subtitle: { ...textStyles.body, color: c.textLow, fontSize: 13, marginTop: 2 },
    quickCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.goldBg, borderWidth: 1.5, borderColor: c.gold,
      borderRadius: radius.lg, padding: spacing.base,
    },
    quickCardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    quickLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    quickIconBox: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center',
    },
    quickTextCol: { flex: 1, gap: 2 },
    quickTitle: { ...textStyles.subheading, color: c.gold, fontSize: 15 },
    quickSubtitle: { ...textStyles.body, color: c.textMed, fontSize: 12 },
    recommendedCard: {
      backgroundColor: c.neonBg,
      borderWidth: 1.5, borderColor: c.neon,
      borderRadius: radius.lg,
      padding: spacing.base,
      gap: spacing.md,
    },
    recommendedCardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
    recommendedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    recommendedIconBox: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
    },
    recommendedTextCol: { flex: 1, gap: 2 },
    recommendedLabel: { ...textStyles.label, color: c.neonLight, fontSize: 10, letterSpacing: 1 },
    recommendedTitle: { ...textStyles.subheading, color: c.textHigh, fontSize: 16 },
    recommendedMeta: { ...textStyles.body, color: c.textLow, fontSize: 11 },
    recommendedCtaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.neon,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
    },
    recommendedCta: { ...textStyles.button, color: c.textOnNeon, fontSize: 14 },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statBox: {
      flex: 1, borderWidth: 1.5, borderRadius: radius.md,
      backgroundColor: c.glassBg, paddingVertical: spacing.sm, alignItems: 'center',
    },
    statValue: { ...textStyles.display, fontSize: 22 },
    statLabel: { ...textStyles.label, color: c.textLow, fontSize: 10 },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.md, paddingHorizontal: spacing.base, minHeight: 46,
    },
    searchInput: { ...textStyles.body, flex: 1, color: c.textHigh, paddingVertical: 0 },
    chipRow: { gap: spacing.sm, paddingRight: spacing.base },
    empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    emptyTitle: { ...textStyles.subheading, color: c.textMed, marginTop: spacing.sm },
    emptySubtitle: { ...textStyles.body, color: c.textLow, fontSize: 13, textAlign: 'center' },
    clearButton: {
      marginTop: spacing.base,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      borderRadius: radius.md, backgroundColor: c.neon,
    },
    clearButtonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 12 },
    // 📜 Yukarı çık floating button
    scrollTopButton: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.base,
      borderRadius: 24,
    },
    scrollTopInner: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
    },
    scrollTopPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  });
}
