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
  isLocked: boolean; // true → bu dersten önce tamamlanması gereken dersler var
};

type StatusFilter = 'all' | 'exam';

// 🚀 PERF: Module-level lazy cache — sadece bir kere hesaplanır
type StaticItem = Omit<LessonItem, 'status' | 'correctCount' | 'isLocked'>;
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
  const isPremium = useUserStore((s) => s.isPremium);

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
    // ── Erişilebilir ders ID'leri — her kurs için kilit mantığı ──
    // Tamamlanmış veya sıradaki (current) dersler açık; geri kalanlar kilitli.
    // Sınav üniteleri: premium kullanıcılar için her zaman açık.
    const accessibleIds = new Set<string>();
    for (const course of ALL_COURSES) {
      const flatAll = course.units.flatMap((u) => u.lessons);
      let foundCurrent = false;
      for (const lesson of flatAll) {
        const inExamUnit = course.units.some(
          (u) => (u.tags?.includes('exam') ?? false) && u.lessons.some((l) => l.id === lesson.id),
        );
        if (completedLessons.has(lesson.id)) {
          accessibleIds.add(lesson.id);
        } else if (inExamUnit) {
          if (isPremium) accessibleIds.add(lesson.id); // exam: sadece premium
        } else if (!foundCurrent) {
          accessibleIds.add(lesson.id); // İlk tamamlanmamış normal ders = "current"
          foundCurrent = true;
        }
        // Geri kalan normal dersler: kilitli (accessibleIds'e eklenmez)
      }
    }

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
      result[i] = { ...s, status, correctCount, isLocked: !accessibleIds.has(s.lesson.id) };
    }
    return result;
  }, [completedLessons, lessonExerciseProgress, isPremium]);

  const filteredItems = useMemo(() => {
    // Premium değilse sınav derslerini hiç gösterme — gate gösterilecek
    if (statusFilter === 'exam' && !isPremium) return [];
    const lowerSearch = search.toLocaleLowerCase('tr-TR').trim();
    return allItems.filter((item) => {
      if (levelFilter !== 'all' && item.level !== levelFilter) return false;
      if (statusFilter === 'exam') {
        if (!(item.unit.tags?.includes('exam') ?? false)) return false;
      }
      if (lowerSearch.length > 0) {
        const haystack = (
          item.lesson.title + ' ' + item.unitTitle + ' ' + item.courseTitle
        ).toLocaleLowerCase('tr-TR');
        if (!haystack.includes(lowerSearch)) return false;
      }
      return true;
    });
  }, [allItems, search, levelFilter, statusFilter, isPremium]);

  const stats = useMemo(() => {
    let completed = 0;
    for (const item of allItems) {
      if (item.status === 'completed') completed++;
    }
    return { completed, total: allItems.length };
  }, [allItems]);

  const recommended = useMemo(() => {
    // Kilitli dersleri öneri listesinden çıkar
    const inProgressItem = allItems.find((i) => i.status === 'in-progress' && !i.isLocked);
    if (inProgressItem) return inProgressItem;

    if (!learningMotivations || learningMotivations.length === 0) {
      return allItems.find((i) => i.status === 'untouched' && !i.isLocked) ?? null;
    }

    const untouched = allItems.filter((i) => i.status === 'untouched' && !i.isLocked);
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

      {/* ── Başlık + özet stat ── */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('lessons.title')}</Text>
        <Text style={styles.statsInline}>
          <Text style={{ color: c.neon }}>{stats.completed}</Text>
          {' tamamlandı · '}
          <Text style={{ color: c.textHigh }}>{stats.total}</Text>
          {' ders'}
        </Text>
      </View>

      {/* ── Goethe · TELC — kompakt pill ── */}
      <Pressable
        onPress={() => isPremium ? router.push('/exam-map') : router.push('/(tabs)/shop')}
        style={({ pressed }) => [styles.examPill, pressed && styles.examPillPressed]}
      >
        <Text style={styles.examPillEmoji}>🎓</Text>
        <View style={styles.examPillText}>
          <Text style={styles.examPillTitle}>Goethe · TELC Sınavı</Text>
          <Text style={styles.examPillSub}>
            {isPremium ? 'Sınav hazırlığı' : 'A1 · A2 · B1 · B2 · C1  🔒'}
          </Text>
        </View>
        <Ionicons
          name={isPremium ? 'chevron-forward' : 'lock-closed'}
          size={14}
          color={c.gold}
        />
      </Pressable>

      {/* ── Önerilen ders — tek satır kompakt ── */}
      {recommended ? (
        <Pressable
          onPress={() => router.push(`/lesson/${recommended.lesson.id}`)}
          style={({ pressed }) => [styles.recommendedCard, pressed && styles.recommendedCardPressed]}
        >
          <View style={styles.recommendedIconBox}>
            <Ionicons name="star" size={18} color={c.textOnNeon} />
          </View>
          <View style={styles.recommendedTextCol}>
            <Text style={styles.recommendedLabel}>{t('recommended.title')}</Text>
            <Text style={styles.recommendedTitle} numberOfLines={1}>{recommended.lesson.title}</Text>
            <Text style={styles.recommendedMeta} numberOfLines={1}>
              {recommended.level} · {recommended.unitTitle}
            </Text>
          </View>
          <View style={styles.recommendedArrow}>
            <Ionicons name="arrow-forward" size={16} color={c.neon} />
          </View>
        </Pressable>
      ) : null}

      {/* ── Arama ── */}
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

      {/* ── Seviye filtreleri: A1 → C1 ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <FilterChip c={c} label={t('lessons.all')} active={levelFilter === 'all'} onPress={() => setLevelFilter('all')} />
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

      {/* ── Durum filtresi: Hepsi · Sınav ── */}
      <View style={styles.statusRow}>
        <FilterChip c={c} label={t('lessons.all')} active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
        <FilterChip c={c} label={isPremium ? '🎓 Sınav' : '🎓 Sınav 🔒'} active={statusFilter === 'exam'} onPress={() => setStatusFilter('exam')} color={c.gold} colorBg={c.goldBg} />
      </View>

    </View>
  ), [c, t, styles, stats, recommended, search, levelFilter, statusFilter, setStatusFilter, setLevelFilter, isPremium]);

  const ListEmpty = useMemo(() => {
    // Sınav filtresi aktif + premium değil → özel premium gate
    if (statusFilter === 'exam' && !isPremium) {
      return (
        <View style={styles.examGate}>
          <View style={styles.examGateLockRing}>
            <Ionicons name="lock-closed" size={28} color="#a855f7" />
          </View>
          <Text style={styles.examGateTitle}>Premium İçerik</Text>
          <Text style={styles.examGateSub}>
            Goethe · TELC sınav hazırlık derslerine{'\n'}erişmek için Vogel Plus gerekiyor.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/shop')}
            style={({ pressed }) => [styles.examGateBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
          >
            <Text style={styles.examGateBtnText}>Vogel Plus'a Geç</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </Pressable>
        </View>
      );
    }
    return (
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
    );
  }, [c, t, hasFilters, clearFilters, styles, statusFilter, isPremium]);

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

      {/* ⬆️ Yukarı çık butonu — harita ekranıyla aynı görünüm */}
      <Animated.View
        style={[
          styles.scrollTopButton,
          {
            opacity: scrollTopOpacity,
            transform: [
              {
                scale: scrollTopOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showScrollTop ? 'auto' : 'none'}
      >
        <Pressable
          onPress={handleScrollToTop}
          style={({ pressed }) => [styles.scrollTopInner, pressed && styles.scrollTopPressed]}
          hitSlop={8}
        >
          <Ionicons name="arrow-up" size={26} color={c.neon} />
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
  const onPress = useCallback(() => {
    if (!item.isLocked) router.push(`/lesson/${item.lesson.id}`);
  }, [item.lesson.id, item.isLocked]);

  const statusMeta = item.isLocked
    ? { icon: 'lock-closed' as const, color: c.textLow, bgColor: c.glassBg, label: 'Kilitli' }
    : item.status === 'completed'
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
      style={({ pressed }) => [
        styles.card,
        item.isLocked && styles.cardLocked,
        pressed && !item.isLocked && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.statusIcon, { backgroundColor: statusMeta.bgColor, borderColor: statusMeta.color }]}>
          <Ionicons name={statusMeta.icon} size={item.isLocked ? 17 : 20} color={statusMeta.color} />
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
          <Text style={[styles.lessonTitle, item.isLocked && { color: c.textLow }]} numberOfLines={1}>
            {item.lesson.title}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            {!item.isLocked && item.status !== 'untouched' ? (
              <Text style={styles.progressText}>{item.correctCount}/{item.total} ({progressPercent}%)</Text>
            ) : !item.isLocked ? (
              <Text style={styles.progressText}>{t('lessons.questionsCount', { n: item.total })}</Text>
            ) : null}
          </View>
        </View>

        <Ionicons
          name={item.isLocked ? 'lock-closed' : 'chevron-forward'}
          size={item.isLocked ? 15 : 20}
          color={c.textLow}
        />
      </View>
    </Pressable>
  );
}

// 🚀 PERF: LessonCard React.memo — sadece item değiştiğinde re-render.
const LessonCard = React.memo(LessonCardImpl, (prev, next) =>
  prev.item.lesson.id === next.item.lesson.id &&
  prev.item.status === next.item.status &&
  prev.item.correctCount === next.item.correctCount &&
  prev.item.total === next.item.total &&
  prev.item.isLocked === next.item.isLocked,
);

function cardStylesFn(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.lg, padding: spacing.base,
    },
    cardLocked: { opacity: 0.45 },
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
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    header: { paddingTop: spacing.sm, paddingBottom: 2 },
    title: { ...textStyles.display, color: c.textHigh },
    statsInline: { ...textStyles.body, color: c.textLow, fontSize: 13, marginTop: 3 },

    // 🎓 Goethe · TELC — kompakt pill (eski büyük kart kaldırıldı)
    examPill: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.goldBg,
      borderWidth: 1.5, borderColor: c.gold,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 1,
      gap: spacing.sm,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
    },
    examPillPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
    examPillEmoji: { fontSize: 18 },
    examPillText: { flex: 1, gap: 1 },
    examPillTitle: { ...textStyles.bodyBold, color: c.gold, fontSize: 13 },
    examPillSub: { ...textStyles.body, color: c.textMed, fontSize: 10 },

    // ⭐ Önerilen ders — tek satır kompakt
    recommendedCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.neonBg,
      borderWidth: 1.5, borderColor: c.neon,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      gap: spacing.md,
    },
    recommendedCardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
    recommendedIconBox: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.neon,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    recommendedTextCol: { flex: 1, gap: 1 },
    recommendedLabel: { ...textStyles.label, color: c.neonLight, fontSize: 9, letterSpacing: 1 },
    recommendedTitle: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    recommendedMeta: { ...textStyles.body, color: c.textLow, fontSize: 11 },
    recommendedArrow: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: 'rgba(0,255,136,0.12)',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },

    // ── Durum filtresi satırı (Hepsi · Sınav) ──
    statusRow: { flexDirection: 'row', gap: spacing.sm },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      borderRadius: radius.md, paddingHorizontal: spacing.base, minHeight: 46,
    },
    searchInput: { ...textStyles.body, flex: 1, color: c.textHigh, paddingVertical: 0 },
    chipRow: { gap: spacing.sm, paddingRight: spacing.base },
    empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },

    // ── Sınav filtresi premium gate ──────────────────────────────
    examGate: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: spacing.xl ?? spacing.lg,
      gap: 14,
    },
    examGateLockRing: {
      width: 68, height: 68, borderRadius: 34,
      backgroundColor: 'rgba(168,85,247,0.1)',
      borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.35)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    examGateTitle: { ...textStyles.subheading, color: c.textHigh, fontSize: 18, fontWeight: '800' },
    examGateSub: {
      ...textStyles.body, color: c.textMed, fontSize: 13,
      textAlign: 'center', lineHeight: 20,
    },
    examGateBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#a855f7',
      borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24,
      marginTop: 4,
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
    },
    examGateBtnText: { ...textStyles.button, color: '#fff', fontSize: 14, fontWeight: '800' },
    emptyTitle: { ...textStyles.subheading, color: c.textMed, marginTop: spacing.sm },
    emptySubtitle: { ...textStyles.body, color: c.textLow, fontSize: 13, textAlign: 'center' },
    clearButton: {
      marginTop: spacing.base,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      borderRadius: radius.md, backgroundColor: c.neon,
    },
    clearButtonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 12 },
    // ⬆️ Yukarı çık floating button — harita ekranıyla aynı
    scrollTopButton: {
      position: 'absolute',
      right: spacing.base,
      bottom: spacing.lg,
      zIndex: 100,
    },
    scrollTopInner: {
      width: 52, height: 52,
      borderRadius: radius.lg,
      borderWidth: 1.5, borderColor: c.neon,
      backgroundColor: c.neonBg,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    scrollTopPressed: { opacity: 0.7, transform: [{ scale: 0.9 }] },
  });
}
