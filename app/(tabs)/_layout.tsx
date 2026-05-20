import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { dark } from '../../src/theme';
import { BottomNav } from '../../src/components/map/BottomNav';

// ════════════════════════════════════════════════════════════════
// TABS LAYOUT
// 4 sekme: Harita (index) / Dersler / Profil / Mağaza (shop).
// Alt nav, expo-router'ın varsayılan tab bar'ı yerine
// custom dark-neon BottomNav bileşeni ile render edilir.
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
    </View>
  );
}
