# Vogel — Mimari & Geliştirme Rehberi

Bu dosya, projede çalışacak her Claude oturumunun (ya da insan geliştiricinin) hızlıca konuya hakim olması için yazılmıştır. **Operasyonel pipeline detayları için [AGENTS.md](AGENTS.md)'ye bak** (Codemagic, EAS, signing, çıktı al komutları). Burası **mimari + state + konvansiyon** kaynağıdır.

> Yeni Claude oturumu açıldığında: önce bu dosyayı, sonra [TODO.md](TODO.md) ve [AGENTS.md](AGENTS.md)'yi oku.

---

## 1. Proje özeti

Vogel — Türkçe → Almanca yönünde Duolingo benzeri dil öğrenme uygulaması. iOS + Android hedefli, App Store/TestFlight'a yayında. Lesson map, XP/can/streak sistemi, başarımlar, günlük görevler, spaced repetition tekrar merkezi, premium abonelik (RC), Goethe/TELC sınav ekranı.

- **Bundle ID:** `com.yenipc002.Vogel`
- **App version:** 1.0.2 (`app.json`)
- **App Store Connect ID:** 6771534635
- **Apple Team ID:** 7Q6ZYGVH67

## 2. Stack

```
Expo SDK 54 (~54.0.33)        expo-router 6 (file-based)
React 19.1.0                  React Native 0.81.5
TypeScript 5.9 strict         Zustand 5 + AsyncStorage persist

Auth:    firebase 12 (JS SDK) + Google + Apple Auth
IAP:     react-native-purchases 10 (RevenueCat)
Storage: AsyncStorage + expo-secure-store ~15.0.8 (lazy)
Errors:  @sentry/react-native ~7.2.0
Anim:    react-native-reanimated 4 + react-native-svg 15
Audio:   expo-av (⚠️ deprecated, SDK 55'te kalkacak) + expo-speech
```

Eklenen tüm native modüller **lazy require** (bkz. §7).

## 3. Hızlı komutlar

| Ne | Komut |
|---|---|
| Dev server | `npx expo start -c` |
| iOS prod build + TestFlight | `git push origin main` → Codemagic otomatik tetik |
| Android APK | `eas build --platform android --profile production --non-interactive` |
| Lokal Android build (EAS quota dolu ise) | [AGENTS.md §🔧](AGENTS.md) |
| Build çıktısı izle | https://codemagic.io/apps |

Çıktı al komutları: `çıktı al ios`, `çıktı al android` — detay [AGENTS.md](AGENTS.md).

## 4. Klasör haritası

```
app/                       Expo Router sayfaları (file-based)
├── _layout.tsx            Root: font, Sentry, RC init, hydration, kalp tick,
│                          OnboardingGuard, AuthGuard, VerifyEmailGuard, PremiumSyncer
├── (tabs)/                Map / Lessons / Profile / Shop / Leaderboard
├── lesson/[lessonId].tsx  Ders ekranı (useReducer state machine)
├── login.tsx              Email/Google/Apple
├── onboarding.tsx         7 adımlı kişiselleştirilmiş akış
├── verify-email.tsx       Email doğrulama polling
├── review/                Spaced repetition
├── exam.tsx / exam-map.tsx Goethe·TELC sınav sistemi
└── settings.tsx, achievements.tsx, daily-goal.tsx, ...

src/
├── components/            UI bileşenleri (exercises/, lesson/, map/, profile/, shop/, paywall/...)
├── config/                firebase.ts, revenuecat.ts, sentry.ts
├── data/courses/          tr-de-a1..c1 müfredat dosyaları
├── data/achievements.ts   17 rozet tanımı
├── i18n/                  TR + EN sözlüğü, useT hook
├── services/
│   ├── auth.ts            Email/Google/Apple wrapper
│   ├── purchases.ts       RC init + plan fetch + checkIsPremiumSafe
│   ├── sync.ts            uploadProgress / downloadAndReplace / clearLocal
│   └── personalization.ts Motivasyon meta + ETA hesabı
├── store/
│   ├── useUserStore.ts    ⭐ Ana state (XP, hearts, lessons, achievements, prefs)
│   └── useAuthStore.ts    Firebase user (persist EDİLMEZ)
├── theme/                 colors, spacing, gradients, typography, useThemeColors
├── types/index.ts         Exercise/Lesson/Course/CEFRLevel/LanguageCode
└── utils/
    ├── secureStore.ts     ⭐ Cihaz-bağlı login flag (lazy require)
    ├── smartReminders.ts  Bildirim metin/zamanlama (motivation-aware)
    ├── notifications.ts   expo-notifications wrapper
    ├── sounds.ts          mp3 cache (correct/wrong/lessonComplete/...)
    └── haptics.ts         expo-haptics wrapper

lib/                       Sözlük + helper'lar (german-*.ts, storage.ts, text.ts, ...)
docs/                      Release playbook'ları (ANDROID/IOS), store listing
scripts/                   Dictionary builder, icon gen, validate, patch-android-signing
codemagic.yaml             iOS prod + Android prod workflow'ları
eas.json                   EAS Build dev/preview/production profile'ları
```

## 5. Auth + Onboarding akışı (cihaz-bazlı kilit)

Bu akış birden çok kez refactor edildi, **dikkatli olarak dokunulmalı**. Her gard ayrı bir child component'tir ve `Stack` mount'tan sonra render edilir (root `useEffect`'in "navigate before mounting" hatası vermesini engellemek için).

### Garda hiyerarşisi ([app/_layout.tsx](app/_layout.tsx))

```
1. OnboardingGuard       → onboarding bitirildi mi? + cihaz-bağlı bypass
2. SmartReminderRefresher → 24h'da bir bildirim yenile
3. PremiumSyncer         → RC entitlement'ı store'a senkronize et
4. AuthSyncer            → Firebase auth state + cloud sync
5. AuthGuard             → user yok ise N misafir ders sonra /login zorla
6. VerifyEmailGuard      → emailVerified yoksa /verify-email
```

### Cihaz-bağlı login geçmişi (`secureStore.ts`)

iOS Keychain (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) + Android EncryptedSharedPreferences ile **uninstall sonrası persist eden ama yeni cihaza taşınmayan** bir flag.

| Senaryo | Flag | Davranış |
|---|---|---|
| Yeni cihaz / ilk yükleme | yok | Onboarding + 2 misafir ders + zorunlu login |
| Aynı cihazda uninstall + reinstall | var | Onboarding atlanır, direkt `/login` |
| Native modül yoksa (Expo Go) | n/a | `hasDeviceEverLoggedIn()` false döner — graceful |

⚠️ `expo-secure-store` **lazy require**'la sarılıdır ([src/utils/secureStore.ts:35-45](src/utils/secureStore.ts:35)). Top-level import KOYMA — modül yoksa modül-level crash olur (geçmişte yaşandı, bkz. commit `f341b31`).

### Misafir ders limiti

`GUEST_LESSON_LIMIT = 2` ([app/_layout.tsx:432](app/_layout.tsx:432)). Tipik Duolingo paterni: kullanıcı XP kazansın, sonra "kaybetmemek için" hesap açsın → conversion %60-80.

### Apple Review bypass

`APPLE_REVIEW_EMAIL = 'apple-reviewer@vogel-app.com'` — Firebase Spark plan'da emailVerified toggle olmadığı için bu özel hesap için doğrulama atlanır. Sadece bu email ile çalışır ([app/_layout.tsx:473](app/_layout.tsx:473), [app/login.tsx:99](app/login.tsx:99)).

## 6. State + Sync stratejisi

### Zustand store ([src/store/useUserStore.ts](src/store/useUserStore.ts))

- **persist version: 6** (eski 0-5'ten gelen kullanıcılar self-healing merge ile temizleniyor)
- **Set/Map JSON serializer/reviver** custom — `completedLessons`, `achievementsUnlocked` Set olarak tutuluyor
- **HEART_REFILL_MINUTES = 300** (5 saat, prod)
- **STREAK_MILESTONES** = [3, 7, 14, 30, 60, 100, 180, 365] — özel kutlama ekranı tetikleyici

### Cloud sync ([src/services/sync.ts](src/services/sync.ts))

Firestore path: `/users/{uid}/data/progress`

| Fonksiyon | Ne zaman | Strateji |
|---|---|---|
| `uploadProgress(uid)` | Sign-up sonrası + 3sn debounced (ders bitince) | overwrite |
| `downloadAndReplaceProgress(uid)` | Sign-in sonrası | cloud authoritative, local'i değiştir |
| `downloadAndMergeProgress(uid)` | (Kullanılmıyor şu an, max/union merge) | max/union |
| `clearLocalProgress()` | Sign-out + cloud boş login | xp/streak/hearts vb sıfırla, prefs kalır |

⚠️ **`onboardingCompleted` cloud'a yazılmaz** — her cihazda yerel ([src/services/sync.ts:25-34](src/services/sync.ts:25)). Cihaz-bazlı UX akışı için.

⚠️ **Sync race condition fix** ([app/_layout.tsx:367](app/_layout.tsx:367)): logout sırasında bekleyen upload timer iptal ediliyor. Yoksa `signOut → clearLocalProgress → 3sn sonra boş state cloud'a yazılıyordu (12d776d).

## 7. Native modül lazy-load konvansiyonu

Bu projede **tüm native modüller lazy require ile sarılır**. Sebep: Expo Go'da native modül yok → top-level import'lu modül crash eder. Production build'inde de yanlış sürüm kurulu olursa fallback için graceful no-op olmalı (bkz. f341b31 crash).

Pattern:

```ts
let _module: any = null;
let _loadAttempted = false;

function getModule(): any | null {
  if (_loadAttempted) return _module;
  _loadAttempted = true;
  try {
    _module = require('some-native-package');
    return _module;
  } catch {
    return null;
  }
}

export async function doSomething() {
  const mod = getModule();
  if (!mod?.someFn) return; // graceful no-op
  // ...
}
```

Bu pattern'le sarılı dosyalar:

| Modül | Dosya | Neden |
|---|---|---|
| `expo-secure-store` | [src/utils/secureStore.ts](src/utils/secureStore.ts) | SDK 54 mismatch crash önleme |
| `@react-native-google-signin/google-signin` | [src/services/auth.ts:105](src/services/auth.ts:105) | Expo Go'da yok |
| `expo-apple-authentication` | [src/services/auth.ts:175](src/services/auth.ts:175) | Expo Go'da yok |
| `react-native-purchases` | try-catch ile `initPurchases()` | Expo Go'da yok, dev'de mock |
| `expo-notifications` | Dinamik `import('../src/utils/smartReminders')` | Sadece kullanıcı bildirim açtıysa yüklen |

**Yeni native paket eklerken bu pattern'i uygula.**

## 8. IAP / RevenueCat

Konfig: [src/config/revenuecat.ts](src/config/revenuecat.ts)

```
ENTITLEMENT_PREMIUM = 'Vogel: Language Lessons Pro'
OFFERING_DEFAULT    = 'default'

PRODUCT_IDS = {
  premiumMonthly: 'vogel_premium_monthly',
  premiumYearly:  'vogel_premium_yearly',
  premiumFamily:  'vogel_premium_family',
}
```

API key env'leri: `EXPO_PUBLIC_RC_API_KEY_IOS`, `EXPO_PUBLIC_RC_API_KEY_ANDROID` (Android key Codemagic'te secure var olarak set edilmeli).

### Premium senkronizasyonu

`PremiumSyncer` ([app/_layout.tsx:510](app/_layout.tsx:510)) açılışta `checkIsPremiumSafe()` çağırır:
- RC "premium" → store'u true yap
- RC "premium değil" → store'u false yap
- RC yanıt vermedi (offline/hata) → **mevcut değere DOKUNULMAZ**

Bu sayede telefon değişimi + ağ yokken kullanıcı yanlışlıkla premium'dan düşürülmez.

## 9. Build / Release (özet)

| Platform | Pipeline | Tetik |
|---|---|---|
| iOS | Codemagic `ios-production` | `main`'e push (otomatik) → IPA → TestFlight |
| Android (APK) | EAS `production` | Manuel `eas build` |
| Android (AAB) | Codemagic `android-production` | Manuel tetik (Play Console hazır olunca otomatikleşecek) |

iOS Codemagic'te **`ios_signing:` bloğu YOK** — Lexora ile ortak distribution cert kullanılıyor, signing tamamen script step'inde (`app-store-connect fetch-signing-files --certificate-key "@env:IOS_DIST_PRIVATE_KEY"`).

**Asla `ios_signing:` bloğu ekleme — 13 build bu yüzden patladı.** **Asla `--create` flag'i ekleme — Apple cert limit'i 409 döner.**

Detay: [AGENTS.md](AGENTS.md), [docs/IOS_RELEASE_PLAYBOOK.md](docs/IOS_RELEASE_PLAYBOOK.md), [docs/ANDROID_RELEASE_PLAYBOOK.md](docs/ANDROID_RELEASE_PLAYBOOK.md).

## 10. Kritik convention'lar

### Zustand kullanımı
```ts
// ❌ Destructure ETME — her değişiklikte tüm component re-render olur
const { xp, hearts } = useUserStore();

// ✅ Granular selector
const xp     = useUserStore((s) => s.xp);
const hearts = useUserStore((s) => s.hearts);
```

### Export pattern
- Exercise bileşenleri → **named export**
- `LessonComplete`, `AnswerFeedback` → **named export**
- `ProgressBar` → **default export** (istisna — değiştirme!)

### Theme
- **Default mode: dark** (sistem teması takip EDİLMEZ — `Appearance` kullanılmaz)
- Component'te `const c = useThemeColors()` + `makeStyles(c)` pattern
- Asla module-level `dark.X` import etme
- Hardcoded renk yazma, `colors.primary` kullan (rgba istisna)

### i18n
- Tüm UI metni `src/i18n/index.ts` sözlüğünden gelir
- Hardcoded string yazma — yeni key ekle, hem TR hem EN doldur
- Türkçe karakterleri doğru gir (ı/İ, ş/Ş, ğ/Ğ, ç/Ç, ö/Ö, ü/Ü)

### Route
- `router.push('/review')` ✓ — `'/review/index'` yazma
- `router.replace('/')` ana sayfaya dön
- Dynamic: `router.push(\`/lesson/\${lesson.id}\`)`

### Cevap doğrulama
- `isAnswerCorrect(exercise, answer)` — [src/utils/exerciseHelpers.ts](src/utils/exerciseHelpers.ts)
- multipleChoice: `correctOptionId` ile karşılaştır (asla `option.correct: boolean` arama)
- translate/listen: `joinWords()` ile birleştirip karşılaştır

## 11. Tehlikeli alanlar / dokunmama listesi

1. **`expo-secure-store` sürümü** — `~15.0.8` (SDK 54). `^56.x` SDK 56'ya aittir → crash.
2. **`codemagic.yaml` → `ios_signing:` bloğu** — EKLEME, signing script step'inde.
3. **`codemagic.yaml` → `app-store-connect fetch-signing-files --create`** — EKLEME, cert limit 409.
4. **`IOS_DIST_PRIVATE_KEY` env var** — Lexora ile ORTAK PEM. Farklı değer koyma.
5. **Onboarding cloud sync** — `onboardingCompleted` cloud'a yazılmasın (cihaz-bazlı UX).
6. **Persist version** — store şeması değişince `version` artır + migrate fn yaz.
7. **Race condition fix (sync)** — `signOut` sırasında upload timer iptal mantığını kaldırma.
8. **`HEART_REFILL_MINUTES`** — prod 300, test için 1'e geçirirsen commit'leme.
9. **Sentry `enabled: !!SENTRY_DSN`** — DSN yoksa init atlanmamalı, sadece veri gönderilmemeli (App Start Span uyarısı için kritik).
10. **🔒 Google Sign-In SHA-1 (Firebase) — ASLA BOZMA.** Google ile giriş (`DEVELOPER_ERROR Kod:10` bug'ı) **Firebase Console'da imzalama SHA-1'leri kayıtlı olduğu için** çalışıyor — düzeltme KODDA değil, sunucu config'inde. Firebase `vogel-3e071` → Android app (`com.yenipc002.Vogel`) altında bu fingerprint'ler kayıtlı kalmalı:
    - **Play App Signing key SHA-1** = `A6:66:71:71:CF:23:26:F0:7B:8A:BF:8E:AC:D1:21:1E:68:42:09:21` (Play'in dağıttığı APK'lar Google bu key ile yeniden imzalandığı için — tüm gerçek kullanıcılar buna bakar; canlı login'i ÇÖZEN budur).
    - **Upload key SHA-1** = `97:A0:99:...` (internal testing / local APK).
    - Yapma: bu SHA-1'leri Firebase'den silme · `webClientId`/`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`'yi değiştirme · keystore/imza akışını değiştirme · classic Google flow'u (`GoogleSignin.signIn()` + `getTokens()` → `signInWithCredential`) SHA-1 gerektirmeyen bir akışla değiştirme. Play App Signing key Google tarafından KALICI yönetilir → bir daha değişmez, fix kalıcıdır.
    - Yeni bir dağıtım kanalı (farklı keystore) eklenirse o key'in SHA-1'i de Firebase'e EKLENMELİ.

## 12. Test akışı

```powershell
cd C:\Users\i9pc\Documents\Vogel
npx expo start -c
```

**Manuel checklist (her release öncesi):**
1. Cold start → onboarding (yeni cihaz) veya direkt map (login flag varsa)
2. 2 misafir ders → 3. ders öncesi login zorla
3. Email sign-up → verify email ekranı → polling → ana ekran
4. Google sign-in → instant ana ekran + cloud progress replace
5. Apple sign-in (iOS) → aynı
6. Premium satın al (sandbox) → store'da `isPremium: true` + sonsuz can
7. Restore purchases (cihaz değişimi simülasyonu)
8. Reinstall (aynı cihaz) → onboarding atlanır, direkt login
9. Uninstall + yeni cihaz → onboarding tekrar başlar

**Profil ekran kontrol:** AvatarCard, XPBar, StatGrid, AchievementsSummary, DailyQuestPanel, StreakCalendar görünüyor mu.

---

> Bu dosya canlıdır. Önemli mimari kararlar bu dosyaya işlenmelidir. Operasyonel detaylar (signing, build env, çıktı al komutları) [AGENTS.md](AGENTS.md)'de kalır.
