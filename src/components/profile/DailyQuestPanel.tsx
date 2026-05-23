import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from '../../utils/haptics';

import { useUserStore, type DailyQuest } from '../../store/useUserStore';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';
import { playSound } from '../../utils/sounds';

// 🎯 Günlük Görev Paneli — Profil ekranında render edilir.
// Tema-aware (dark/light) + i18n.

export function DailyQuestPanel() {
  const c = useThemeColors();
  const t = useT();
  const quests = useUserStore((s) => s.dailyQuests);
  const refreshDailyQuestsIfNeeded = useUserStore(
    (s) => s.refreshDailyQuestsIfNeeded,
  );

  useEffect(() => {
    refreshDailyQuestsIfNeeded();
  }, [refreshDailyQuestsIfNeeded]);

  if (quests.length === 0) return null;

  const styles = makeStyles(c);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.titleEmoji}>🎯</Text>
        <Text style={styles.title}>{t('dailyQuestPanel.title')}</Text>
      </View>

      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </View>
  );
}

function QuestCard({ quest }: { quest: DailyQuest }) {
  const c = useThemeColors();
  const t = useT();
  const claimQuestReward = useUserStore((s) => s.claimQuestReward);

  const ratio = Math.min(1, quest.progress / quest.target);
  const isComplete = quest.progress >= quest.target;
  const isClaimable = isComplete && !quest.claimed;

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isClaimable) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 480 }),
          withTiming(1, { duration: 480 }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 160 });
    }
  }, [isClaimable, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleClaim = () => {
    if (!isClaimable) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound('correct').catch(() => {});
    claimQuestReward(quest.id);
  };

  const styles = makeStyles(c);

  return (
    <View
      style={[
        styles.card,
        quest.claimed ? styles.cardClaimed : null,
      ]}
    >
      <View style={styles.cardTopHighlight} pointerEvents="none" />
      <View style={styles.cardHeader}>
        <Text style={styles.questEmoji}>{quest.emoji}</Text>
        <View style={styles.cardTextCol}>
          <Text
            style={[
              styles.questLabel,
              quest.claimed ? styles.dimmedText : null,
            ]}
          >
            {quest.label}
          </Text>
          <Text style={styles.questReward}>
            {t('dailyQuestPanel.rewardXp', { n: quest.rewardXp })}
          </Text>
        </View>
      </View>

      <View style={styles.progressOuter}>
        <View style={[styles.progressInner, { width: `${ratio * 100}%` }]} />
        <Text style={styles.progressText}>
          {quest.progress}/{quest.target}
        </Text>
      </View>

      {quest.claimed ? (
        <View style={styles.claimedBadge}>
          <Text style={styles.claimedText}>{t('dailyQuestPanel.claimed')}</Text>
        </View>
      ) : isClaimable ? (
        <Animated.View style={pulseStyle}>
          <Pressable
            onPress={handleClaim}
            style={({ pressed }) => [
              styles.claimButton,
              pressed && styles.claimButtonPressed,
            ]}
          >
            <Text style={styles.claimButtonText}>{t('dailyQuestPanel.openChest')}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    titleEmoji: { fontSize: 22 },
    title: { ...textStyles.heading, color: c.textHigh, fontSize: 20 },
    card: {
      backgroundColor: c.glassBgStrong,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      padding: spacing.base,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    cardTopHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: c.glassHighlight,
    },
    cardClaimed: { opacity: 0.55 },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    questEmoji: { fontSize: 28 },
    cardTextCol: { flex: 1 },
    questLabel: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 15 },
    dimmedText: { color: c.textLow },
    questReward: { ...textStyles.caption, color: c.neonLight, fontSize: 12, marginTop: 2 },
    progressOuter: {
      height: 22,
      backgroundColor: c.surface,
      borderRadius: 11,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    progressInner: {
      position: 'absolute',
      left: 0, top: 0, bottom: 0,
      backgroundColor: c.neon,
      borderRadius: 11,
    },
    progressText: {
      ...textStyles.caption,
      color: c.textHigh,
      fontSize: 11,
      textAlign: 'center',
      zIndex: 1,
    },
    claimButton: {
      marginTop: spacing.sm,
      minHeight: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.gold,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
    },
    claimButtonPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
    claimButtonText: {
      ...textStyles.button,
      color: c.bg, // koyu zemine açık altın butonda kontrast
      fontSize: 14,
    },
    claimedBadge: {
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
      alignItems: 'center',
    },
    claimedText: {
      ...textStyles.bodyBold,
      color: c.neonLight,
      fontSize: 13,
    },
  });
}
