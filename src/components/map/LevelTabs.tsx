import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { CEFRLevel } from '../../types';
import { getLevelColor, radius, spacing, textStyles, useThemeColors } from '../../theme';

interface LevelTabsProps {
  levels: CEFRLevel[];
  selectedLevel: CEFRLevel;
  onSelect: (level: CEFRLevel) => void;
}

export function LevelTabs({ levels, selectedLevel, onSelect }: LevelTabsProps) {
  const c = useThemeColors();
  const handleSelect = (level: CEFRLevel) => {
    if (level === selectedLevel) return;
    Haptics.selectionAsync().catch(() => {});
    onSelect(level);
  };
  // 🚀 PERF: useMemo — makeStyles/StyleSheet.create sadece tema değiştiğinde yeniden çalışır
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {levels.map((level) => {
          const isActive = level === selectedLevel;
          const lc = getLevelColor(level, c);

          // Aktifken: dolu renk (background = lc.bg, border = lc.main, glow var)
          // Inaktifken: hafif renk (border = lc.main %50 opaklık olarak gözükür, text rengi soluk)
          return (
            <Pressable
              key={level}
              onPress={() => handleSelect(level)}
              style={({ pressed }) => [
                styles.tab,
                {
                  // Inaktif: border seviye rengiyle, ama bg glass
                  borderColor: isActive ? lc.main : lc.main,
                  backgroundColor: isActive ? lc.bg : c.glassBg,
                },
                isActive && {
                  shadowColor: lc.main,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 4,
                },
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? lc.light : lc.main },
                  // Inaktif text biraz soluk olsun ama yine de renkli
                  !isActive && { opacity: 0.7 },
                ]}
              >
                {level}
              </Text>
              {isActive ? (
                <View
                  style={[
                    styles.activeDot,
                    {
                      backgroundColor: lc.main,
                      shadowColor: lc.main,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(_c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { paddingVertical: spacing.xs },
    scroll: { paddingHorizontal: spacing.base, gap: spacing.sm, alignItems: 'center' },
    tab: {
      paddingHorizontal: spacing.base, paddingVertical: spacing.xs,
      borderRadius: radius.pill, borderWidth: 1.5,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      minWidth: 56, justifyContent: 'center',
    },
    tabPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
    tabText: { ...textStyles.bodyBold, fontSize: 14, letterSpacing: 1 },
    activeDot: {
      width: 6, height: 6, borderRadius: 3,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8, shadowRadius: 4,
    },
  });
}
