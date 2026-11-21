import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useUserStore } from '../../store/useUserStore';
import { AD_UNIT_BANNER } from '../../config/admob';

// ════════════════════════════════════════════════════════════════
// AdBanner — Premium-aware banner reklam bileşeni
//
// • Premium kullanıcıda hiç render edilmez (null) → ekran temiz.
// • Native modül yoksa (Expo Go) graceful no-op — crash etmez.
// • Adaptive banner boyutu kullanır (cihaza göre yükseklik).
//
// Kullanım:
//   import { AdBanner } from '@/src/components/ads/AdBanner';
//   <AdBanner />        // ders ekranının alt kısmında vb.
// ════════════════════════════════════════════════════════════════

let _adsModule: any = null;
let _loadAttempted = false;

function getAdsModule(): any | null {
  if (_loadAttempted) return _adsModule;
  _loadAttempted = true;
  try {
    _adsModule = require('react-native-google-mobile-ads');
    return _adsModule;
  } catch {
    return null;
  }
}

export function AdBanner() {
  const isPremium = useUserStore((s) => s.isPremium);
  // Odak kapısı: sekme düzenindeki sabit banner ile ders ekranının banner'ı yığında
  // birlikte mount'lu kalır. Yalnız odaktaki ekranın banner'ı istek atar (KAPI 79).
  const isFocused = useIsFocused();
  // Premium kullanıcıda reklam yok
  if (isPremium || !isFocused) return null;

  const mod = getAdsModule();
  if (!mod?.BannerAd || !mod?.BannerAdSize) return null;
  if (!AD_UNIT_BANNER) return null; // TestFlight / App Review: reklam yok (A13)

  const { BannerAd, BannerAdSize } = mod;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
});
