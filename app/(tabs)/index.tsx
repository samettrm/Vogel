import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ════════════════════════════════════════════════════════════════
// KUŞUN MOTİVASYON MESAJLARI — 22 farklı, 9 saniyede bir döner
// Çok hızlı slayt değil: göz alışsın, içerik okunsun, hız doğal hissettirsin
// ════════════════════════════════════════════════════════════════
const MOTIVATIONAL_MESSAGES = [
  'Devam et, harikasın! 🚀',
  'Her ders bir adım ileriye ✨',
  'Almancayı fethediyorsun 💪',
  'Bir ders daha, bir seviye daha yakın 🎯',
  'Beynin şu an Almanca düşünüyor 🧠',
  'Her kelime bir zafer! 🏆',
  'Serini kırmıyoruz, devam! 🔥',
  'Bugün öğrendiğin kelime yarın işe yarayacak 🌱',
  'Küçük adımlar büyük yollar açar 🦅',
  'Harika gidiyorsun, dur gitme! ✈️',
  'Almanya seni bekliyor 🇩🇪',
  'Her gün pratik, her gün gelişim ⚡',
  'Kafanda Almanca çalıyor mu? 🎵',
  'Bir ders daha? Neden olmasın! 😄',
  'Goethe seni izliyor olabilir 😂',
  'Durmak yok, ilerleme devam 💫',
  'Her doğru cevap seni uçuruyor 🌟',
  'Bugün de bir şeyler öğrendik! 🎓',
  'Yavaş ama emin adımlarla 🌱',
  'Sen bir Almanca makinesisin! 🤖',
  'Az kaldı, vazgeçme! 🏁',
  'Bugün de zirveyiz! ☀️',
] as const;
import { Animated, Easing, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
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

  // 📜 Scroll-to-current Button — Duolingo tarz�ı yukarı ok butonu
  // Kullanıcı aşağı kaydırınca görünür, basınca yavaşta hizlanan animasyonla current lesson'a döner
  const currentScrollY = useRef(0); // Anlık scroll Y konumu
  const scrollAnimY = useRef(new Animated.Value(0)).current; // Custom animasyon için
  const buttonOpacity = useRef(new Animated.Value(0)).current; // Buton fade in/out
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAnimatingScrollRef = useRef(false);

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

  // 📜 Hedef scroll Y koordinatı — current lesson'ın tam görünür olacağı konum
  // (useEffect içindeki scrollToIndex formulüyle birebir uyumlu)
  const targetScrollY = useMemo(() => {
    if (currentUnitIndex < 0 || !currentLessonId) return 0;
    let offset = 0;
    for (let i = 0; i < currentUnitIndex; i++) {
      const unit = course.units[i];
      offset += (unit?.lessons?.length ?? 0) * 124 + 40 + 80;
    }
    const currentUnit = course.units[currentUnitIndex];
    const lessonIndexInUnit = currentUnit?.lessons.findIndex(
      (l) => l.id === currentLessonId,
    ) ?? 0;
    // useEffect ile aynı formul: viewOffsetValue = 40 - 100 - lessonIndexInUnit * 124
    // FlatList scroll: scrollOffset = unitOffset - viewOffset
    const viewOffsetValue = 40 - 100 - lessonIndexInUnit * 124;
    return Math.max(0, offset - viewOffsetValue);
  }, [currentUnitIndex, currentLessonId, course.units]);

  // 📜 Animated.Value listener → her frame'de FlatList scroll güncelle
  useEffect(() => {
    const id = scrollAnimY.addListener(({ value }) => {
      if (isAnimatingScrollRef.current) {
        listRef.current?.scrollToOffset({ offset: value, animated: false });
      }
    });
    return () => scrollAnimY.removeListener(id);
  }, [scrollAnimY]);

  // 📜 Scroll event handler — buton görünürlüğünü kontrol et
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      currentScrollY.current = y;
      // Eğer current lesson'dan 400px+ aşağıdaysa butonu göster
      const shouldShow = y > targetScrollY + 400;
      if (shouldShow !== showScrollButton) {
        setShowScrollButton(shouldShow);
        Animated.timing(buttonOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    },
    [targetScrollY, showScrollButton, buttonOpacity],
  );

  // 📜 Butona basınca çalışır — yavaşta hizlanan animasyonla current lesson'a dön
  // Easing.in(Easing.quad): t^2, yavaş başlar hızlanır (Duolingo gibi)
  // Duration mesafeye göre dinamik (uzunsa daha uzun süre, kısaysa kısa)
  const handleScrollToCurrent = useCallback(() => {
    const startY = currentScrollY.current;
    const distance = Math.abs(startY - targetScrollY);
    if (distance < 50) return; // Zaten near current ise atla
    const duration = Math.min(1400, Math.max(600, distance * 0.5));
    isAnimatingScrollRef.current = true;
    scrollAnimY.setValue(startY);
    Animated.timing(scrollAnimY, {
      toValue: targetScrollY,
      duration,
      easing: Easing.in(Easing.quad), // ⚡ yavaşta hizlanan
      useNativeDriver: false, // scrollToOffset için zorunlu
    }).start(() => {
      isAnimatingScrollRef.current = false;
    });
  }, [scrollAnimY, targetScrollY]);

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

  // Exam ünitelerinin ders ID'leri — bunlar her zaman erişilebilir (kilitli değil)
  const examLessonIds = useMemo(() => {
    const ids = new Set<string>();
    for (const unit of course.units) {
      if (unit.tags?.includes('exam')) {
        for (const lesson of unit.lessons) ids.add(lesson.id);
      }
    }
    return ids;
  }, [course.units]);

  const getLessonInfo = useCallback((lesson: Lesson) => {
    const isExam = examLessonIds.has(lesson.id);
    const state: LessonNodeState = completedLessons.has(lesson.id)
      ? 'completed'
      : lesson.id === currentLessonId ? 'current'
      : isExam ? 'available'
      : 'locked';
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
  }, [completedLessons, currentLessonId, lessonExerciseProgress, examLessonIds]);

  const handleLessonPress = useCallback((lesson: Lesson) => {
    router.push(`/lesson/${lesson.id}`);
  }, [router]);

  // 🐦 Dönen motivasyon mesajları — 9 saniyede bir değişir (slayt değil, doğal hız)
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    if (completedLessons.size === 0 || currentLessonId === null) return;
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 9000);
    return () => clearInterval(id);
  }, [completedLessons.size, currentLessonId]);

  const mascotMessage = useMemo(() => {
    if (currentLessonId === null) return `${selectedLevel} ${t('map.levelCompleted')}`;
    if (completedLessons.size === 0) return t('map.welcome');
    return MOTIVATIONAL_MESSAGES[msgIndex];
  }, [completedLessons.size, currentLessonId, selectedLevel, msgIndex, t]);

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

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

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
          initialNumToRender={4}
          maxToRenderPerBatch={3}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
          initialScrollIndex={Math.max(0, currentUnitIndex)}
          onScrollToIndexFailed={onScrollToIndexFailed}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {/* ⬆️ Scroll-to-Current Button — Duolingo tarzı yukarı ok butonu */}
        {/* Kullanıcı aşağı kaydırınca görünür, basınca current lesson'a döner */}
        <Animated.View
          style={[
            styles.scrollToCurrentButton,
            {
              opacity: buttonOpacity,
              transform: [
                {
                  scale: buttonOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={showScrollButton ? 'auto' : 'none'}
        >
          <Pressable
            onPress={handleScrollToCurrent}
            style={({ pressed }) => [
              styles.scrollToCurrentInner,
              { borderColor: lc.main, backgroundColor: lc.bg },
              pressed && styles.scrollToCurrentPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-up" size={26} color={lc.main} />
          </Pressable>
        </Animated.View>
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
    // ⬆️ Scroll-to-current button — sağ alt köşede floating
    scrollToCurrentButton: {
      position: 'absolute',
      right: spacing.base,
      bottom: spacing.lg,
      zIndex: 100,
      // SafeAreaView içindeyiz, tab bar zaten alt edge'inde
    },
    scrollToCurrentInner: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    scrollToCurrentPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.9 }],
    },
  });
}
