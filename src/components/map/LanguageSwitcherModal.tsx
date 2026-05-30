import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { LANGUAGE_PAIRS, LanguagePairInfo } from '../../config/languagePairs';

// ════════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER MODAL
//
// Dil çifti seçimi için modal. Bayrak ikonuna tıklayınca açılır.
// Her çift için bayrak + isim + native isim + status gösterir.
// "Yakında" işaretli (available=false) çiftler disabled görünür.
// ════════════════════════════════════════════════════════════════

interface LanguageSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSwitcherModal({
  visible,
  onClose,
}: LanguageSwitcherModalProps) {
  const c = useThemeColors();
  const activeCourse = useUserStore((s) => s.activeCourse);
  const setActiveCourse = useUserStore((s) => s.setActiveCourse);

  const styles = useMemo(() => makeStyles(c), [c]);

  const handleSelectPair = (pair: LanguagePairInfo) => {
    Haptics.selectionAsync().catch(() => {});
    if (!pair.available) {
      // "Yakında" — disabled, sadece feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    // Active pair'i değiştir (A1 default level)
    setActiveCourse(pair.source, pair.target, 'A1');
    onClose();
  };

  const isActive = (pair: LanguagePairInfo) =>
    activeCourse.source === pair.source && activeCourse.target === pair.target;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeInDown.springify().damping(18).stiffness(160)}
            style={styles.sheet}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Dil Seç</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={c.textMed} />
              </Pressable>
            </View>

            <Text style={styles.subtitle}>
              Hangi dili öğrenmek istiyorsun?
            </Text>

            {/* Pair listesi */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {LANGUAGE_PAIRS.map((pair, idx) => {
                const active = isActive(pair);
                return (
                  <Animated.View
                    key={`${pair.source}-${pair.target}`}
                    entering={FadeIn.delay(idx * 40).duration(280)}
                  >
                    <Pressable
                      onPress={() => handleSelectPair(pair)}
                      style={({ pressed }) => [
                        styles.pairRow,
                        active && styles.pairRowActive,
                        !pair.available && styles.pairRowDisabled,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.flag}>{pair.flag}</Text>
                      <View style={styles.pairInfo}>
                        <View style={styles.pairTitleRow}>
                          <Text style={styles.pairTitle}>{pair.targetName}</Text>
                          {!pair.available && (
                            <View style={styles.comingSoonBadge}>
                              <Text style={styles.comingSoonText}>Yakında</Text>
                            </View>
                          )}
                          {active && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={c.neon}
                            />
                          )}
                        </View>
                        <Text style={styles.pairNative}>
                          {pair.targetNativeName}
                        </Text>
                        {pair.subtitle && (
                          <Text style={styles.pairSubtitle}>{pair.subtitle}</Text>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-end',
    },
    sheetWrapper: { width: '100%' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.xl,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    title: {
      ...textStyles.heading,
      color: c.textHigh,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.glassBg,
    },
    subtitle: {
      ...textStyles.body,
      color: c.textMed,
      marginBottom: spacing.base,
    },
    listContent: {
      paddingBottom: spacing.base,
    },
    pairRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      borderRadius: radius.lg,
      backgroundColor: c.glassBg,
      borderWidth: 1,
      borderColor: c.glassBorder,
      marginBottom: spacing.sm,
    },
    pairRowActive: {
      borderColor: c.neon,
      backgroundColor: c.neonBg,
    },
    pairRowDisabled: {
      opacity: 0.55,
    },
    flag: {
      fontSize: 32,
    },
    pairInfo: {
      flex: 1,
      gap: 2,
    },
    pairTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pairTitle: {
      ...textStyles.bodyBold,
      color: c.textHigh,
      fontSize: 16,
    },
    pairNative: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 13,
    },
    pairSubtitle: {
      ...textStyles.caption,
      color: c.textMuted,
      fontSize: 11,
    },
    comingSoonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: c.gold + '22',
      borderWidth: 1,
      borderColor: c.gold,
    },
    comingSoonText: {
      ...textStyles.caption,
      color: c.gold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });
}
