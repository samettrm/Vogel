import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getLanguage } from '../data/languages';
import { useUserStore } from '../store/useUserStore';
import { colors, radius, spacing, textStyles } from '../theme';

// Ana ekranın en üstündeki bilgi şeridi.
// Sol: aktif dil bayrağı. Sağ: alev, kalp, XP sayaçları.

export function TopBar() {
  const activeCourse = useUserStore((s) => s.activeCourse);
  const xp = useUserStore((s) => s.xp);
  const hearts = useUserStore((s) => s.hearts);
  const streak = useUserStore((s) => s.streak);
  
  // 🔥 VOGEL PLUS PREMIUM DURUM KONTROLÜ
  const isPremium = useUserStore((s) => (s as any).isPremium);

  const targetLang = getLanguage(activeCourse.target);

  return (
    <View style={styles.container}>
      <Pressable style={styles.flagButton}>
        <Text style={styles.flag}>{targetLang.flag}</Text>
      </Pressable>

      <View style={styles.counters}>
        <Counter
          icon="flame"
          iconColor={streak > 0 ? colors.streak : colors.textMuted}
          value={streak}
        />
        {/* 🔥 Eğer kullanıcı premium ise can değerini sonsuzluk (∞) sembolü yapıyoruz */}
        <Counter 
          icon="heart" 
          iconColor={colors.heart} 
          value={isPremium ? '∞' : hearts} 
        />
        <Counter icon="diamond" iconColor={colors.blue} value={xp} />
      </View>
    </View>
  );
}

interface CounterProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: number | string; // 🔥 Sonsuzluk işareti gelebilmesi için string tipini de destekledik
}

function Counter({ icon, iconColor, value }: CounterProps) {
  // 🔥 Gelen değerin sonsuzluk sembolü olup olmadığını kontrol ediyoruz
  const isInfinity = value === '∞';

  return (
    <View style={styles.counter}>
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text 
        style={[
          styles.counterText,
          isInfinity && {
            fontSize: 32,      // 🚀 Sembolü bayağı büyük ve çok belirgin hale getirdik
            lineHeight: 34,    // İkonun yanında dikey eksende tam ortalanması için
            marginTop: -2,     // Diğer sayılarla hizayı eşitlemek için hafif yukarı çektik
          }
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  flagButton: {
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  flag: {
    fontSize: 32,
  },
  counters: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  counterText: {
    ...textStyles.bodyBold,
    color: colors.textPrimary,
  },
});