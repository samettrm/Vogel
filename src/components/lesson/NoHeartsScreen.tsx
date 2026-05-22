import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  buttonShadowOffset,
  colors,
  radius,
  spacing,
  textStyles,
} from '../../theme';

// Canı sıfırlanan kullanıcıya gösterilen ekran.
// Geri sayım sayacı her saniye günceller. Kullanıcı ana ekrana dönmek dışında
// (şimdilik) bir şey yapamaz — premium "tüm canları doldur" hook'u sonra eklenecek.

type Props = {
  nextHeartAt: number | null;
  onGoHome: () => void;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

export function NoHeartsScreen({ nextHeartAt, onGoHome }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (nextHeartAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextHeartAt]);

  const remaining =
    nextHeartAt === null ? 0 : Math.max(0, nextHeartAt - now);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="heart-dislike" size={72} color={colors.white} />
      </View>

      <Text style={styles.title}>Canın bitti!</Text>
      <Text style={styles.subtitle}>
        Yeni bir can için biraz beklemen gerekiyor.
      </Text>

      {nextHeartAt !== null ? (
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={20} color={colors.heartDark} />
          <Text style={styles.timerText}>
            Sonraki can: {formatRemaining(remaining)}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onGoHome}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            transform: [{ translateY: pressed ? buttonShadowOffset : 0 }],
            borderBottomWidth: pressed ? 0 : buttonShadowOffset,
          },
        ]}
      >
        <Text style={styles.primaryButtonText}>ANA EKRANA DÖN</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)/shop')}
        style={styles.ghostButton}
      >
        <Text style={styles.ghostButtonText}>
          Sınırsız can için Premium al →
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.heart,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: colors.heartDark,
    marginBottom: spacing.base,
  },
  title: {
    ...textStyles.heading,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.wrongBg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  timerText: {
    ...textStyles.bodyBold,
    color: colors.heartDark,
  },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    borderBottomColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...textStyles.button,
    color: colors.white,
    fontSize: 18,
  },
  ghostButton: {
    paddingVertical: spacing.sm,
  },
  ghostButtonText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
