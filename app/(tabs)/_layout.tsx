import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { dark } from '../../src/theme';
import { BottomNav } from '../../src/components/map/BottomNav';
import { useUserStore } from '../../src/store/useUserStore';

// ════════════════════════════════════════════════════════════════
// TABS LAYOUT
// 4 sekme: Harita (index) / Dersler / Profil / Mağaza (shop).
// Alt nav, expo-router'ın varsayılan tab bar'ı yerine
// custom dark-neon BottomNav bileşeni ile render edilir.
//
// 🛡 SYNCHRONOUS ONBOARDING REDIRECT (Apple App Review 2.1 fix):
//   OnboardingGuard'ın useEffect'i 50-200ms gecikmeli çalışıyordu →
//   user fresh install'da map'i kısa süre flash olarak görüyordu.
//   Burada SENKRON Redirect ile Tabs'lar hiç render olmadan
//   /onboarding'e yönlendiriyoruz. Apple reviewer artık fresh install'da
//   DOĞRUDAN onboarding ekranını görür, harita flash etmez.
//
// Eski route'lar (leaderboard, store) dosya olarak duruyor ama
// href: null ile sekme listesinden gizlendi (bozulmasın diye silinmedi).
// ════════════════════════════════════════════════════════════════

export default function TabsLayout() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  // 1️⃣ Persist henüz hidrate olmadıysa null render et (splash görünür).
  //    Yanlış state ile yönlendirme yapmamak için kritik.
  if (!hasHydrated) return null;

  // 2️⃣ Onboarding tamamlanmamışsa Tabs'ı hiç render etme, doğrudan
  //    /onboarding'e yönlendir. Senkron Redirect — flash YOK.
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: dark.bg }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: dark.neon,
          tabBarInactiveTintColor: dark.textLow,
          // 🚀 PERF: Aktif olmayan tab'lar render edilmez (lazy) ve
          //          arka plana geçince donar (freezeOnBlur). Bu sayede tab
          //          geçişlerinde sadece seçilen ekran render olur, diğer
          //          ekranlar store update'lerinde re-render olmaz.
          lazy: true,
          freezeOnBlur: true,
        }}
        // Tüm tab bar'ı kendi BottomNav'imize devret
        tabBar={(props) => <BottomNav {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Harita' }} />
        <Tabs.Screen name="lessons" options={{ title: 'Dersler' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="shop" options={{ title: 'Mağaza' }} />

        {/* Gizlenen route'lar (dosyalar duruyor, sekmeden çıkarıldı) */}
        <Tabs.Screen name="leaderboard" options={{ href: null }} />
        <Tabs.Screen name="store" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
