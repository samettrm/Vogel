import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme';
import { AdBanner } from './AdBanner';

// ════════════════════════════════════════════════════════════════
// PinnedAdBanner — BottomNav'in (tab bar) hemen ÜSTÜNE sabit banner.
//
// Tab layout'tan BİR KEZ render edilir → her tab'da görünür (Harita /
// Dersler / Profil / Mağaza). Lexora'daki "pinned bottom banner" pattern'i.
//
// • Absolute overlay → içerik düzenini ve map scroll geometrisini DEĞİŞTİRMEZ
//   (ScrollView tam yükseklikte arkada kalır, banner sadece üstüne biner).
// • AdBanner premium'da / Expo Go'da null döner → bu katman 0 yükseklik olur,
//   boş kutu göstermez.
// • pointerEvents="box-none" → banner dışındaki dokunuşlar içeriğe geçer.
//
// BottomNav içerik yüksekliği ≈ 60px (paddingTop xs=4 + hairline 1 +
// row paddingTop 4 + tab: iconWrap 28 + label ~13 + paddingVertical 8).
// safeBottom inset bunun altına biner.
// ════════════════════════════════════════════════════════════════

const BOTTOM_NAV_CONTENT_HEIGHT = 60;

export function PinnedAdBanner() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const safeBottom = Math.max(insets.bottom, 6);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: safeBottom + BOTTOM_NAV_CONTENT_HEIGHT,
      }}
    >
      {/* Opak arka plan: arkadan kayan içerik banner'ın altında temiz okunsun */}
      <View style={{ backgroundColor: c.bg, alignItems: 'center' }}>
        <AdBanner />
      </View>
    </View>
  );
}
