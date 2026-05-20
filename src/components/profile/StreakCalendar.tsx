import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// STREAK CALENDAR
// Son 7 günü gösterir. Tema-aware (dark/light) + i18n.
// ════════════════════════════════════════════════════════════════

interface StreakCalendarProps {
  streak: number;
  activeDays?: boolean[];
}

// JS getDay() değerlerinden hafta indeksine çevirme (Pazar=0 → Cmt=6)
const JS_TO_TR_INDEX = [6, 0, 1, 2, 3, 4, 5];

export function StreakCalendar({ streak, activeDays }: StreakCalendarProps) {
  const c = useThemeColors();
  const t = useT();

  const dayLabelKeys = useMemo(
    () => [
      'streakCalendar.dayMon',
      'streakCalendar.dayTue',
      'streakCalendar.dayWed',
      'streakCalendar.dayThu',
      'streakCalendar.dayFri',
      'streakCalendar.daySat',
      'streakCalendar.daySun',
    ] as const,
    [],
  );

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const offset = 6 - i;
      const d = new Date(today);
      d.setDate(today.getDate() - offset);

      const trIdx = JS_TO_TR_INDEX[d.getDay()];
      const isToday = offset === 0;

      let isActive: boolean;
      if (activeDays && activeDays.length >= 7) {
        isActive = activeDays[i] ?? false;
      } else {
        isActive = offset < streak;
      }

      return {
        labelKey: dayLabelKeys[trIdx],
        dayNumber: d.getDate(),
        isToday,
        isActive,
      };
    });
  }, [streak, activeDays, dayLabelKeys]);

  const styles = makeStyles(c);

  return (
    <View style={styles.card}>
      <View style={styles.topHighlight} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flame" size={18} color={c.gold} />
          <Text style={styles.title}>{t('streakCalendar.title')}</Text>
        </View>
        <Text style={styles.subtitle}>{t('streakCalendar.subtitle')}</Text>
      </View>

      <View style={styles.daysRow}>
        {days.map((day, idx) => (
          <Animated.View
            key={idx}
            entering={FadeInUp.delay(idx * 40).duration(280).springify().damping(14)}
            style={styles.dayCell}
          >
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {t(day.labelKey)}
            </Text>

            <View
              style={[
                styles.dayCircle,
                day.isActive && styles.dayCircleActive,
                day.isToday && !day.isActive && styles.dayCircleToday,
              ]}
            >
              {day.isActive ? (
                <Text style={styles.dayActiveEmoji}>🔥</Text>
              ) : (
                <Text
                  style={[
                    styles.dayNumber,
                    day.isToday && styles.dayNumberToday,
                  ]}
                >
                  {day.dayNumber}
                </Text>
              )}
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.streakSummary}>
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.streakUnit}>{t('streakCalendar.unit')}</Text>
        </View>
        <Text style={styles.encourage}>
          {streak > 0 ? t('streakCalendar.keepGoing') : t('streakCalendar.startToday')}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      padding: spacing.base,
      gap: spacing.base,
      overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: c.glassHighlight,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    subtitle: { ...textStyles.label, color: c.textLow },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCell: { alignItems: 'center', gap: 6, flex: 1 },
    dayLabel: { ...textStyles.label, color: c.textLow, fontSize: 10 },
    dayLabelToday: { color: c.neon },
    dayCircle: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    dayCircleActive: {
      backgroundColor: c.goldBg,
      borderColor: c.gold,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 6, elevation: 4,
    },
    dayCircleToday: { borderColor: c.neon, backgroundColor: c.neonBg },
    dayActiveEmoji: { fontSize: 16 },
    dayNumber: { ...textStyles.bodyBold, color: c.textMed, fontSize: 13 },
    dayNumberToday: { color: c.neon },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    streakSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    streakValue: { ...textStyles.subheading, color: c.gold, fontSize: 22 },
    streakUnit: { ...textStyles.body, color: c.textLow, fontSize: 13 },
    encourage: { ...textStyles.label, color: c.textMed },
  });
}
