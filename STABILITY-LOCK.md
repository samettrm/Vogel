# 🔒 Stability Lock — Vogel V35.1 (2026-05-30)

Bu dokümanda Vogel'in **kilitli mekanikleri** bulunur. Bu mekaniklere dokunan PR'lar **2 kez düşün, sonra yine düşün**.

33 iterasyon + Apple iki kez reject sonrası ulaşılan stabil hal. **Dokunmadan önce buraya bakılması zorunlu.**

---

## 🗺️ Map Scroll Mekaniği (LOCKED)

**Dosya:** [app/(tabs)/index.tsx](app/(tabs)/index.tsx)  
**Versiyon:** V33 + V34 + V35.1  
**Onay tarihi:** 2026-05-30, user explicit approval

### Sabitler — DEĞİŞTİRİLEMEZ

```typescript
const anchorY = vh * 0.25;  // 🔒 USER FINAL DECISION
```

### Davranış Matrisi

| Tetikleyici | Mekanik | Animasyon |
|---|---|---|
| App ilk açılış (initial mount) | scrollToIndex(unitIdx, viewOffset) + mapVisible overlay | `animated: false` silent jump |
| Tab focus (Profile → Map) | scrollToIndex(unitIdx, viewOffset) | `animated: true` smooth scroll |
| Lesson complete (DEVAM) | scrollToIndex(unitIdx, viewOffset) + mapVisible overlay | `animated: false` silent jump |
| Lesson exit (X) | moduleSavedScrollY restore (V29 multi-attempt) | `animated: false` instant snap |

### Kritik Refler

```typescript
let moduleSavedScrollY = 0;  // Module-level, component unmount survival
const previousLessonIdRef = useRef<string | null>(null);
const savedScrollYBeforeLessonRef = useRef<number | null>(null);
const lastOpenedLessonIdRef = useRef<string | null>(null);
const [mapVisible, setMapVisible] = useState(false);  // Top-flash prevention
```

### Lesson Exit Mode Detection

**Dosya:** [src/utils/navState.ts](src/utils/navState.ts)
```typescript
export const mapNavState = {
  fromLesson: boolean,
  lessonReturnMode: 'exit' | 'complete' | null,
};
```

**Dosya:** [app/lesson/[lessonId].tsx](app/lesson/[lessonId].tsx) — `goHome` function
```typescript
const goHome = (mode: 'exit' | 'complete' = 'exit') => {
  if (!returnTo || returnTo === '/') {
    mapNavState.fromLesson = true;
    mapNavState.lessonReturnMode = mode;
    router.replace('/');
  } else {
    router.back();  // V34 nav fix — exam-map stack duplication önle
  }
};
```

### ❌ ASLA YAPMA

- `anchorY` değerini değiştirme (0.25)
- `animated: true` initial mount veya lesson_complete için (top flash sebep)
- `scrollToOffset({ offset: 0 })` herhangi bir auto-scroll için
- `initialScrollIndex` prop'unu FlatList'e geri ekleme (race condition)
- Refinement step (V12 bouncing bug)
- Module-level `StyleSheet.create` içinde `c.X` veya `useThemeColors()`

### ✅ MEVCUT TEST AKIŞI

1. App aç → ATT prompt 2sn'de görünür → Map current lesson area'sında açılır
2. Lesson tıkla → girer
3. X / Çık → Map AYNI scroll position'da kalır
4. Lesson bitir → DEVAM → Map yeni current lesson'da
5. Profil → Map → smooth scroll current lesson'a
6. Dersler → exam-map → ders → X → exam-map → geri → tek basışta Dersler

---

## 🍎 Apple App Store Compliance (LOCKED)

### Guideline 2.1 — ATT Prompt

**Dosya:** [app/_layout.tsx](app/_layout.tsx) — `AdsInitializer` component

```typescript
// USER ONAYLI: Onboarding-bağımsız, hidrasyon sonrası 1.5sn delay
useEffect(() => {
  if (!hasHydrated) return;
  if (promptShownRef.current) return;
  promptShownRef.current = true;
  const t = setTimeout(() => {
    requestTrackingPermission().catch(() => {});
  }, 1500);
  return () => clearTimeout(t);
}, [hasHydrated]);
```

❌ `onboardingCompleted` veya `currentLessonId` deps'e EKLEME.

### Guideline 3.1.2(b) — Subscription Trinity

PaywallModal + Shop footer + PremiumPlansCard **HEPSINDE** 3 link bulunmalı:
1. Privacy Policy
2. Terms of Use (EULA)
3. **Manage Subscription** (`src/utils/manageSubscriptions.ts`)

Plus Shop footer'da: **Restore Purchases**

```typescript
// src/utils/manageSubscriptions.ts
const IOS_URL = 'https://apps.apple.com/account/subscriptions';
const ANDROID_URL = 'https://play.google.com/store/account/subscriptions';
```

### App Store Connect Metadata

- App Description (TR + EN): EULA + Privacy URL linkleri zorunlu
- App Privacy → Privacy Policy URL set
- Notes for Reviewer → ATT instructions + Demo account + Subscription info
- Attachment → Screen recording `.mp4` (KÜÇÜK harf, BÜYÜK harf reject)

### Apple Reviewer Bypass

```typescript
const APPLE_REVIEW_EMAIL = 'apple-reviewer@vogel-app.com';
// VerifyEmailGuard, login flows — bu email için verify atla
```

---

## 🎨 Style Pattern (CRASH PREVENTION)

### ❌ YANLIŞ — Module-level styles + c reference

```typescript
const styles = StyleSheet.create({
  myStyle: {
    color: c.textMed,  // 🚨 CRASH: ReferenceError
  },
});
```

### ✅ DOĞRU — İki seçenek

**Option A: Sabit renk**
```typescript
const styles = StyleSheet.create({
  myStyle: {
    color: 'rgba(255,255,255,0.5)',
  },
});
```

**Option B: makeStyles(c) function**
```typescript
function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    myStyle: { color: c.textMed },  // c in scope
  });
}

// Component:
const styles = useMemo(() => makeStyles(c), [c]);
```

---

## 📦 Native Module Lazy Require (LOCKED)

Bu projede TÜM native modüller lazy require ile sarılır. Top-level import = Expo Go'da crash.

```typescript
// ✅ PATTERN
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
```

Bu pattern'le sarılı: expo-secure-store, google-signin, expo-apple-authentication, react-native-purchases, expo-notifications.

---

## 🔐 Build Configuration (LOCKED)

| Item | Değer | Sebep |
|---|---|---|
| `expo-secure-store` | `~15.0.8` | SDK 54, 56.x crash |
| iOS Distribution Cert | Lexora ile shared (`IOS_DIST_PRIVATE_KEY`) | Apple cert limit |
| Codemagic `ios_signing:` | YOK | Script-based signing |
| Codemagic `--create` flag | YOK | Cert 409 limit |
| `HEART_REFILL_MINUTES` | 300 (5 saat) | Prod |
| `app.json` version | 1.0.3 | Apple submitted |
| Build numbers | Codemagic auto-increment | 33 = V35.1 |

---

## 📝 İlgili Commit'ler

```
9020fea  fix(nav): exam-map stack duplication (V34)
803f8fb  feat(legal): Manage Subscriptions link (V35)
24cd49c  fix(shop): CRITICAL crash — c.textMed scope (V35.1)
7fab2b1  docs: lock V33 map scroll config
2497718  fix(map): v33 SILENT JUMP
```

---

## 🎯 Production State

- iOS: Apple Review'da (1.0.3 build 33), May 30, 2026 7:00 PM GMT+3 auto-release
- Android: Closed Testing aşamasında (Production 14 gün sonra)
- Test account: `apple-reviewer@vogel-app.com` / `VogelReview2026!`
- ATT screen recording: ASC Notes'a yüklü

---

## 🔥 Bu Dokümana Eklenecek/Çıkarılacak Şey Varsa

User'a sor: **"Bu STABILITY-LOCK.md'de yazan X'i değiştirmek istiyorum, onayın var mı?"**

User onayı OLMADAN bu listedeki hiçbir mekaniğe dokunma.
