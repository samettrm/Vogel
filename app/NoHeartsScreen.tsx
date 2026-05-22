import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../src/store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';

export default function NoHeartsScreen() {
  const c = useThemeColors();
  const t = useT();
  const nextHeartRefillAt = useUserStore((s) => s.nextHeartRefillAt);
  const refillHearts = useUserStore((s) => s.refillHearts);
  const xp = useUserStore((s) => s.xp);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!nextHeartRefillAt) { setCountdown('00:00'); return; }
    const updateTimer = () => {
      const now = Date.now();
      const diff = nextHeartRefillAt - now;
      if (diff <= 0) { setCountdown('00:00'); return; }
      const totalSeconds = Math.ceil(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      if (h > 0) {
        setCountdown(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        setCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextHeartRefillAt]);

  const handleHeartRefillPress = () => {
    if (xp < 450) {
      Alert.alert(
        t('shop.full'),
        t('shop.mockNote'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('noHearts.goShop'), onPress: () => router.replace('/(tabs)/shop') },
        ],
      );
    } else {
      refillHearts();
      router.replace('/(tabs)');
    }
  };

  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.bgGlow} pointerEvents="none" />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-dislike" size={64} color={c.red} />
          </View>

          <Text style={styles.title}>{t('noHearts.title')}</Text>
          <Text style={styles.subtitle}>{t('noHearts.subtitle')}</Text>

          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={18} color={c.textLow} />
            <Text style={styles.timerText}>
              {t('noHearts.waitText', { time: countdown })}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {/* 💎 PREMIUM CTA — en büyük monetizasyon noktası */}
          <Pressable
            onPress={() => router.replace('/(tabs)/shop')}
            style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}
          >
            <Text style={styles.premiumButtonText}>{t('noHearts.getPlus')}</Text>
            <Text style={styles.premiumBenefit}>{t('noHearts.plusBenefit')}</Text>
          </Pressable>

          <Pressable
            onPress={handleHeartRefillPress}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="flash" size={18} color={c.textOnNeon} />
            <Text style={styles.primaryButtonText}>{t('noHearts.refillNow')}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>{t('noHearts.backHome')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    bgGlow: {
      position: 'absolute', top: -80, alignSelf: 'center',
      width: 320, height: 320, borderRadius: 160,
      backgroundColor: c.red, opacity: 0.08,
    },
    container: {
      flex: 1, justifyContent: 'space-between',
      paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    },
    content: {
      flex: 1, justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: spacing.base,
    },
    iconCircle: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: c.redBg,
      borderWidth: 2, borderColor: c.red,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.red, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
    },
    title: {
      ...textStyles.heading, fontSize: 28,
      color: c.red, textAlign: 'center',
    },
    subtitle: {
      ...textStyles.body, color: c.textMed,
      textAlign: 'center',
      paddingHorizontal: spacing.base,
      lineHeight: 22,
    },
    timerContainer: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.glassBg,
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1, borderColor: c.glassBorderStrong,
      marginTop: spacing.base,
    },
    timerText: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 14 },
    buttonContainer: { width: '100%', gap: spacing.sm, marginBottom: spacing.md },
    premiumButton: {
      backgroundColor: c.purpleBg,
      borderWidth: 1.5, borderColor: c.purple,
      paddingVertical: spacing.md + 2, paddingHorizontal: spacing.base,
      borderRadius: radius.md,
      alignItems: 'center', gap: 4,
      shadowColor: c.purple, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    },
    premiumButtonText: { ...textStyles.button, color: c.purpleLight, fontSize: 15 },
    premiumBenefit: { ...textStyles.body, color: c.textLow, fontSize: 11 },
    primaryButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      backgroundColor: c.neon,
      paddingVertical: spacing.md, borderRadius: radius.md,
      shadowColor: c.neon, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 12, elevation: 6,
    },
    primaryButtonText: { ...textStyles.button, color: c.textOnNeon, fontSize: 15 },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.md, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: c.glassBorderStrong,
    },
    secondaryButtonText: { ...textStyles.button, color: c.textMed, fontSize: 14 },
    pressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  });
}
