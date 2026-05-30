import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

console.warn('[FILE_LOAD] app/(tabs)/index.tsx loaded');
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, InteractionManager, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { mapNavState } from '../../src/utils/navState';
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
  // 🔒 V13: Progress sync gate
  //   Login sonrası cloud progress yüklenirken Map render etmesin.
  //   isProgressSyncing=true iken loading göster, false olunca MapScreenContent mount et.
  const isProgressSyncing = useUserStore((s) => s.isProgressSyncing);

  console.warn('[MAP_GUARD]', {
    hasHydrated,
    onboardingCompleted,
    hasCompletedPlacement,
    isProgressSyncing,
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

  // 🔒 V13: Progress sync devam ediyorsa Map'i mount ETME
  //   MapScreenContent mount olduğu anda focus tetiklenir (useFocusEffect).
  //   completedLessons stale ise yanlış lesson hedeflenir.
  //   isProgressSyncing false olduğunda re-render olur ve Map mount edilir.
  if (isProgressSyncing) {
    console.warn('[APP_READY_GATE]', {
      isProgressSyncing: true,
      action: 'block-map-render',
    });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14' }}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
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

  // 📐 V7: Viewport/content dimension tracking (precise lesson centering)
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const LESSON_HEIGHT = 124;
  const UNIT_HEADER_HEIGHT = 40;
  const UNIT_BOTTOM_MARGIN = 80;

  // 🛡 V7: User-scroll override guard
  //   Kullanıcı manuel kaydırma yaptıktan sonra 1.5sn boyunca auto-scroll skip.
  //   ⚠️ V9: lesson_complete focus için force=true ile bypass edilir.
  const lastUserScrollTime = useRef(0);

  // 📍 V9: 3-katmanlı Y ölçümü (formül YOK, sadece onLayout)
  //   1. unitYMap     → unit View wrapper'ı içindeki Y (FlatList content içinde)
  //   2. pathYMap     → pathContainer'ın unit içindeki Y (header'ın altı)
  //   3. lessonLayouts → her lesson nodeWrap'ının pathContainer içindeki Y + height
  //
  //   Compose: lessonAbsCenter = unitY + pathY + lessonLayout.y + lessonLayout.height/2
  const unitYMap = useRef<Record<string, number>>({});
  const pathYMap = useRef<Record<string, number>>({});
  const lessonLayoutsMap = useRef<Record<string, { y: number; height: number }>>({});

  // 📌 V9: Pending focus — layout/viewport ready olmadığında queue'la
  const pendingFocusRef = useRef<{
    lessonId: string;
    reason: string;
    force: boolean;
    animated: boolean;
  } | null>(null);

  // 📊 V9: Lesson değişimi takibi — currentLessonId değiştiyse lesson_complete
  const previousLessonIdRef = useRef<string | null>(null);

  // 💾 V27: Lesson'a girmeden önceki scroll pozisyonu (lesson dönüşünde restore için)
  const savedScrollYBeforeLessonRef = useRef<number | null>(null);

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

  // 📍 V11: nextPlayableLessonId — units sırasıyla taranır, completedLessons'da olmayan ilk lesson
  //   USER SPEC: focus hedefi her zaman BU olmalı, currentLessonId (state) değil.
  //   currentLessonId stale olabilir (login/sync sonrası), helper her zaman fresh hesaplar.
  const nextPlayableLessonId = useMemo(() => {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        if (!completedLessons.has(lesson.id)) {
          console.warn('[NEXT_PLAYABLE_CALC]', {
            unitId: unit.id,
            unitOrder: unit.order,
            lessonId: lesson.id,
            completedCount: completedLessons.size,
          });
          return lesson.id;
        }
      }
    }
    // Tüm dersler tamamlandı → son dersi göster
    const lastUnit = course.units[course.units.length - 1];
    const lastLesson = lastUnit?.lessons?.[lastUnit.lessons.length - 1];
    console.warn('[NEXT_PLAYABLE_ALL_COMPLETED]', {
      fallbackLessonId: lastLesson?.id,
    });
    return lastLesson?.id ?? null;
  }, [course.units, completedLessons]);

  // currentLessonId LEGACY (sticky button + scroll target için aynı kalır)
  const currentLessonId = nextPlayableLessonId;

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

  // 📜 V12: Ünite yüksekliği (FlatList virtualization + scrollToIndex için)
  //   MapPath gerçek yapısı:
  //     - headerWrap: padding (md=12 vertical) + text (~50px) + marginBottom (base=16) → ~90
  //     - pathContainer height: lessons * 124 (NODE_SPACING) + 40 (FIRST_NODE_OFFSET) + spacing.lg (20) → lessons*124 + 60
  //     - container marginBottom: spacing.lg (20)
  //   Toplam ≈ lessons * 124 + 90 + 60 + 20 = lessons * 124 + 170
  //
  //   ⚠️ Eğer measured unitY varsa onu kullan (daha doğru), yoksa formül.
  const getItemLayout = useCallback(
    (data: ArrayLike<Unit> | null | undefined, index: number) => {
      const units = data ? Array.from(data) : [];
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const unit = units[i];
        // Measured varsa kullan
        const measured = unit ? unitYMap.current[unit.id] : null;
        if (measured != null && i === 0) {
          offset = 0; // İlk unit hep 0'dan başlar (ListHeader sonrası)
        }
        offset += (unit?.lessons?.length ?? 0) * 124 + 170;
      }
      const length = (units[index]?.lessons?.length ?? 0) * 124 + 170;
      return { length, offset, index };
    },
    [],
  );

  // 📐 V9: Lesson center Y'sini GERÇEK ölçümlerden hesapla (3-katmanlı compose)
  //
  //   absoluteCenter = unitY + pathY + lessonLayout.y + lessonLayout.height/2
  //                    └─ FlatList içinde unit start
  //                          └─ unit içinde pathContainer start (header'ın altı)
  //                                └─ pathContainer içinde lesson nodeWrap top
  //                                                          └─ nodeWrap merkezi
  //
  //   Hiçbiri ölçülmediyse null döner → pending focus mekanizması devreye girer.
  const computeLessonCenterY = useCallback((lessonId: string): number | null => {
    // Hangi unit?
    let unitId: string | null = null;
    for (const u of course.units) {
      if (u.lessons.some((l) => l.id === lessonId)) {
        unitId = u.id;
        break;
      }
    }
    if (!unitId) return null;

    const unitY = unitYMap.current[unitId];
    const pathY = pathYMap.current[unitId];
    const lessonLayout = lessonLayoutsMap.current[lessonId];

    if (unitY == null || pathY == null || !lessonLayout) {
      return null;
    }

    return unitY + pathY + lessonLayout.y + lessonLayout.height / 2;
  }, [course.units]);

  // 📐 V10: Usable area sabitleri (header + bottom tab dışı)
  const TOP_RESERVED = 80;     // Header area (Welcome, level chip)
  const BOTTOM_RESERVED = 110; // Bottom tab + safe area

  // 📐 V10: Hedef scroll Y (sticky button için tahmin)
  const targetScrollY = useMemo(() => {
    if (!currentLessonId) return 0;
    const lessonCenterY = computeLessonCenterY(currentLessonId);
    const vh = viewportHeightRef.current || 800;
    if (lessonCenterY == null) return 0;
    // V17: Sabit anchor — focusActiveLesson ile birebir aynı formül
    const TARGET_ANCHOR_RATIO = 0.52;
    const anchorY = vh * TARGET_ANCHOR_RATIO;
    return Math.max(0, lessonCenterY - anchorY);
  }, [currentLessonId, computeLessonCenterY]);

  // 📐 V12: KISS — sadece scrollToIndex + viewOffset, complex measurement YOK
  //
  //   FlatList'in scrollToIndex'i internal getItemLayout'tan unit'i bulur.
  //   viewOffset = usableCenter - lessonOffsetInUnit → lesson tam center'a oturur.
  //
  //   lessonOffsetInUnit = 76 (MapPath header area) + 40 (FIRST_NODE_OFFSET) + idx * 124 (NODE_SPACING)
  //   usableCenter = (80 + vh - 110) / 2
  //
  //   FlatList getItemLayout'taki 32px hata önemli DEĞIL çünkü unit içinde
  //   lesson pozisyonu sabit (MapPath layout deterministic).
  const focusActiveLesson = useCallback((
    lessonId: string,
    reason: string,
    opts?: { animated?: boolean; force?: boolean },
  ): boolean => {
    const animated = opts?.animated ?? true;
    const force = opts?.force ?? false;

    console.warn('[MAP_FOCUS_REQUEST]', { reason, lessonId, force });

    // Target validation — completed lesson'a focus yapma
    let actualLessonId = lessonId;
    if (completedLessons.has(lessonId)) {
      console.warn('[MAP_TARGET_BUG_COMPLETED_LESSON]', {
        focusLessonId: lessonId,
        nextPlayableLessonId,
      });
      if (nextPlayableLessonId && !completedLessons.has(nextPlayableLessonId)) {
        actualLessonId = nextPlayableLessonId;
      }
    }

    // Hangi unit + unit içinde hangi index?
    const unitIdx = course.units.findIndex((u) =>
      u.lessons.some((l) => l.id === actualLessonId),
    );
    if (unitIdx < 0) {
      console.warn('[MAP_SCROLL_FAIL]', { reason, lessonId: actualLessonId, why: 'unit-not-found' });
      return false;
    }
    const unit = course.units[unitIdx];
    const lessonIdx = unit.lessons.findIndex((l) => l.id === actualLessonId);

    const vh = viewportHeightRef.current || 800;

    // 🎯 V19: CAMERA LOCK — CENTER_RATIO 0.50 (true viewport center, user spec exact)
    //   Current lesson her zaman ekran ortasında. Harita altından akar.
    const CENTER_RATIO = 0.50;
    const anchorY = vh * CENTER_RATIO;

    console.warn('[CAMERA_LOCK_TARGET]', {
      reason,
      nextPlayableLessonId,
      focusTargetLessonId: actualLessonId,
    });

    // 🎯 V19: STRATEGY 1 — Precise scroll with measured Y (drift-free)
    const measuredUnitY = unitYMap.current[unit.id];
    const measuredPathY = pathYMap.current[unit.id];
    const measuredLessonLayout = lessonLayoutsMap.current[actualLessonId];

    if (measuredUnitY != null && measuredPathY != null && measuredLessonLayout) {
      const lessonY = measuredUnitY + measuredPathY + measuredLessonLayout.y;
      const lessonHeight = measuredLessonLayout.height;
      const lessonCenterY = lessonY + lessonHeight / 2;
      const ch = contentHeightRef.current;
      const maxY = ch > 0 ? Math.max(0, ch - vh) : Infinity;
      const targetScrollY = Math.max(0, Math.min(lessonCenterY - anchorY, maxY));

      console.warn('[CAMERA_LOCK_MEASURE]', {
        lessonY: Math.round(lessonY),
        lessonHeight: Math.round(lessonHeight),
        lessonCenterY: Math.round(lessonCenterY),
        viewportHeight: vh,
        anchorY: Math.round(anchorY),
        contentHeight: ch,
        targetScrollY: Math.round(targetScrollY),
      });

      console.warn('[CAMERA_LOCK_SCROLL]', {
        targetScrollY: Math.round(targetScrollY),
        animated: true,
        reason,
      });

      // Clear pending — we're scrolling now
      pendingFocusRef.current = null;

      isProgrammaticScrollRef.current = true;
      try {
        listRef.current?.scrollToOffset({ offset: targetScrollY, animated: true });
      } catch (e) {
        console.warn('[MAP_SCROLL_FAIL]', { error: String(e) });
      }
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 800);
      return true;
    }

    // 📌 V20: STRATEGY 2 — Estimated scrollToOffset (NO scrollToIndex, NO refinement)
    //   User spec ("vagon"): Sadece scrollToOffset, tek smooth animation.
    //   Measurements yoksa getItemLayout formülü ile estimate hesaplanır.
    //   Pending'e ekle ki onLayout fire edince precise refinement yapılsın.
    pendingFocusRef.current = { lessonId: actualLessonId, reason, force: true, animated: true };

    // Estimated lessonCenterY using getItemLayout formula (lessons * 124 + 170 per unit)
    let estimatedCenterY = listHeaderHeight.current;
    for (let i = 0; i < unitIdx; i++) {
      estimatedCenterY += (course.units[i]?.lessons?.length ?? 0) * 124 + 170;
    }
    // Within unit: header(76) + first_offset(40) + idx*124 = lesson center
    estimatedCenterY += 76 + 40 + lessonIdx * 124;

    const ch2 = contentHeightRef.current;
    const maxY2 = ch2 > 0 ? Math.max(0, ch2 - vh) : Infinity;
    const targetScrollY2 = Math.max(0, Math.min(estimatedCenterY - anchorY, maxY2));

    console.warn('[CAMERA_LOCK_PENDING]', {
      nextPlayableLessonId: actualLessonId,
      unitIdx,
      lessonIdx,
      estimatedCenterY: Math.round(estimatedCenterY),
      viewportHeight: vh,
      anchorY: Math.round(anchorY),
      targetScrollY: Math.round(targetScrollY2),
      reason,
    });

    isProgrammaticScrollRef.current = true;
    try {
      listRef.current?.scrollToOffset({ offset: targetScrollY2, animated: true });
    } catch (e) {
      console.warn('[MAP_SCROLL_FAIL]', { error: String(e) });
    }
    setTimeout(() => { isProgrammaticScrollRef.current = false; }, 800);
    return true;
  }, [completedLessons, nextPlayableLessonId, course.units]);

  // 📌 V9: tryPendingFocus — layout/viewport hazır olduğunda pending'i fire et
  const tryPendingFocus = useCallback(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;

    const lessonCenterY = computeLessonCenterY(pending.lessonId);
    const vh = viewportHeightRef.current;
    const ch = contentHeightRef.current;
    if (lessonCenterY == null || vh <= 0 || ch <= 0) return;

    pendingFocusRef.current = null;
    console.warn('[MAP_PENDING_FIRE]', {
      lessonId: pending.lessonId,
      reason: pending.reason,
    });

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        focusActiveLesson(pending.lessonId, pending.reason, {
          animated: pending.animated,
          force: pending.force,
        });
      }, 100);
    });
  }, [computeLessonCenterY, focusActiveLesson]);

  // ❌ V21: AUTO-SCROLL TAMAMEN KALDIRILDI (user explicit request)
  //   USER: "haritanın en üstüne çekiyor yine şunu tamamen iptal et"
  //
  //   Auto-scroll logic problem: Estimate/measurement bazen yanlış değer dönüyor →
  //   targetScrollY clamp(0) ile y=0'a atıyor → harita üstüne snap.
  //
  //   Çözüm: useFocusEffect'i bypass et. Auto-scroll YOK.
  //   Kullanıcı manuel scroll yapacak. Sticky button (yeşil ok) ile current'a gidebilir.
  //
  //   V13 progress sync gate KALIYOR (login sırasında spinner).
  //   focusActiveLesson FONKSIYONU duruyor ama useFocusEffect'ten ÇAĞRILMIYOR.
  //   Sadece handleScrollToCurrent (kullanıcı butona basınca) çağırır.
  // 📍 V26: HER FOCUS'TA TRACKING + LESSON_EXIT PRESERVE
  //   - Initial mount → scrollToIndex current lesson area'ya
  //   - Lesson complete → scrollToIndex new current'a
  //   - Tab focus → scrollToIndex current'a
  //   - LESSON EXIT (mapNavState.fromLesson) → SCROLL YOK, çıkılan ders pozisyonunda kal
  useFocusEffect(
    useCallback(() => {
      if (!hasHydrated || !nextPlayableLessonId) {
        console.warn('[MAP_FOCUS_V26_EARLY_RETURN]', { hasHydrated, nextPlayableLessonId });
        return;
      }

      // 🔒 V28: Lesson exit'inden geliyorsak SAVED SCROLL'U RESTORE et (multiple attempts)
      //   FlatList lesson sırasında scroll position'ını kaybedebilir (y=0'a düşer).
      //   IMMEDIATE + MULTIPLE RETRIES — "tepeye zıplama" engellenir.
      if (mapNavState.fromLesson) {
        mapNavState.fromLesson = false; // Flag consume
        previousLessonIdRef.current = nextPlayableLessonId; // Ref güncelle
        const savedY = savedScrollYBeforeLessonRef.current;
        console.warn('[MAP_FOCUS_LESSON_EXIT_RESTORE_V28]', {
          lessonId: nextPlayableLessonId,
          savedScrollY: savedY != null ? Math.round(savedY) : null,
          currentScrollY: Math.round(currentScrollY.current),
        });

        if (savedY != null && savedY > 0) {
          const doRestore = (attempt: number) => {
            try {
              listRef.current?.scrollToOffset({ offset: savedY, animated: false });
              console.warn('[MAP_SCROLL_RESTORED_V28]', {
                offset: Math.round(savedY),
                attempt,
                currentScrollY: Math.round(currentScrollY.current),
              });
            } catch (e) {
              console.warn('[MAP_SCROLL_RESTORE_FAIL]', { attempt, error: String(e) });
            }
          };

          // IMMEDIATE (synchronous - FlatList ready ise hemen)
          doRestore(0);
          // requestAnimationFrame — next paint frame
          requestAnimationFrame(() => doRestore(1));
          // Multiple retries — race condition'a karşı
          setTimeout(() => doRestore(2), 50);
          setTimeout(() => doRestore(3), 150);
          setTimeout(() => doRestore(4), 300);
        }
        return;
      }

      const oldLessonId = previousLessonIdRef.current;
      const isInitialMount = oldLessonId === null;
      const isLessonChange = oldLessonId !== null && oldLessonId !== nextPlayableLessonId;
      previousLessonIdRef.current = nextPlayableLessonId;

      // Find unit and lesson within
      const unitIdx = course.units.findIndex((u) =>
        u.lessons.some((l) => l.id === nextPlayableLessonId),
      );
      if (unitIdx < 0) return;
      const unit = course.units[unitIdx];
      const lessonIdx = unit.lessons.findIndex((l) => l.id === nextPlayableLessonId);

      // ScrollToIndex with viewOffset (V14 method — proven works)
      const vh = viewportHeightRef.current || 800;
      const anchorY = vh * 0.25; // Lesson upper area (BAŞLA bubble higher)
      const lessonOffsetInUnit = 76 + 40 + lessonIdx * 124;
      const viewOffset = anchorY - lessonOffsetInUnit;

      const reason = isInitialMount
        ? 'initial_mount'
        : isLessonChange
        ? 'lesson_complete'
        : 'tab_focus';

      console.warn('[MAP_FOCUS_SCROLL_V23]', {
        reason,
        nextPlayableLessonId,
        unitIdx,
        lessonIdx,
        viewOffset: Math.round(viewOffset),
        anchorY: Math.round(anchorY),
      });

      const handle = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          isProgrammaticScrollRef.current = true;
          try {
            listRef.current?.scrollToIndex({
              index: unitIdx,
              animated: true,
              viewPosition: 0,
              viewOffset,
            });
          } catch (e) {
            console.warn('[MAP_SCROLL_FAIL_V23]', { error: String(e) });
          }
          setTimeout(() => { isProgrammaticScrollRef.current = false; }, 800);
        }, 500);
      });

      return () => {
        handle.cancel?.();
      };
    }, [hasHydrated, nextPlayableLessonId, course.units]),
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

      // 🛡 V7: User-scroll detection
      //   Programmatik scroll (auto-scroll) DEĞİLSE → kullanıcı manuel kaydırdı
      //   lastUserScrollTime'ı güncelle → focusActiveLesson 1.5sn boyunca skip eder
      if (!isProgrammaticScrollRef.current) {
        lastUserScrollTime.current = Date.now();
      }

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
    // V27: Lesson'a girmeden önce SCROLL POSITION'I SAKLA
    //   Map'e döndüğünde bu pozisyonu restore edeceğiz.
    savedScrollYBeforeLessonRef.current = currentScrollY.current;
    console.warn('[MAP_SAVE_SCROLL_BEFORE_LESSON]', {
      lessonId: lesson.id,
      savedScrollY: Math.round(currentScrollY.current),
    });
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
  // 📍 V9: 3-katmanlı onLayout — unit wrapper + pathContainer + her lesson nodeWrap
  //   unitYMap        ← bu View'ın onLayout (FlatList content içinde)
  //   pathYMap        ← MapPath içindeki pathContainer onLayout
  //   lessonLayoutsMap ← MapPath içindeki her lesson nodeWrap onLayout
  const onUnitLayout = useCallback((unitId: string, y: number) => {
    if (unitYMap.current[unitId] !== y) {
      unitYMap.current[unitId] = y;
      console.warn('[MAP_UNIT_Y]', { unitId, y: Math.round(y) });
      tryPendingFocus();
    }
  }, [tryPendingFocus]);

  const onPathLayout = useCallback((unitId: string, y: number) => {
    if (pathYMap.current[unitId] !== y) {
      pathYMap.current[unitId] = y;
      console.warn('[MAP_PATH_Y]', { unitId, y: Math.round(y) });
      tryPendingFocus();
    }
  }, [tryPendingFocus]);

  const onLessonNodeLayout = useCallback((lessonId: string, y: number, height: number) => {
    const prev = lessonLayoutsMap.current[lessonId];
    if (!prev || prev.y !== y || prev.height !== height) {
      lessonLayoutsMap.current[lessonId] = { y, height };
      console.warn('[MAP_LESSON_LAYOUT]', { lessonId, y: Math.round(y), height: Math.round(height) });
      tryPendingFocus();
    }
  }, [tryPendingFocus]);

  const renderUnit = useCallback(
    ({ item }: { item: Unit }) => (
      <View onLayout={(e) => onUnitLayout(item.id, e.nativeEvent.layout.y)}>
        <MapPath
          unit={item}
          unitOrder={item.order}
          getLessonInfo={getLessonInfo}
          onLessonPress={handleLessonPress}
          onPathLayout={onPathLayout}
          onLessonNodeLayout={onLessonNodeLayout}
        />
      </View>
    ),
    [getLessonInfo, handleLessonPress, onUnitLayout, onPathLayout, onLessonNodeLayout],
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
          // ❌ V14: initialScrollIndex KALDIRILDI
          //   FlatList mount'ta initialScrollIndex'e scroll yapıyordu → race condition.
          //   focusActiveLesson zaten useFocusEffect'te çalışıp doğru yere scroll yapacak.
          //   initialScrollIndex={Math.max(0, currentUnitIndex)}
          onScrollToIndexFailed={onScrollToIndexFailed}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== viewportHeightRef.current) {
              viewportHeightRef.current = h;
              console.warn('[MAP_VIEWPORT_LAYOUT]', { viewportHeight: h });
              tryPendingFocus();
            }
          }}
          onContentSizeChange={(_w, h) => {
            if (h > 0 && h !== contentHeightRef.current) {
              contentHeightRef.current = h;
              console.warn('[MAP_CONTENT_SIZE]', { contentHeight: h });
              tryPendingFocus();
            }
          }}
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
    // V22: Normal padding (V14 baseline)
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
