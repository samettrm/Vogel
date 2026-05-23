import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Audio } from 'expo-av';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { useUserStore } from '../src/store/useUserStore';
import { AchievementToast } from '../src/components/achievements/AchievementToast';
import { preloadAllSounds } from '../src/utils/sounds';
import { SENTRY_DSN } from '../src/config/sentry';
import { initPurchases } from '../src/services/purchases';

// ════════════════════════════════════════════════════════════════
// SENTRY — hata izleme
// DSN .env'den gelir: EXPO_PUBLIC_SENTRY_DSN=https://...
// DSN ayarlanmamışsa init atlanır (dev ortamında güvenli).
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// REVENUECAT — uygulama yüklenmeden önce bir kez başlatılır.
// API key .env'de yoksa init atlanır, mock mod çalışır.
// ════════════════════════════════════════════════════════════════
initPurchases();

// Sentry.init her zaman çağrılmalı — aksi hâlde plugin'in native wrap'i önce çalışır
// ve "App Start Span could not be finished" uyarısı oluşur.
// DSN yoksa enabled:false ile init yapılır → veri gönderilmez, wrap çalışır.
Sentry.init({
  dsn: SENTRY_DSN || undefined,
  enabled: !!SENTRY_DSN,
  debug: false,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: __DEV__ ? 1.0 : 0.15,
  maxBreadcrumbs: 50,
});

// ═════════════════════════════════════════════════════════════════
// SUPPRESS DEV LOGS
// Expo Go ortamında expo-notifications paketi yüklenince otomatik olarak push
// token registration deniyor ve "SDK 53+ Expo Go'da remote push yok" diye
// log atıyor. Bu sadece bir dev log — yerel/scheduled bildirimler çalışıyor,
// uygulama crash etmiyor. Production APK'da bu log hiç görünmez.
// Ayrıca expo-av deprecation warning'i (SDK 55'te expo-audio'ya geçilecek).
// ═════════════════════════════════════════════════════════════════
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications functionality is not fully supported',
  'Expo AV has been deprecated',
  // RevenueCat: Expo Go'da native App Store yok — development build'de çalışır.
  'Error configuring Purchases',
]);

// ════════════════════════════════════════════════════════════════
// ROOT LAYOUT
//
// TEMA POLITIKASI:
//   - Uygulamanin VARSAYILAN modu DARK'tir (kullanici telefonun sistem
//     temasini takip ETMEZ — biz Appearance/useColorScheme kullanmiyoruz).
//   - Yeni kullanici → store'da themeMode='dark' (useUserStore default).
//   - Kullanici Ayarlar > Tema > Aydinlik secerse store guncellenir,
//     AsyncStorage'a persist edilir, bir sonraki acilista da Aydinlik kalir.
//   - Yani dark = default sabit ana mod; light = opt-in.
//
// NAVIGATION GUARD STRATEJİSİ:
//   - RootLayout'un KENDİ useEffect'i Stack mount'tan ÖNCE çalışıyor.
//   - Bu yüzden router.replace çağrısı "navigate before mounting" hatası verir.
//   - Çözüm: Guard mantığını ayrı bir child component'e taşıdık (OnboardingGuard).
//     Child component Stack'in altında render edildiği için useEffect'i
//     Stack mount edildikten sonra çalışır → güvenli yönlendirme.
// ════════════════════════════════════════════════════════════════

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const applyHeartRefills = useUserStore((state) => state.applyHeartRefills);
  const themeMode = useUserStore((state) => state.themeMode);

  // ⏱ Kalp yenileme — 🚀 PERF: akıllı interval
  // Sadece kalp eksikse ve nextHeartRefillAt set ise interval kur.
  // Tam kalpken boşa setInterval çalıştırma.
  useEffect(() => {
    if (!hasHydrated) return;
    applyHeartRefills();

    const checkAndScheduleRefill = () => {
      const state = useUserStore.getState();
      // Premium veya tam kalp — interval'a gerek yok
      if (state.isPremium || state.hearts >= state.maxHearts || state.nextHeartRefillAt === null) {
        return null;
      }
      return setInterval(() => {
        const s = useUserStore.getState();
        if (s.isPremium || s.hearts >= s.maxHearts || s.nextHeartRefillAt === null) {
          // Artık gerek yok, interval'ı temizle
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          return;
        }
        applyHeartRefills();
      }, 60000);
    };

    let timer: ReturnType<typeof setInterval> | null = checkAndScheduleRefill();

    // Heart durumu değiştiğinde (loseHeart çağrısı sonrası) interval'ı yeniden kur
    const unsubscribe = useUserStore.subscribe((state, _prev) => {
      const needsRefill = !state.isPremium && state.hearts < state.maxHearts && state.nextHeartRefillAt !== null;
      if (needsRefill && !timer) {
        timer = checkAndScheduleRefill();
      } else if (!needsRefill && timer) {
        clearInterval(timer);
        timer = null;
      }
    });

    return () => {
      if (timer) clearInterval(timer);
      unsubscribe();
    };
  }, [hasHydrated, applyHeartRefills]);

  // 🎵 Audio + Speech warmup — 🚀 PERF: agresif pre-load
  // • Audio mode konfig
  // • Tüm mp3 sesleri (correct/wrong/lessonComplete/...) paralel yükle
  // • Speech voice listesi cache'le
  // • Sessiz bir Speech.speak ile Android TTS engine'i ısıt
  // İlk ders içindeki 'Kontrol et' ve sesli butona dokunma artık anında tepki verir.
  useEffect(() => {
    let cancelled = false;
    const warmupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        if (cancelled) return;
        // Tüm sesleri paralel yükle (mp3 dosyaları cache'e girer)
        // Speech voice'ları paralel çek
        await Promise.all([
          preloadAllSounds(),
          Speech.getAvailableVoicesAsync().catch(() => undefined),
        ]);
        if (cancelled) return;
        // TTS engine warmup — sessiz speak ile Google TTS'i koşturmaya başlat
        // Bu yapılmadan ilk gerçek Speech.speak çağrısı Android'de 500-1500ms geciktir.
        try {
          Speech.speak(' ', {
            language: 'de-DE',
            volume: 0,
            rate: 1,
            onDone: () => {},
            onError: () => {},
          });
        } catch {}
      } catch {}
    };
    warmupAudio();
    return () => { cancelled = true; };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Tema mode'a gore StatusBar style + arka plan
  const statusBarStyle = themeMode === 'light' ? 'dark' : 'light';
  const bgColor = themeMode === 'light' ? '#F8FAFC' : '#0F172A';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <SafeAreaProvider>
        <StatusBar style={statusBarStyle} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bgColor },
          }}
        />
        {/* 🛡 Onboarding guard + smart reminder refresh — Stack altında, mount-safe */}
        <OnboardingGuard />
        <SmartReminderRefresher />
        {/* 💎 Premium senkronizasyonu — RC entitlement'ı store'a yazar */}
        <PremiumSyncer />
        {/* 🏆 Global achievement toast — her ekranın üstünde görünür */}
        <AchievementToast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Sentry.wrap → tüm uygulamayı hata sınırıyla sarar.
// DSN ayarlı değilse wrap çalışır ama Sentry'ye hiçbir şey göndermez.
export default Sentry.wrap(RootLayout);

// ════════════════════════════════════════════════════════════════
// ONBOARDING GUARD — Stack mount edildikten SONRA yönlendirme
//
// Bu component Stack'in altında render edildiği için React useEffect'i
// Stack mount edildikten sonra çalıştırır (child → parent sıralaması).
// Yani router.replace çağrıldığında navigator garantili olarak hazırdır.
// ════════════════════════════════════════════════════════════════
function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!onboardingCompleted && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else if (onboardingCompleted && pathname === '/onboarding') {
      router.replace('/');
    }
  }, [hasHydrated, onboardingCompleted, pathname, router]);

  return null;
}

// ════════════════════════════════════════════════════════════════
// SMART REMINDER REFRESHER — 24h'da bir motivation-aware mesajlar yenilenir
//
// Bu da child component — refreshSmartReminders dinamik import edilir,
// expo-notifications modülü sadece kullanıcı bildirim açtıysa yüklenir.
// ════════════════════════════════════════════════════════════════
function SmartReminderRefresher() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const reminderEnabled = useUserStore((s) => s.reminderEnabled);
  const lastReminderScheduledAt = useUserStore((s) => s.lastReminderScheduledAt);
  const setLastReminderScheduledAt = useUserStore((s) => s.setLastReminderScheduledAt);

  useEffect(() => {
    if (!hasHydrated || !reminderEnabled) return;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const needsRefresh =
      !lastReminderScheduledAt ||
      Date.now() - lastReminderScheduledAt > TWENTY_FOUR_HOURS;

    if (needsRefresh) {
      // Dinamik import — expo-notifications zinciri yalnızca burada yüklenir
      import('../src/utils/smartReminders')
        .then((mod) => mod.refreshSmartReminders())
        .then(() => setLastReminderScheduledAt(Date.now()))
        .catch(() => {});
    }
    // sadece hydration/enable değişimlerinde çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, reminderEnabled]);

  return null;
}

// ════════════════════════════════════════════════════════════════
// PREMIUM SYNCER — App açılışında RC'den premium durumunu çeker.
// Store'daki isPremium ile RC entitlement'ı arasındaki tutarsızlığı giderir
// (abonelik iptal, cihaz değişimi, restore vb. durumlar için).
// Yalnızca RC yapılandırıldığında çalışır; yoksa no-op.
// ════════════════════════════════════════════════════════════════
function PremiumSyncer() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const setPremium = useUserStore((s) => s.setPremium);

  useEffect(() => {
    if (!hasHydrated) return;
    import('../src/services/purchases')
      .then((mod) => mod.checkIsPremium())
      .then((isPremium) => setPremium(isPremium))
      .catch(() => {});
    // sadece hydration değişiminde çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  return null;
}
