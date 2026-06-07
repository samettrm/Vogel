import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { dark } from '../../src/theme';
import { BottomNav } from '../../src/components/map/BottomNav';
import { PinnedAdBanner } from '../../src/components/ads/PinnedAdBanner';

console.warn('[FILE_LOAD] app/(tabs)/_layout.tsx loaded');

// ════════════════════════════════════════════════════════════════
// TABS LAYOUT
// 4 sekme: Harita (index) / Dersler / Profil / Mağaza (shop).
// Alt nav, expo-router'ın varsayılan tab bar'ı yerine
// custom dark-neon BottomNav bileşeni ile render edilir.
//
// ⚠️ KEY ARCHITECTURAL RULE (2026-05-29 — Expo Router 6 constraint):
//   Bu layout HER ZAMAN <Tabs>...</Tabs> render etmek ZORUNDA. Null,
//   ActivityIndicator veya bare Redirect döndürürsek expo-router screen
//   registration bozulur ve app açılmaz (build 30 deneyiminden öğrendik).
//
//   Onboarding redirect logic'i RootLayout (app/_layout.tsx) içindeki
//   OnboardingGuard tarafından yönetilir. Fresh install'da map flash'i
//   SplashScreen API ile engellenir — splash hydration + nav decision
//   bitene kadar görünür kalır, sonra otomatik kalkar.
//
// Eski route'lar (leaderboard, store) dosya olarak duruyor ama
// href: null ile sekme listesinden gizlendi (bozulmasın diye silinmedi).
// ════════════════════════════════════════════════════════════════

export default function TabsLayout() {

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

      {/* 📺 Tab bar'ın üstüne sabit banner — her tab'da görünür (free user).
          Absolute overlay: içerik/map scroll geometrisini bozmaz. Premium'da
          AdBanner null döner → görünmez. */}
      <PinnedAdBanner />
    </View>
  );
}
