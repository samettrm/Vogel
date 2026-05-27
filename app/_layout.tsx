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
import { useEffect, useRef, useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Sentry from '@sentry/react-native';
import { useUserStore } from '../src/store/useUserStore';
import { AchievementToast } from '../src/components/achievements/AchievementToast';
import { preloadAllSounds } from '../src/utils/sounds';
import { SENTRY_DSN } from '../src/config/sentry';
import { initPurchases, logInToRevenueCat, logOutFromRevenueCat } from '../src/services/purchases';
import { initMobileAds, requestTrackingPermission } from '../src/services/ads';
import { subscribeToAuthState } from '../src/services/auth';
import { downloadAndReplaceProgress, uploadProgress } from '../src/services/sync';
import { isFirebaseConfigured } from '../src/config/firebase';
import { useAuthStore } from '../src/store/useAuthStore';
import { hasDeviceEverLoggedIn } from '../src/utils/secureStore';

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

// ════════════════════════════════════════════════════════════════
// ADMOB — Google Mobile Ads SDK başlatılır.
// Native modül yoksa (Expo Go) graceful no-op.
// ATT prompt onboarding sonrası AdsInitializer'da çağrılır.
// ════════════════════════════════════════════════════════════════
initMobileAds();
// Google Sign-In artık lazy başlatılıyor — Expo Go'da native modül yok diye crash etmesin.
// configureGoogleSignIn() ilk Google butonuna basıldığında signInWithGoogle içinde çağrılır.

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
        {/* 📺 AdMob ATT prompt — onboarding bitince bir kez göster */}
        <AdsInitializer />
        {/* 🔄 Auth senkronizasyonu — giriş/ilerleme senkronizasyonu */}
        <AuthSyncer />
        {/* 🚪 Auth guard — login YOK ise her zaman /login'e yönlendir */}
        <AuthGuard />
        {/* ✉️ Email doğrulama guard — onaylanmamışsa verify ekranına yönlendir */}
        <VerifyEmailGuard />
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
const INSTALL_TIME_KEY = 'vogel:install-time';

function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  // Secure-store cihaz kontrolü tamamlandı mı? Bu bitmeden navigation
  // kararı verilemez (timing yarışı önleme).
  const [deviceCheckDone, setDeviceCheckDone] = useState(false);

  // 🔑 ADIM 5 (aynı cihazda silip yeniden yükleme) tespiti
  // SecureStore (iOS Keychain / Android EncryptedSharedPreferences) cihaz-bağlı,
  // iCloud/Google Backup'a dahil DEĞİL. Uninstall sonrası kalır.
  //   • Flag var → cihazda daha önce login yapıldı → onboarding bypass +
  //                hasEverSignedIn true → AuthGuard direkt /login'e gönderir.
  //   • Flag yok → yeni cihaz veya hiç login yapılmamış → ADIM 1-3 normal akış.
  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      const deviceHadUser = await hasDeviceEverLoggedIn();
      if (deviceHadUser) {
        useUserStore.setState({
          onboardingCompleted: true,
          hasEverSignedIn: true,
        });
      }
      setDeviceCheckDone(true);
    })();
  }, [hasHydrated]);

  // 🔍 Fresh install / reinstall detection (eski mekanizma — yedek olarak duruyor)
  // SecureStore yoksa (Expo Go gibi senaryolar) bu install-time karşılaştırması
  // hâlâ AsyncStorage'ı temizleyerek koruma sağlar.
  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      try {
        const installTime = await Application.getInstallationTimeAsync();
        const currentMs = installTime.getTime();
        const stored = await AsyncStorage.getItem(INSTALL_TIME_KEY);

        if (stored === null) {
          // İlk kayıt — set et, sıfırlama yok
          await AsyncStorage.setItem(INSTALL_TIME_KEY, String(currentMs));
        } else if (Number(stored) !== currentMs) {
          // Reinstall tespit edildi (yedek mekanizma)
          // NOT: SecureStore flag varsa onboardingCompleted yukarıdaki effect'te
          // tekrar true yapılır — yani bu reset aynı cihaz reinstall'da etki etmez.
          useUserStore.setState({
            onboardingCompleted: false,
            hasEverSignedIn: false,
            learningMotivations: [],
          });
          await AsyncStorage.setItem(INSTALL_TIME_KEY, String(currentMs));
        }
      } catch {}
    })();
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || !deviceCheckDone) return;
    if (!onboardingCompleted && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else if (onboardingCompleted && pathname === '/onboarding') {
      router.replace('/');
    }
  }, [hasHydrated, deviceCheckDone, onboardingCompleted, pathname, router]);

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
// AUTH SYNCER — Firebase auth state'i izler ve senkronizasyonu tetikler.
//
// • Giriş yapıldığında bulut verisi indirilip yerel ile birleştirilir.
// • completedLessons değiştiğinde (ders tamamlandığında) otomatik yüklenir.
// • Her değişiklikte debounced upload — gereksiz yazma işlemi olmaz.
// ════════════════════════════════════════════════════════════════
function AuthSyncer() {
  const setUser   = useAuthStore((s) => s.setUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const userRef   = useRef<import('firebase/auth').User | null>(null);
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth state listener
  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = subscribeToAuthState(async (user) => {
      const prevUser = userRef.current;
      userRef.current = user;
      setUser(user);

      // 🛡 RACE FIX: Kullanıcı çıkış yaptıysa bekleyen upload timer'ını HEMEN iptal et.
      // Aksi halde signOut → clearLocalProgress → 3sn sonra eski timer ateşlenip
      // BOŞ state'i cloud'a yazıyor ve gerçek ilerleme siliniyor.
      if (prevUser && !user && uploadTimerRef.current) {
        clearTimeout(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }

      // 💎 RC USER IDENTIFICATION — Firebase uid ile RC'yi senkronize et.
      // Premium grant + restore + entitlement tracking için kritik.
      // Anonymous user → RC Dashboard'da bulunamaz; uid ile kayıtlı → bulunabilir.
      if (user) {
        logInToRevenueCat(user.uid).catch(() => {});
      } else if (prevUser) {
        logOutFromRevenueCat().catch(() => {});
      }

      // Sadece e-posta doğrulanmışsa (veya Apple Reviewer) sync başlat.
      const canSync = user && (user.emailVerified || user.email === APPLE_REVIEW_EMAIL);
      if (canSync) {
        try {
          await downloadAndReplaceProgress(user.uid);
        } catch {}
      }
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // İlerleme değiştiğinde otomatik yükle (debounced, 3 saniye)
  // Sadece emailVerified=true ise upload yapar.
  useEffect(() => {
    const unsub = useUserStore.subscribe((state, prev) => {
      const user = userRef.current;
      const canUpload = user && (user.emailVerified || user.email === APPLE_REVIEW_EMAIL);
      if (!canUpload) return;
      if (state.completedLessons.size !== prev.completedLessons.size ||
          state.xp !== prev.xp) {
        if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
        uploadTimerRef.current = setTimeout(() => {
          // 🛡 RACE FIX: Timer ateşlendiğinde kullanıcı hâlâ giriş yapmış mı kontrol et.
          const currentUser = userRef.current;
          const stillAllowed = currentUser && currentUser.uid === user.uid &&
            (currentUser.emailVerified || currentUser.email === APPLE_REVIEW_EMAIL);
          if (stillAllowed) {
            uploadProgress(currentUser.uid).catch(() => {});
          }
          uploadTimerRef.current = null;
        }, 3000);
      }
    });
    return () => {
      unsub();
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ════════════════════════════════════════════════════════════════
// AUTH GUARD — Duolingo paterni: ilk N misafir ders, sonra zorunlu login.
//
// Mantık:
//   • Onboarding biter → misafir mod açılır
//   • Kullanıcı GUEST_LESSON_LIMIT (2) ders yapabilir
//   • 2 ders tamamlandıktan sonra → /login'e zorla
//   • Sign-up sırasında guest progress cloud'a yedeklenir (kayıp olmaz)
//
// Bu sayede kullanıcı uygulamayı görür, XP kazanır, sonra "kaybetmemek
// için" hesap açar → conversion rate %60-80 (ilk anda login zorla = %20-40).
//
// İstisna ekranlar (zorlama yapılmaz):
//   /login, /verify-email, /onboarding
// ════════════════════════════════════════════════════════════════
// 2 misafir ders → 3. dersten önce login zorunlu
const GUEST_LESSON_LIMIT = 2;

function AuthGuard() {
  const router       = useRouter();
  const pathname     = usePathname();
  const user         = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const hasHydrated  = useUserStore((s) => s.hasHydrated);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const hasEverSignedIn = useUserStore((s) => s.hasEverSignedIn);
  const completedLessonsCount = useUserStore((s) => s.completedLessons.size);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!hasHydrated || isAuthLoading) return;
    if (!onboardingCompleted) return;
    if (user) return;
    const safePaths = ['/login', '/verify-email', '/onboarding'];
    if (safePaths.includes(pathname)) return;
    // 🔑 Bir kere hesap açıldıysa misafir mod KAPALI — direkt login
    if (hasEverSignedIn) {
      router.replace('/login');
      return;
    }
    // 🔑 Duolingo paterni: ilk 2 ders misafir, sonra login zorunlu
    if (completedLessonsCount < GUEST_LESSON_LIMIT) return;
    router.replace('/login');
  }, [
    user, isAuthLoading, hasHydrated, onboardingCompleted,
    hasEverSignedIn, completedLessonsCount, pathname, router,
  ]);

  return null;
}

// ════════════════════════════════════════════════════════════════
// VERIFY EMAIL GUARD — Onaylanmamış email/password kullanıcısı varsa
// verify ekranına yönlendir. Onboarding ve login ekranlarında müdahale etmez.
// Apple/Google user'lar emailVerified=true ile gelir, hiç burada takılmaz.
// ════════════════════════════════════════════════════════════════
// 🍎 Apple Review test account — Spark plan email-verified toggle yok, bypass
const APPLE_REVIEW_EMAIL = 'apple-reviewer@vogel-app.com';

function VerifyEmailGuard() {
  const router    = useRouter();
  const pathname  = usePathname();
  const user      = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    if (user.emailVerified) return;
    // Apple Review bypass
    if (user.email === APPLE_REVIEW_EMAIL) return;
    // Onaylanmamış, login/onboarding/verify-email haricindeyse yönlendir
    const safePaths = ['/verify-email', '/login', '/onboarding'];
    if (!safePaths.includes(pathname)) {
      router.replace('/verify-email');
    }
  }, [user, isAuthLoading, pathname, router]);

  return null;
}

// ════════════════════════════════════════════════════════════════
// PREMIUM SYNCER — App açılışında RC'den premium durumunu çeker.
// Store'daki isPremium ile RC entitlement'ı arasındaki tutarsızlığı giderir
// (abonelik iptal, cihaz değişimi, restore vb. durumlar için).
//
// GÜVENLİ YAKLAŞIM: checkIsPremiumSafe() kullanılır.
//   - RC "premium" → setPremium(true)
//   - RC "premium değil" → setPremium(false)
//   - RC yanıt vermedi (ağ hatası, offline) → mevcut değere DOKUNULMAZ
//
// Bu sayede kullanıcılar telefon değişimi + ağ yokken yanlışlıkla
// premium'dan çıkarılmaz. Kasıtlı iptal → RC kesin "false" döner → güncellenir.
// ════════════════════════════════════════════════════════════════
function PremiumSyncer() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const setPremium = useUserStore((s) => s.setPremium);

  useEffect(() => {
    if (!hasHydrated) return;
    import('../src/services/purchases')
      .then((mod) => mod.checkIsPremiumSafe())
      .then((result) => {
        // result === null → RC cevap vermedi → mevcut AsyncStorage değerini koru
        if (result !== null) setPremium(result);
      })
      .catch(() => {});
    // sadece hydration değişiminde çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  return null;
}

// ════════════════════════════════════════════════════════════════
// ADS INITIALIZER — AdMob SDK init zaten top-level'da yapıldı.
// Bu component sadece App Tracking Transparency prompt'unu
// onboarding bittikten SONRA göstermek için kullanılır (Apple
// HIG önerisi: ATT prompt'unu context'le birlikte göster).
//
// iOS 14.5+ için zorunlu. Kullanıcı izin vermezse contextual ads;
// izin verirse personalized ads. Ya öyle ya böyle reklam yine de
// gösterilir — sadece targeting kalitesi değişir.
// ════════════════════════════════════════════════════════════════
function AdsInitializer() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const isPremium = useUserStore((s) => s.isPremium);
  const promptShownRef = useRef(false);

  useEffect(() => {
    // Henüz hidrasyon yoksa veya onboarding bitmediyse ATT prompt gösterme
    if (!hasHydrated || !onboardingCompleted) return;
    // Premium kullanıcıya gereksiz prompt gösterme (yine de reklam görmeyecek)
    if (isPremium) return;
    // Bir kere göster
    if (promptShownRef.current) return;
    promptShownRef.current = true;
    // 600ms gecikme — map ekranı render olsun, prompt context'le otursun
    const t = setTimeout(() => {
      requestTrackingPermission().catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [hasHydrated, onboardingCompleted, isPremium]);

  return null;
}
