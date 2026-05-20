import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dark, spacing, textStyles } from '../../src/theme';

// ════════════════════════════════════════════════════════════════
// STORE (Tab) — Placeholder
// Premium üyelik, kalp doldurma, gem paketleri vb. sonraki aşamada.
// ════════════════════════════════════════════════════════════════

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="bag" size={48} color={dark.purple} />
        </View>
        <Text style={styles.title}>Mağaza</Text>
        <Text style={styles.subtitle}>
          Premium, can doldurma ve gem paketleri burada açılacak.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>YAKINDA</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: dark.purpleBg,
    borderWidth: 1,
    borderColor: dark.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: dark.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    ...textStyles.heading,
    color: dark.textHigh,
    marginTop: spacing.base,
  },
  subtitle: {
    ...textStyles.body,
    color: dark.textLow,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: dark.neonBg,
    borderWidth: 1,
    borderColor: dark.neon,
    marginTop: spacing.sm,
  },
  badgeText: {
    ...textStyles.label,
    color: dark.neon,
  },
});
