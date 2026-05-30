import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

console.warn('[FILE_LOAD] app/(tabs)/index.tsx loaded');
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, InteractionManager, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
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
import type { CEFRLevel, Lesson, Unit } from '../../src/types';

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

// ════════════════════════════════════════════════════════════════
// 🛡 MAP ENTRY GUARD (2026-05-30 — AI consensus)
//
// Root guard'a güvenmiyoruz. Map ekranı kendi içinde korunuyor:
//   1. hasHydrated === false → null render (splash görünür)
//   2. onboardingCompleted !== true VEYA hasCompletedPlacement !== true
//      → <Redirect href="/onboarding" />
//   3. Aksi halde → MapScreenContent (gerçek harita)
//
// STRICT EŞİTLİK: undefined/null/false → "not completed" sayılır.
// Lesson progress, completedLessons, xp gibi state'lere BAKILMAZ.
//
// Bu wrapper pattern hooks-rules'u ihlal etmez — wrapper sadece 3 hook
// kullanır, inner component (MapScreenContent) her zaman aynı hook
// sırasıyla render olur (sadece guard geçerse).
// ════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const hasCompletedPlacement = useUserStore((s) => s.hasCompletedPlacement);

  console.warn('[MAP_GUARD]', {
    hasHydrated,
    onboardingCompleted,
    hasCompletedPlacement,
    onboardingCompletedStrict: onboardingCompleted === true,
    placementStrict: hasCompletedPlacement === true,
    timestamp: Date.now(),
  });

  if (!hasHydrated) {
    return null;
  }

  if (onboardingCompleted !== true || hasCompletedPlacement !== true) {
    return <Redirect href="/onboarding" />;
  }

  return <MapScreenContent />;
}

function MapScreenContent() {
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
  const isPremium = useUserStore((s) => s.isPremium);

  // ✨ Yeterlilik sınavı chip — şimşek ışıltısı
  const examShineAnim = useRef(new Animated.Value(-80)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(examShineAnim, { toValue: 260, duration: 600, useNativeDriver: true }),
        Animated.timing(examShineAnim, { toValue: -80, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [examShineAnim]);

  // ⭐ Yıldız ışıltısı
  const examStar1 = useRef(new Animated.Value(0)).current;
  const examStar2 = useRef(new Animated.Value(0)).current;
  const examStar3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const sparkle = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 380, useNativeDriver: true }),
          Animated.delay(2600),
        ]),
      );
    const a1 = sparkle(examStar1, 400);
    const a2 = sparkle(examStar2, 1200);
    const a3 = sparkle(examStar3, 2000);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [examStar1, examStar2, examStar3]);

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
  const currentScrollY = useRef(0); // Anlık scroll Y konumu (her scroll'da güncel)
  const scrollAnimY = useRef(new Animated.Value(0)).current; // Custom animasyon için
  const buttonOpacity = useRef(new Animated.Value(0)).current; // Buton fade in/out
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAnimatingScrollRef = useRef(false);
  // Programmatik scroll (useEffect / ⬆️ button) sırasında sticky güncellemesini durdur
  const isProgrammaticScrollRef = useRef(false);

  // 🛡 SCROLL JUMP PREVENTION (2026-05-30):
  //   - lastScrolledForLessonRef: Hangi lesson için son scroll yapıldığını track.
  //     Aynı lesson için tekrar tekrar scroll YAPMAZ.
  //   - Tab focus sonrası saved scroll Y'yi restore eder (jump-to-top yok).
  //   - Smooth scroll SADECE current lesson görünür değilse + lesson değiştiyse.
  const lastScrolledForLessonRef = useRef<string | null>(null);

  // ─── Sticky bölüm başlığı (Duolingo tarzı) ──────────────────────────
  // Scroll edilince o anki ünitenin adı üstte sabit bantla gösterilir
  const stickyUnitRef = useRef<Unit | null>(null);
  const [stickyUnit, setStickyUnit] = useState<Unit | null>(null);
  const stickyAnim = useRef(new Animated.Value(0)).current;
  const listHeaderHeight = useRef(0);

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

  // 📜 Hedef scroll Y koordinatı — current lesson'ın tam görünür olacağı konum
  //    Önceden bu useEffect'lerden SONRA tanımlıydı, TDZ hatası riski vardı.
  //    Şimdi yukarı taşındı — useEffect/useFocusEffect güvenli kullanabilir.
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
    const viewOffsetValue = 40 - 100 - lessonIndexInUnit * 124;
    return Math.max(0, offset - viewOffsetValue);
  }, [currentUnitIndex, currentLessonId, course.units]);

  // 📜 V5 FIX (2026-05-30) — Restore-first, then track
  //
  // User spec:
  //   1. Lesson'a girerken scroll Y kaydet (handleScroll onScroll ile current)
  //   2. Lesson'dan dönünce ÖNCE savedY restore (animated: false) — sessizce
  //   3. Restore sonrası aktif lesson visible mı kontrol
  //   4. Visible → no-op
  //   5. Not visible → smooth scroll (InteractionManager)
  //
  // ⚠️ KRITIK FARK V4 ile:
  //   V4 sadece visibility check yapıyordu, currentScrollY.current'a güveniyordu.
  //   Eğer FlatList freezeOnBlur sonrası y=0'a düşüyorsa, currentScrollY stale
  //   kalıyor → "lesson visible" yanlış kararı veriyordu → kamera y=0'da kalıyordu.
  //
  //   V5: HER focus'ta önce restore — FlatList state'i kaybetmemiş bile olsa
  //   no-op olur, kaybetmişse fix eder. Sonra visibility check + smooth scroll.
  //
  // lastScrolledForLessonRef:
  //   - SADECE aynı activeLessonId tekrarını engeller
  //   - Yeni activeLessonId geldiyse engellenmiyor (her seferinde focus logic çalışır)
  useFocusEffect(
    useCallback(() => {
      if (!hasHydrated || currentUnitIndex < 0 || !currentLessonId) return;

      // 1️⃣ İlk render — FlatList initialScrollIndex kendi handle eder
      if (lastScrolledForLessonRef.current === null) {
        lastScrolledForLessonRef.current = currentLessonId;
        console.warn('[MAP_SCROLL_FOCUS_LESSON]', {
          activeLessonId: currentLessonId,
          reason: 'initial-mount-no-scroll',
          shouldScroll: false,
        });
        return;
      }

      // 2️⃣ Aynı lesson — sadece restore (yeni scroll yok)
      const isSameLesson = lastScrolledForLessonRef.current === currentLessonId;

      const savedY = currentScrollY.current;

      // 3️⃣ ÖNCE saved scroll Y'yi sessizce restore et
      //    (FlatList y=0'a düştüyse fix eder; düşmediyse no-op)
      //    Bu HER focus'ta yapılır — same lesson ya da yeni lesson, fark etmez.
      console.warn('[MAP_SCROLL_RESTORE]', {
        scrollY: savedY,
        isSameLesson,
      });
      try {
        listRef.current?.scrollToOffset({
          offset: savedY,
          animated: false, // ⚡ Sessizce, animasyon YOK
        });
      } catch {}

      // 4️⃣ Same lesson + restore yapıldı → bitti
      if (isSameLesson) {
        console.warn('[MAP_SCROLL_FOCUS_LESSON]', {
          activeLessonId: currentLessonId,
          reason: 'same-lesson-restore-only',
          shouldScroll: false,
        });
        return;
      }

      // 5️⃣ Yeni lesson — visibility check (restore sonrası)
      const distance = Math.abs(savedY - targetScrollY);
      const TOLERANCE = 350;
      const visible = distance <= TOLERANCE;

      if (visible) {
        lastScrolledForLessonRef.current = currentLessonId;
        console.warn('[MAP_SCROLL_FOCUS_LESSON]', {
          activeLessonId: currentLessonId,
          currentY: savedY,
          targetY: targetScrollY,
          distance,
          visible: true,
          reason: 'new-lesson-visible-no-scroll',
          shouldScroll: false,
        });
        return;
      }

      // 6️⃣ Yeni lesson far → smooth scroll (active lesson tracking)
      const currentUnit = course.units[currentUnitIndex];
      if (!currentUnit) return;
      const lessonIndexInUnit = currentUnit.lessons.findIndex((l) => l.id === currentLessonId);
      if (lessonIndexInUnit < 0) return;
      const viewOffsetValue = 40 - 100 - lessonIndexInUnit * 124;

      console.warn('[MAP_SCROLL_FOCUS_LESSON]', {
        activeLessonId: currentLessonId,
        currentY: savedY,
        targetY: targetScrollY,
        distance,
        visible: false,
        reason: 'new-lesson-far-smooth-tracking',
        shouldScroll: true,
      });

      isProgrammaticScrollRef.current = true;
      const handle = InteractionManager.runAfterInteractions(() => {
        try {
          listRef.current?.scrollToIndex({
            index: currentUnitIndex,
            animated: true,
            viewPosition: 0,
            viewOffset: viewOffsetValue,
          });
        } catch {
          // onScrollToIndexFailed fallback
        }
        lastScrolledForLessonRef.current = currentLessonId;
        setTimeout(() => { isProgrammaticScrollRef.current = false; }, 700);
      });

      return () => {
        handle.cancel?.();
      };
    }, [hasHydrated, currentUnitIndex, currentLessonId, course.units, targetScrollY]),
  );

  // 📜 Animated.Value listener → her frame'de FlatList scroll güncelle
  useEffect(() => {
    const id = scrollAnimY.addListener(({ value }) => {
      if (isAnimatingScrollRef.current) {
        listRef.current?.scrollToOffset({ offset: value, animated: false });
      }
    });
    return () => scrollAnimY.removeListener(id);
  }, [scrollAnimY]);

  // 📜 Last logged scroll Y — log spam'i önlemek için sadece 200px+ değişimde log
  const lastLoggedScrollY = useRef(0);

  // 📜 Scroll event handler — buton görünürlüğünü kontrol et
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      currentScrollY.current = y;
      // 🔍 Log throttle — sadece 200px+ değişimde log bas (log spam yok)
      if (Math.abs(y - lastLoggedScrollY.current) > 200) {
        console.warn('[MAP_SCROLL_SAVE]', { scrollY: Math.round(y) });
        lastLoggedScrollY.current = y;
      }
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

      // ── Sticky bölüm başlığı: programmatik scroll sırasında güncelleme yapma
      if (isProgrammaticScrollRef.current) return;
      const headerH = listHeaderHeight.current;
      let found: Unit | null = null;
      if (y >= headerH) {
        let acc = headerH;
        for (const unit of course.units) {
          const unitH = unit.lessons.length * 124 + 40 + 80;
          if (y < acc + unitH) { found = unit; break; }
          acc += unitH;
        }
      }
      if (found !== stickyUnitRef.current) {
        const prev = stickyUnitRef.current;
        stickyUnitRef.current = found;
        if (found && !prev) {
          setStickyUnit(found);
          Animated.timing(stickyAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        } else if (!found && prev) {
          Animated.timing(stickyAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
            () => { setStickyUnit(null); },
          );
        } else if (found) {
          // Ünite değişti — içeriği güncelle (banner zaten görünür)
          setStickyUnit(found);
        }
      }
    },
    [targetScrollY, showScrollButton, buttonOpacity, course.units, stickyAnim],
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
    isProgrammaticScrollRef.current = true;
    scrollAnimY.setValue(startY);
    Animated.timing(scrollAnimY, {
      toValue: targetScrollY,
      duration,
      easing: Easing.in(Easing.quad), // ⚡ yavaşta hizlanan
      useNativeDriver: false, // scrollToOffset için zorunlu
    }).start(() => {
      isAnimatingScrollRef.current = false;
      isProgrammaticScrollRef.current = false;
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

  // Exam ünitelerinin ders ID'leri — sadece premium kullanıcılar erişebilir
  const examLessonIds = useMemo(() => {
    const ids = new Set<string>();
    if (!isPremium) return ids;             // premium değilse kilitli
    for (const unit of course.units) {
      if (unit.tags?.includes('exam')) {
        for (const lesson of unit.lessons) ids.add(lesson.id);
      }
    }
    return ids;
  }, [course.units, isPremium]);

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

  // ListHeader yüksekliğini ölç → sticky banner tetikleme noktası
  const onListHeaderLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      listHeaderHeight.current = e.nativeEvent.layout.height;
    },
    [],
  );

  const ListHeader = useMemo(() => (
    <View onLayout={onListHeaderLayout}>
      {/* 👋 Günlük karşılama */}
      <View style={styles.greetingWrap}>
        <Text style={styles.greetingHi}>{t('map.greetingHi')}</Text>
        <Text style={styles.greetingSub}>{t('map.greetingSub')}</Text>
      </View>

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
  ), [styles, lc, selectedLevel, course.title, course.description, onListHeaderLayout, t]);

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
          {/* 🎓 Yeterlilik Sınavı — glowing chip */}
          <Pressable
            onPress={() => isPremium ? router.push('/exam-map') : router.push('/(tabs)/shop')}
            style={({ pressed }) => [styles.examChip, pressed && styles.examChipPressed]}
          >
            <LinearGradient
              colors={[c.goldGlow, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <Animated.View
              style={{
                position: 'absolute', top: 0, bottom: 0, width: 28,
                backgroundColor: 'rgba(255,220,80,0.30)',
                transform: [{ translateX: examShineAnim }],
              }}
              pointerEvents="none"
            />
            <Animated.Text style={{ position: 'absolute', top: 3, right: 22, fontSize: 12, color: '#FFD700', opacity: examStar1, transform: [{ scale: examStar1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.8, 0.3] }) }] }} pointerEvents="none">✦</Animated.Text>
            <Animated.Text style={{ position: 'absolute', top: 10, left: 48, fontSize: 11, color: '#FFD700', opacity: examStar2, transform: [{ scale: examStar2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.7, 0.3] }) }] }} pointerEvents="none">★</Animated.Text>
            <Animated.Text style={{ position: 'absolute', bottom: 2, right: 14, fontSize: 11, color: '#FFD700', opacity: examStar3, transform: [{ scale: examStar3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.7, 0.3] }) }] }} pointerEvents="none">✦</Animated.Text>
            <Text style={styles.examChipEmoji}>🎓</Text>
            <View style={styles.examChipText}>
              <Text style={styles.examChipTitle}>Yeterlilik Sınavı</Text>
              <Text style={styles.examChipSub}>
                {isPremium ? 'Sınav hazırlığı' : 'A1 · A2 · B1 · B2 · C1 🔒'}
              </Text>
            </View>
            <Ionicons
              name={isPremium ? 'chevron-forward' : 'lock-closed'}
              size={13}
              color={c.gold}
            />
          </Pressable>

          {/* Mascot + dev-only reset (gizli küçük ikon) */}
          <View style={styles.mascotEnd}>
            {__DEV__ && (
              <Pressable
                onPress={handleResetProgress}
                style={({ pressed }) => [styles.resetIconBtn, pressed && { opacity: 0.5 }]}
                hitSlop={10}
              >
                <Ionicons name="refresh" size={13} color={c.textLow} />
              </Pressable>
            )}
            <BirdMascot size="md" />
          </View>
        </View>

        {/* 📌 Harita alanı — sticky bölüm başlığı + FlatList */}
        <View style={styles.mapArea}>

          {/* Sticky bölüm başlığı — level header kaydırılınca yukarıda sabit kalar */}
          <Animated.View
            style={[styles.stickyUnitBanner, { opacity: stickyAnim }]}
            pointerEvents="none"
          >
            {stickyUnit ? (
              <View style={styles.stickyUnitContent}>
                <Text style={styles.stickyUnitOrder} numberOfLines={1}>
                  {stickyUnit.tags?.includes('exam')
                    ? '🎓 SINAV'
                    : `${t('lessons.unit')} ${stickyUnit.order}`}
                </Text>
                <View style={styles.stickyDivider} />
                <Text style={styles.stickyUnitTitle} numberOfLines={1}>
                  {stickyUnit.title}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* 🚀 PERF: FlatList virtualization — 11 ünite, sadece görünür olanlar render */}
          <FlatList
          // 🔑 Key — her current LESSON değişiminde FlatList remount eder (timing sorunlarını yok eder)
          key={selectedLevel}
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

        </View>{/* /mapArea */}

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
      paddingHorizontal: spacing.base, paddingVertical: spacing.xs,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    mascotEnd: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    },
    // 🔧 Dev-only reset — küçük, soluk, dikkat çekmiyor
    resetIconBtn: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center',
      opacity: 0.45,
    },
    scrollContent: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
    // 👋 Günlük karşılama
    greetingWrap: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    greetingHi:  { ...textStyles.display, color: c.textHigh, fontSize: 22, lineHeight: 28 },
    greetingSub: { ...textStyles.bodyBold, color: c.neon, fontSize: 13, marginTop: 3, opacity: 0.9 },
    // ─────────────────────────────────────────────────────────────
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
    // 🎓 Yeterlilik sınavı chip — glowing pill
    examChip: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.goldBg,
      borderWidth: 2, borderColor: c.gold,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      gap: spacing.sm,
      overflow: 'hidden',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55, shadowRadius: 16, elevation: 8,
    },
    examChipPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
    examChipEmoji: { fontSize: 17 },
    examChipText: { gap: 1 },
    examChipTitle: { ...textStyles.bodyBold, color: c.gold, fontSize: 12 },
    examChipSub: { ...textStyles.body, color: c.textMed, fontSize: 9.5, opacity: 0.9 },
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
    // 📌 Sticky bölüm başlığı
    mapArea: { flex: 1 },
    stickyUnitBanner: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      zIndex: 20,
      paddingHorizontal: spacing.base,
      paddingVertical: 8,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 3,
    },
    stickyUnitContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    stickyUnitOrder: {
      ...textStyles.label,
      color: c.neon,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    stickyDivider: {
      width: 1,
      height: 11,
      backgroundColor: c.glassBorder,
    },
    stickyUnitTitle: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 13,
      flex: 1,
    },
  });
}
