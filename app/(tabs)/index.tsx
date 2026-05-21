import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BirdMascot } from '../../src/components/map/BirdMascot';
import type { LessonNodeState } from '../../src/components/map/LessonNode';
import { LevelTabs } from '../../src/components/map/LevelTabs';
import { MapPath } from '../../src/components/map/MapPath';
import { TopStatusBar } from '../../src/components/map/TopStatusBar';
import { ReviewBanner } from '../../src/components/review/ReviewBanner';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { ALL_COURSES, AVAILABLE_LEVELS, getCourseByLevel } from '../../src/data/courses';
import { useT } from '../../src/i18n';
import { useUserStore } from '../../src/store/useUserStore';
import { getLevelColor, radius, spacing, textStyles, useThemeColors } from '../../src/theme';
import type { Lesson, Unit } from '../../src/types';

// ════════════════════════════════════════════════════════════════
// HARITA — Ders haritası ekranı
//
// 🚀 PERF NOTLARI:
//   - FlatList virtualization (11 ünite görünür olanlar render)
//   - MapPath React.memo (sadece ünite/getLessonInfo değişimi)
//   - Per-node FadeInDown KALDIRILDI (66 düğüm staggered spring bloke ediyordu)
//   - Background glow View'lar KALDIRILDI (Android blur composit pahalı)
// ════════════════════════════════════════════════════════════════

const SCREEN_HEIGHT = Dimensions.get('window').height;
const APPROX_UNIT_HEIGHT = 124 * 6 + 40 + 80 + 16; // 6 ders + header + margin

// (Cache mantığı kaldırıldı — scrollToIndex ile her ders bittiğinde current unit'e snap)

export default function HomeScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const t = useT();

  const completedLessons = useUserStore((s) => s.completedLessons);
  const lessonExerciseProgress = useUserStore((s) => s.lessonExerciseProgress);
  const applyHeartRefills = useUserStore((s) => s.applyHeartRefills);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const resetProgressForTesting = useUserStore((s) => s.resetProgressForTesting);
  const selectedLevel = useUserStore((s) => s.selectedLevel);
  const setSelectedLevel = useUserStore((s) => s.setSelectedLevel);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetProgress = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const onResetConfirm = useCallback(() => {
    setShowResetConfirm(false);
    resetProgressForTesting();
  }, [resetProgressForTesting]);

  const onResetCancel = useCallback(() => setShowResetConfirm(false), []);

  const listRef = useRef<FlatList<Unit>>(null);

  const course = useMemo(
    () => getCourseByLevel(selectedLevel) ?? ALL_COURSES[0],
    [selectedLevel],
  );

  const flatLessons = useMemo(
    () => course.units.flatMap((u) => u.lessons),
    [course],
  );

  const currentLessonId = useMemo(() => {
    const next = flatLessons.find((l) => !completedLessons.has(l.id));
    return next?.id ?? null;
  }, [flatLessons, completedLessons]);

  useEffect(() => {
    if (hasHydrated) {
      applyHeartRefills();
    }
  }, [hasHydrated, applyHeartRefills]);

  // 📜 Current unit index — hangi ünitede current lesson var?
  const currentUnitIndex = useMemo(() => {
    if (!currentLessonId) return -1;
    return course.units.findIndex((u) =>
      u.lessons.some((l) => l.id === currentLessonId),
    );
  }, [course.units, currentLessonId]);

  // 📜 Her ünitenin exact yüksekliği (FlatList'in precise scroll yapabilmesi için)
  // unit_height = lessons * 124 + header 40 + bottom margin 80
  const getItemLayout = useCallback(
    (data: ArrayLike<Unit> | null | undefined, index: number) => {
      const units = data ? Array.from(data) : [];
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const unit = units[i];
        offset += (unit?.lessons?.length ?? 0) * 124 + 40 + 80;
      }
      const length = (units[index]?.lessons?.length ?? 0) * 124 + 40 + 80;
      return { length, offset, index };
    },
    [],
  );

  // 📜 Current LESSON'a scroll — sadece unit'e değil, kalan ders'in tam görünür olacağı konuma
  // Mantık: scrollToIndex unit'e snap yapar, viewOffset ile unit içindeki lesson konumunu hesaba katar
  // Formül: viewOffset = 60 - lessonIndexInUnit * 124
  //   → lesson_0 (ilk ders): viewOffset=60 → unit başlığı görünür + ilk ders 100px aşağıda
  //   → lesson_2 (3. ders): viewOffset=-188 → unit başlığı kayar, current ders 100px aşağıda
  useEffect(() => {
    if (!hasHydrated) return;
    if (currentUnitIndex < 0) return;
    if (!currentLessonId) return;

    const currentUnit = course.units[currentUnitIndex];
    if (!currentUnit) return;
    const lessonIndexInUnit = currentUnit.lessons.findIndex(
      (l) => l.id === currentLessonId,
    );
    if (lessonIndexInUnit < 0) return;

    // viewOffset: lesson ekranın üstünden ~100px aşağıda görünsün
    // (40 unit header - 100 padding - lessonIndex * 124)
    const viewOffsetValue = 40 - 100 - lessonIndexInUnit * 124;

    const tt = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: currentUnitIndex,
          animated: true,  // ✨ Yumuşak kayma (sert değil)
          viewPosition: 0,
          viewOffset: viewOffsetValue,
        });
      } catch {
        // Fallback onScrollToIndexFailed'de
      }
    }, 100);

    return () => clearTimeout(tt);
  }, [hasHydrated, currentUnitIndex, currentLessonId, course.units]);

  // 📜 scrollToIndex fail olursa (index henuz render edilmediyse) retry
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      const offset = info.averageItemLength * info.index;
      listRef.current?.scrollToOffset({ offset, animated: false });
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
            viewPosition: 0.1,
          });
        } catch {}
      }, 100);
    },
    [],
  );

  const getLessonInfo = useCallback((lesson: Lesson) => {
    const state: LessonNodeState = completedLessons.has(lesson.id)
      ? 'completed'
      : lesson.id === currentLessonId ? 'current' : 'locked';
    const total = Math.max(1, lesson.exercises?.length ?? 0);
    const progress = lessonExerciseProgress[lesson.id] ?? {};
    let correctSaved = 0;
    let wrong = 0;
    if (lesson.exercises) {
      for (const ex of lesson.exercises) {
        const v = progress[ex.id];
        if (v === 'correct') correctSaved++;
        else if (v === 'wrong') wrong++;
      }
    }
    const hasAnyResult = correctSaved + wrong > 0;
    const correct = state === 'completed' && !hasAnyResult ? total : correctSaved;
    return { state, total, correct, wrong };
  }, [completedLessons, currentLessonId, lessonExerciseProgress]);

  const handleLessonPress = useCallback((lesson: Lesson) => {
    router.push(`/lesson/${lesson.id}`);
  }, [router]);

  const mascotMessage = useMemo(() => {
    if (currentLessonId === null) return `${selectedLevel} ${t('map.levelCompleted')}`;
    if (completedLessons.size === 0) return t('map.welcome');
    return t('map.keepGoing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedLessons.size, currentLessonId, selectedLevel]);

  const nextLevel = useMemo(() => {
    if (currentLessonId !== null) return null;
    const idx = AVAILABLE_LEVELS.indexOf(selectedLevel);
    if (idx < 0 || idx >= AVAILABLE_LEVELS.length - 1) return null;
    return AVAILABLE_LEVELS[idx + 1];
  }, [currentLessonId, selectedLevel]);

  const goToNextLevel = useCallback(() => {
    if (!nextLevel) return;
    setSelectedLevel(nextLevel);
  }, [nextLevel, setSelectedLevel]);

  const lc = useMemo(() => getLevelColor(selectedLevel, c), [selectedLevel, c]);
  const nextLc = useMemo(
    () => (nextLevel ? getLevelColor(nextLevel, c) : null),
    [nextLevel, c],
  );

  const styles = makeStyles(c);

  // 🚀 PERF: FlatList renderItem ve keyExtractor stable callback'lar
  const renderUnit = useCallback(
    ({ item }: { item: Unit }) => (
      <MapPath
        unit={item}
        unitOrder={item.order}
        getLessonInfo={getLessonInfo}
        onLessonPress={handleLessonPress}
      />
    ),
    [getLessonInfo, handleLessonPress],
  );

  const keyExtractor = useCallback((u: Unit) => u.id, []);

  const ListHeader = useMemo(() => (
    <View>
      {/* 🔄 Tekrar Sırası banner — SM-2 algoritmasıyla due olan kelimeler varsa görünür */}
      <ReviewBanner />
      <View style={[styles.levelHeader, { borderLeftColor: lc.main }]}>
        <View style={[styles.levelPill, { backgroundColor: lc.bg, borderColor: lc.main }]}>
          <Text style={[styles.levelPillText, { color: lc.light }]}>{selectedLevel}</Text>
        </View>
        <Text style={[styles.levelTitle, { color: lc.light }]}>{course.title}</Text>
        <Text style={styles.levelDescription}>{course.description}</Text>
      </View>
    </View>
  ), [styles, lc, selectedLevel, course.title, course.description]);

  const ListFooter = useMemo(() => (
    <>
      {nextLevel && nextLc ? (
        <Pressable
          onPress={goToNextLevel}
          style={({ pressed }) => [
            styles.nextLevelCard,
            {
              borderColor: nextLc.main,
              shadowColor: nextLc.main,
              backgroundColor: nextLc.bg,
            },
            pressed && styles.nextLevelCardPressed,
          ]}
        >
          <Text style={[styles.nextLevelLabel, { color: nextLc.light }]}>
            {t('nextLevel.completed')}
          </Text>
          <Text style={styles.nextLevelCta}>
            {t('nextLevel.continueCta', { level: nextLevel })}
          </Text>
        </Pressable>
      ) : null}
      <View style={{ height: spacing.xxxl * 2 }} />
    </>
  ), [styles, nextLevel, nextLc, goToNextLevel, t]);

  return (
    <View style={styles.root}>
      <ConfirmDialog
        visible={showResetConfirm}
        title={t('map.resetTitle')}
        message={t('map.resetMessage')}
        confirmLabel={t('map.resetConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={onResetConfirm}
        onCancel={onResetCancel}
        destructive
        icon="refresh-circle"
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopStatusBar />

        <LevelTabs
          levels={AVAILABLE_LEVELS}
          selectedLevel={selectedLevel}
          onSelect={setSelectedLevel}
        />

        <View style={styles.mascotRow}>
          <Pressable
            onPress={handleResetProgress}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.resetButtonPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="refresh" size={14} color={c.red} />
            <Text style={styles.resetButtonText}>{t('map.resetButton')}</Text>
          </Pressable>

          <BirdMascot message={mascotMessage} size="md" />
        </View>

        {/* 🚀 PERF: FlatList virtualization — 11 ünite, sadece görünür olanlar render */}
        <FlatList
          // 🔑 Key — her current LESSON değişiminde FlatList remount eder (timing sorunlarını yok eder)
          key={`${selectedLevel}-${currentLessonId ?? 'none'}`}
          ref={listRef}
          data={course.units}
          renderItem={renderUnit}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={11}
          maxToRenderPerBatch={4}
          windowSize={11}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
          initialScrollIndex={Math.max(0, currentUnitIndex)}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />
      </SafeAreaView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    safe: { flex: 1 },
    mascotRow: {
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    resetButton: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: spacing.sm, paddingVertical: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1, borderColor: c.red,
      borderRadius: radius.pill,
    },
    resetButtonPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
    resetButtonText: { ...textStyles.label, color: c.red, fontSize: 10 },
    scrollContent: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
    levelHeader: {
      paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.lg,
      gap: spacing.xs,
      borderLeftWidth: 4,
      marginLeft: spacing.base,
      paddingLeft: spacing.md,
    },
    levelPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      marginBottom: 2,
    },
    levelPillText: { ...textStyles.bodyBold, fontSize: 11, letterSpacing: 1.5 },
    levelTitle: { ...textStyles.heading, fontSize: 22 },
    levelDescription: { ...textStyles.body, color: c.textLow, fontSize: 13, lineHeight: 18 },
    nextLevelCard: {
      marginHorizontal: spacing.base,
      marginTop: spacing.xl,
      borderWidth: 1.5,
      borderRadius: radius.lg,
      padding: spacing.base,
      gap: 4,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
    },
    nextLevelCardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
    nextLevelLabel: { ...textStyles.label, fontSize: 11 },
    nextLevelCta: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 16 },
  });
}
