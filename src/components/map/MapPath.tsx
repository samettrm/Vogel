import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import type { Lesson, Unit } from '../../types';
import { LessonNode, type LessonNodeState } from './LessonNode';

interface MapPathProps {
  unit: Unit;
  unitOrder: number;
  getLessonInfo: (lesson: Lesson) => {
    state: LessonNodeState;
    total: number;
    correct: number;
    wrong: number;
  };
  onLessonPress: (lesson: Lesson) => void;
  // 📍 V9: Layout reporting for precise lesson focus
  //   onPathLayout fires when pathContainer mounts → Y within unit container
  //   onLessonNodeLayout fires when each lesson nodeWrap mounts → Y/height within pathContainer
  onPathLayout?: (unitId: string, yInUnit: number) => void;
  onLessonNodeLayout?: (lessonId: string, yInPath: number, height: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const NODE_SPACING_Y = 124;
const NODE_AREA = 110;
const FIRST_NODE_OFFSET_Y = 40;
const ZIG_PATTERN = [0, 56, 80, 56, 0, -56, -80, -56];

export function MapPath({ unit, unitOrder, getLessonInfo, onLessonPress, onPathLayout, onLessonNodeLayout }: MapPathProps) {
  return (
    <MapPathImpl
      unit={unit}
      unitOrder={unitOrder}
      getLessonInfo={getLessonInfo}
      onLessonPress={onLessonPress}
      onPathLayout={onPathLayout}
      onLessonNodeLayout={onLessonNodeLayout}
    />
  );
}

function MapPathInner({ unit, unitOrder, getLessonInfo, onLessonPress, onPathLayout, onLessonNodeLayout }: MapPathProps) {
  const c = useThemeColors();
  const t = useT();
  const lessons = unit.lessons;
  const isExamUnit = unit.tags?.includes('exam') ?? false;
  const totalHeight = lessons.length * NODE_SPACING_Y + FIRST_NODE_OFFSET_Y;

  const getXOffset = (i: number) => ZIG_PATTERN[i % ZIG_PATTERN.length];
  const centerX = SCREEN_WIDTH / 2;

  const pathD = useMemo(() => {
    if (lessons.length < 2) return '';
    let d = '';
    lessons.forEach((_, i) => {
      const x = centerX + getXOffset(i);
      const y = i * NODE_SPACING_Y + FIRST_NODE_OFFSET_Y;
      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        const prevX = centerX + getXOffset(i - 1);
        const prevY = (i - 1) * NODE_SPACING_Y + FIRST_NODE_OFFSET_Y;
        const cy1 = prevY + NODE_SPACING_Y * 0.5;
        const cy2 = y - NODE_SPACING_Y * 0.5;
        d += ` C ${prevX} ${cy1}, ${x} ${cy2}, ${x} ${y}`;
      }
    });
    return d;
  }, [lessons, centerX]);

  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrap, isExamUnit && styles.headerWrapExam]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerOrder, isExamUnit && styles.headerOrderExam]}>
              {isExamUnit ? '🎓 SINAV HAZIRLIĞI' : `${t('lessons.unit')} ${unitOrder}`}
            </Text>
            <Text style={[styles.headerTitle, isExamUnit && styles.headerTitleExam]}>{unit.title}</Text>
            {isExamUnit && (
              <Text style={styles.examSubtitle}>Yeterlilik Sınavı · Her seviyeden erişilebilir</Text>
            )}
          </View>
          <View style={[styles.headerBadge, isExamUnit && styles.headerBadgeExam]}>
            <Text style={[styles.headerBadgeText, isExamUnit && styles.headerBadgeTextExam]}>
              {isExamUnit ? '📝' : lessons.length}
            </Text>
          </View>
        </View>
        <View style={styles.headerHighlight} pointerEvents="none" />
      </View>

      <View
        style={[styles.pathContainer, { height: totalHeight + spacing.lg }]}
        onLayout={(e) => onPathLayout?.(unit.id, e.nativeEvent.layout.y)}
      >
        {pathD !== '' && (
          <Svg
            width={SCREEN_WIDTH}
            height={totalHeight + spacing.lg}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <SvgPath d={pathD} stroke={c.surface} strokeWidth={14} strokeLinecap="round" fill="none" />
            <SvgPath
              d={pathD}
              stroke={c.glassBorderStrong}
              strokeWidth={2}
              strokeDasharray="4 9"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        )}

        {lessons.map((lesson, i) => {
          const info = getLessonInfo(lesson);
          const x = centerX + getXOffset(i);
          const y = i * NODE_SPACING_Y + FIRST_NODE_OFFSET_Y;

          // 🚀 PERF: Per-node FadeInDown stagger animasyonu kaldırıldı —
          // 66 düğüm üzerinde paralel spring animasyonu mount'u kilitliyordu.
          // LessonNode kendi pulse animasyonunu zaten sadece 'current' state'inde
          // çalıştırıyor (en fazla 1 düğüm). Mount artık anında.
          return (
            <View
              key={lesson.id}
              style={[
                styles.nodeWrap,
                { top: y - NODE_AREA / 2, left: x - NODE_AREA / 2 },
              ]}
              onLayout={(e) =>
                onLessonNodeLayout?.(lesson.id, e.nativeEvent.layout.y, e.nativeEvent.layout.height)
              }
            >
              <LessonNode
                state={info.state}
                totalExercises={info.total}
                correctCount={info.correct}
                wrongCount={info.wrong}
                onPress={() => onLessonPress(lesson)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { marginBottom: spacing.lg },
    headerWrap: {
      marginHorizontal: spacing.base,
      marginBottom: spacing.base,
      borderRadius: radius.lg,
      backgroundColor: c.glassBgStrong,
      borderWidth: 1, borderColor: c.glassBorder,
      overflow: 'hidden',
    },
    headerWrapExam: {
      backgroundColor: c.goldBg,
      borderWidth: 2, borderColor: c.gold,
    },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    },
    headerLeft: { flex: 1 },
    headerOrder: { ...textStyles.label, color: c.neon, marginBottom: 2 },
    headerOrderExam: { color: c.gold },
    headerTitle: { ...textStyles.subheading, color: c.textHigh },
    headerTitleExam: { color: c.gold },
    examSubtitle: { ...textStyles.caption, color: c.textMed, marginTop: 2 },
    headerBadge: {
      minWidth: 36, height: 36, paddingHorizontal: spacing.sm, borderRadius: 18,
      backgroundColor: c.neonBg, borderWidth: 1, borderColor: c.neon,
      justifyContent: 'center', alignItems: 'center',
    },
    headerBadgeExam: {
      backgroundColor: c.goldBg,
      borderColor: c.gold,
      minWidth: 40, height: 40, borderRadius: 20,
    },
    headerBadgeText: { ...textStyles.bodyBold, color: c.neon },
    headerBadgeTextExam: { color: c.gold, fontSize: 20 },
    headerHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    pathContainer: { position: 'relative', width: '100%' },
    nodeWrap: {
      position: 'absolute', width: NODE_AREA, height: NODE_AREA,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}

// 🚀 PERF: MapPath React.memo — sadece unit veya getLessonInfo callback'i
// değiştiğinde re-render. 11 ünite var, her store update'inde 11 MapPath
// re-render etmek pahalıydı. getLessonInfo HomeScreen'de useCallback'le
// stabilize edildiğinden, sadece gerçek progress değiştiğinde tetiklenir.
const MapPathImpl = React.memo(MapPathInner);
