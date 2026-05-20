import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../../store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ════════════════════════════════════════════════════════════════
// GRAMMAR TIP CARD — Ders öncesi gramer ipucu intro card
// Lesson.grammarNote varsa lesson screen başlangıcında gösterilir
// "Anladım" butonuyla geçilir
// ════════════════════════════════════════════════════════════════

interface Props {
  grammarNote: { tr: string; en: string };
  onContinue: () => void;
}

export function GrammarTipCard({ grammarNote, onContinue }: Props) {
  const c = useThemeColors();
  const t = useT();
  const lang = useUserStore((s) => s.language);

  const text = lang === 'en' ? grammarNote.en : grammarNote.tr;
  const styles = makeStyles(c);

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
      <Animated.View
        entering={FadeInDown.springify().damping(15).stiffness(200)}
        style={styles.card}
      >
        <View style={styles.topHighlight} pointerEvents="none" />

        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="bulb" size={22} color={c.gold} />
          </View>
          <Text style={styles.title}>{t('grammarTip.title')}</Text>
        </View>

        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.bodyText}>{text}</Text>
        </ScrollView>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{t('grammarTip.gotIt')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      zIndex: 100,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.gold,
      padding: spacing.lg,
      gap: spacing.md,
      overflow: 'hidden',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 12,
      maxHeight: '80%',
    },
    topHighlight: {
      position: 'absolute', top: 0,
      left: spacing.md, right: spacing.md,
      height: 1, backgroundColor: c.glassHighlight,
    },
    headerRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: spacing.md,
    },
    iconCircle: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.goldBg,
      borderWidth: 1.5, borderColor: c.gold,
      alignItems: 'center', justifyContent: 'center',
    },
    title: {
      ...textStyles.heading,
      color: c.gold,
      fontSize: 20,
      flex: 1,
    },
    bodyScroll: { maxHeight: 280 },
    bodyContent: { paddingVertical: spacing.xs },
    bodyText: {
      ...textStyles.body,
      color: c.textHigh,
      fontSize: 15,
      lineHeight: 22,
    },
    button: {
      minHeight: 52, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.neon,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
      marginTop: spacing.xs,
    },
    buttonPressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
    buttonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 16 },
  });
}
