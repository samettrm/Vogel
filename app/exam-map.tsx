import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLevelColor, radius, shadows, spacing, textStyles, useThemeColors } from '../src/theme';
import { ALL_COURSES } from '../src/data/courses';
import { useUserStore } from '../src/store/useUserStore';
import type { CEFRLevel, Lesson } from '../src/types';

// ════════════════════════════════════════════════════════════════
// SINAV HARİTASI — Goethe · TELC hazırlık ekranı
//
// Her seviye (A1-C1) için exam unit'i gösterir.
// Seviye kartına dokun → o seviyenin kaldığı yerden devam et.
// ════════════════════════════════════════════════════════════════

type ExamLevel = {
  level: CEFRLevel;
  courseTitle: string;
  unitTitle: string;
  lessons: Lesson[];
  completedCount: number;
  nextLesson: Lesson;
};

export default function ExamMapScreen() {
  const c = useThemeColors();
  const completedLessons = useUserStore((s) => s.completedLessons);
  const isPremium = useUserStore((s) => s.isPremium);
  const styles = useMemo(() => makeStyles(c), [c]);

  const examLevels = useMemo<ExamLevel[]>(() => {
    const result: ExamLevel[] = [];
    for (const course of ALL_COURSES) {
      const examUnit = course.units.find((u) => u.tags?.includes('exam'));
      if (!examUnit) continue;
      const completedCount = examUnit.lessons.filter((l) => completedLessons.has(l.id)).length;
      const nextLesson =
        examUnit.lessons.find((l) => !completedLessons.has(l.id)) ?? examUnit.lessons[0];
      result.push({
        level: course.level,
        courseTitle: course.title,
        unitTitle: examUnit.title,
        lessons: examUnit.lessons,
        completedCount,
        nextLesson,
      });
    }
    return result;
  }, [completedLessons]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── PREMİUM GATE — premium değilse içeriği karart + kilit göster ── */}
      {!isPremium && (
        <View style={styles.premiumGate} pointerEvents="box-none">
          {/* Koyu blur perdesi */}
          <View style={styles.premiumGateBg} pointerEvents="none" />
          {/* Kilit kartı */}
          <View style={styles.premiumGateCard}>
            <View style={styles.premiumGateLockRing}>
              <Ionicons name="lock-closed" size={32} color="#a855f7" />
            </View>
            <Text style={styles.premiumGateTitle}>Premium İçerik</Text>
            <Text style={styles.premiumGateSub}>
              Goethe · TELC sınav hazırlık derslerine{'\n'}erişmek için Vogel Plus gerekiyor.
            </Text>
            <Pressable
              onPress={() => router.replace('/(tabs)/shop')}
              style={({ pressed }) => [
                styles.premiumGateBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.premiumGateBtnText}>Vogel Plus'a Geç</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.premiumGateBack, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.premiumGateBackText}>Geri Dön</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Üst bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={c.textHigh} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Sınav Haritası</Text>
          <Text style={styles.topBarSub}>Goethe · TELC</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Açıklama kartı */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHighlight} pointerEvents="none" />
          <Text style={styles.infoEmoji}>🎓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Sınava hazır mısın?</Text>
            <Text style={styles.infoSub}>
              Her seviye için özel hazırlık dersleri. Seviyeni seç, kaldığın yerden devam et.
            </Text>
          </View>
        </View>

        {/* Seviye kartları */}
        {examLevels.map((item) => (
          <LevelCard
            key={item.level}
            item={item}
            completedLessons={completedLessons}
          />
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Seviye Kartı ─────────────────────────────────────────────────────────────
function LevelCard({
  item,
  completedLessons,
}: {
  item: ExamLevel;
  completedLessons: Set<string>;
}) {
  const c = useThemeColors();
  const lc = getLevelColor(item.level, c);
  const styles = useMemo(() => makeStyles(c), [c]);

  const allDone = item.completedCount === item.lessons.length;
  const progress = item.lessons.length > 0 ? item.completedCount / item.lessons.length : 0;

  const handleContinue = () => {
    router.push({ pathname: `/lesson/${item.nextLesson.id}`, params: { returnTo: '/exam-map' } });
  };

  return (
    <View style={[styles.levelCard, { borderColor: lc.main }]}>
      <View style={[styles.levelCardHighlight, { backgroundColor: lc.bg }]} pointerEvents="none" />

      {/* Seviye başlığı */}
      <View style={styles.levelHeader}>
        <View style={[styles.levelBadge, { backgroundColor: lc.bg, borderColor: lc.main }]}>
          <Text style={[styles.levelBadgeText, { color: lc.light }]}>{item.level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.levelTitle}>{item.courseTitle}</Text>
          <Text style={styles.levelUnitTitle}>{item.unitTitle}</Text>
        </View>
        {allDone ? (
          <View style={[styles.doneBadge, { backgroundColor: c.neonBg, borderColor: c.neon }]}>
            <Ionicons name="checkmark-circle" size={14} color={c.neon} />
            <Text style={[styles.doneBadgeText, { color: c.neon }]}>Tamam</Text>
          </View>
        ) : (
          <Text style={[styles.progressLabel, { color: lc.light }]}>
            {item.completedCount}/{item.lessons.length}
          </Text>
        )}
      </View>

      {/* İlerleme çubuğu */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: lc.main },
          ]}
        />
      </View>

      {/* Ders düğümleri */}
      <View style={styles.lessonsRow}>
        {item.lessons.map((lesson, idx) => {
          const isDone = completedLessons.has(lesson.id);
          const isCurrent =
            !isDone &&
            item.lessons
              .slice(0, idx)
              .every((l) => completedLessons.has(l.id));

          return (
            <Pressable
              key={lesson.id}
              onPress={() => router.push({ pathname: `/lesson/${lesson.id}`, params: { returnTo: '/exam-map' } })}
              style={({ pressed }) => [
                styles.lessonNode,
                isDone && { backgroundColor: c.neon, borderColor: c.neon },
                isCurrent && { backgroundColor: lc.bg, borderColor: lc.main, ...shadows.glowPrimarySoft },
                !isDone && !isCurrent && { backgroundColor: c.glassBg, borderColor: c.glassBorderStrong },
                pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={16} color={c.textOnNeon} />
              ) : isCurrent ? (
                <Ionicons name="school" size={16} color={lc.main} />
              ) : (
                <Text style={styles.lessonNodeNum}>{idx + 1}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Ders isimleri */}
      <View style={styles.lessonLabels}>
        {item.lessons.map((lesson) => (
          <Text key={lesson.id} style={styles.lessonLabel} numberOfLines={2}>
            {lesson.title}
          </Text>
        ))}
      </View>

      {/* Devam et butonu */}
      <Pressable
        onPress={handleContinue}
        style={({ pressed }) => [
          styles.continueBtn,
          { backgroundColor: allDone ? c.neon : lc.main },
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={[styles.continueBtnText, { color: allDone ? c.textOnNeon : c.bg }]}>
          {allDone ? '✓ Tekrar Et' : item.completedCount === 0 ? 'Başla' : 'Devam Et'}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={allDone ? c.textOnNeon : c.bg}
        />
      </Pressable>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },

    // ── Premium gate overlay ──────────────────────────────────────
    premiumGate: {
      position: 'absolute', inset: 0,
      zIndex: 99,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing.base,
    },
    premiumGateBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.82)',
    },
    premiumGateCard: {
      width: '100%',
      backgroundColor: '#0d0320',
      borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.35)',
      borderRadius: 24,
      padding: spacing.xl ?? spacing.lg,
      alignItems: 'center', gap: 14,
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3, shadowRadius: 24,
      elevation: 10,
    },
    premiumGateLockRing: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'rgba(168,85,247,0.12)',
      borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.4)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    premiumGateTitle: {
      ...textStyles.subheading, color: '#fff', fontSize: 20, fontWeight: '800',
    },
    premiumGateSub: {
      ...textStyles.body, color: 'rgba(255,255,255,0.45)', fontSize: 14,
      textAlign: 'center', lineHeight: 21,
    },
    premiumGateBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#a855f7',
      borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
      marginTop: 4,
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45, shadowRadius: 12,
      elevation: 6,
    },
    premiumGateBtnText: {
      ...textStyles.button, color: '#fff', fontSize: 15, fontWeight: '800',
    },
    premiumGateBack: { paddingVertical: 8, paddingHorizontal: 16 },
    premiumGateBackText: {
      ...textStyles.body, color: 'rgba(255,255,255,0.3)', fontSize: 13,
    },

    // Üst bar
    topBar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.divider,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center',
    },
    topBarCenter: { flex: 1, alignItems: 'center', gap: 1 },
    topBarTitle: { ...textStyles.subheading, color: c.textHigh, fontSize: 17 },
    topBarSub: { ...textStyles.label, color: c.gold, fontSize: 11, letterSpacing: 0.5 },

    scroll: {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.md,
      gap: spacing.md,
    },

    // Açıklama kartı
    infoCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.goldBg,
      borderWidth: 1.5, borderColor: c.gold,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
      gap: spacing.md, overflow: 'hidden', marginBottom: spacing.xs,
    },
    infoCardHighlight: {
      position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg,
      height: 1, opacity: 0.4,
    },
    infoEmoji: { fontSize: 36 },
    infoTitle: { ...textStyles.subheading, color: c.gold, fontSize: 15 },
    infoSub: { ...textStyles.body, color: c.textMed, fontSize: 12, marginTop: 2, lineHeight: 17 },

    // Seviye kartı
    levelCard: {
      backgroundColor: c.glassBgStrong,
      borderWidth: 1.5,
      borderRadius: radius.xl ?? radius.lg,
      padding: spacing.base,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    levelCardHighlight: {
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 40, opacity: 0.06,
    },

    levelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    levelBadge: {
      paddingHorizontal: spacing.sm, paddingVertical: 4,
      borderRadius: radius.md, borderWidth: 1.5, minWidth: 40, alignItems: 'center',
    },
    levelBadgeText: { ...textStyles.bodyBold, fontSize: 13, letterSpacing: 0.5 },
    levelTitle: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    levelUnitTitle: { ...textStyles.body, color: c.textLow, fontSize: 11, marginTop: 1 },
    doneBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: radius.pill, borderWidth: 1,
    },
    doneBadgeText: { ...textStyles.label, fontSize: 10 },
    progressLabel: { ...textStyles.bodyBold, fontSize: 13 },

    // İlerleme çubuğu
    progressTrack: {
      height: 4, backgroundColor: c.glassBorder,
      borderRadius: 2, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },

    // Ders düğümleri
    lessonsRow: {
      flexDirection: 'row', gap: spacing.sm,
      justifyContent: 'space-around',
      paddingHorizontal: spacing.xs,
    },
    lessonNode: {
      width: 48, height: 48, borderRadius: 24,
      borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    lessonNodeNum: { ...textStyles.bodyBold, color: c.textLow, fontSize: 15 },

    // Ders etiketleri
    lessonLabels: {
      flexDirection: 'row', gap: spacing.sm,
      justifyContent: 'space-around',
      paddingHorizontal: spacing.xs,
    },
    lessonLabel: {
      flex: 1, ...textStyles.body, color: c.textLow,
      fontSize: 9, textAlign: 'center', lineHeight: 12,
    },

    // Devam et butonu
    continueBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.md, paddingVertical: spacing.sm + 2,
      marginTop: spacing.xs,
    },
    continueBtnText: { ...textStyles.button, fontSize: 14 },
  });
}
