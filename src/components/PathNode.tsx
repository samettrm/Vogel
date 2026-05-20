import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router'; // Yönlendirme için ekledik
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../store/useUserStore'; // Can kontrolü için ekledik
import { colors, radius, spacing, textStyles } from '../theme';

// Öğrenme yolundaki ders düğmesi — squircle (yuvarlatılmış kare) tasarım.
// Üç olası durum: completed, current, locked.
// "Candy 3D" hissi: kalın alt kenarlık + ekstra yükseklik gölgesi.

export type NodeState = 'completed' | 'current' | 'locked';

interface PathNodeProps {
  state: NodeState;
  themeColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  offset?: number;
  onPress?: () => void;
}

// Squircle istasyon — Duolingo/Vogel candy estetiği
const NODE_SIZE = 84;       // 72 → 84 daha presence
const NODE_RADIUS = 24;     // tam daire değil, squircle
const NODE_DEPTH = 8;       // 4 → 8 daha güçlü 3D derinlik

export function PathNode({
  state,
  themeColor,
  icon,
  offset = 0,
  onPress,
}: PathNodeProps) {
  const isLocked = state === 'locked';
  const isCurrent = state === 'current';

  // Mağazadan kullanıcının güncel can durumunu çekiyoruz
  const hearts = useUserStore((s) => s.hearts);

  const surfaceColor = isLocked ? colors.locked : themeColor;
  const shadowColor = isLocked ? colors.lockedDark : darken(themeColor);
  const iconColor = isLocked ? colors.lockedIcon : colors.white;
  const displayIcon: keyof typeof Ionicons.glyphMap =
    state === 'completed' ? 'star' : isLocked ? 'lock-closed' : icon;

  const handlePress = () => {
    if (isLocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // 🔥 KRİTİK CAN KİLİDİ: Kullanıcı geçmiş bir dersi tekrar etmek istese bile 
    // canı 0 ise Claude'un oluşturduğu NoHeartsScreen ekranına yönlendirilir.
    if (hearts <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/NoHeartsScreen'); // /lesson/ kısmını sildik, doğrudan ana dizine baksın
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <View style={[styles.wrapper, { transform: [{ translateX: offset * 60 }] }]}>
      {isCurrent && <StartBubble />}

      <Pressable onPress={handlePress} style={styles.pressArea}>
        {({ pressed }) => (
          <View
            style={[
              styles.shadow,
              { backgroundColor: shadowColor },
              pressed &&
                !isLocked && {
                  top: NODE_DEPTH,
                  height: NODE_SIZE - NODE_DEPTH,
                },
            ]}
          >
            <View
              style={[
                styles.surface,
                { backgroundColor: surfaceColor },
                pressed &&
                  !isLocked && { transform: [{ translateY: NODE_DEPTH }] },
              ]}
            >
              <Ionicons name={displayIcon} size={32} color={iconColor} />
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function StartBubble() {
  return (
    <View style={styles.bubbleContainer}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>BAŞLA</Text>
      </View>
      <View style={styles.bubbleTriangle} />
    </View>
  );
}

/** Tema rengini bir tık koyulaştır — gölge için. */
function darken(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - 40);
  const g = Math.max(0, ((num >> 8) & 0xff) - 40);
  const b = Math.max(0, (num & 0xff) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  pressArea: {
    width: NODE_SIZE,
    height: NODE_SIZE + NODE_DEPTH,
  },
  shadow: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE + NODE_DEPTH,
    borderRadius: NODE_RADIUS,
  },
  surface: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContainer: {
    position: 'absolute',
    top: -42,
    alignItems: 'center',
    zIndex: 10,
  },
  bubble: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  bubbleText: {
    ...textStyles.caption,
    color: colors.primary,
  },
  bubbleTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.borderLight,
    marginTop: -1,
  },
});