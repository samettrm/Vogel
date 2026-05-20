# VOGEL PROJESİ — TAM CONTEXT HANDOFF (Claude → ChatGPT)

Bu dokümanı yapay zekana yapıştırarak Vogel projesinde nerede kaldığımı, ne yaptığımı ve neyin eksik olduğunu anlatabilirsin. Tüm context burada.

---

## 1. PROJE KİMLİĞİ

**İsim:** Vogel  
**Amaç:** Duolingo benzeri, oyunlaştırılmış, Almanca öğrenme uygulaması  
**İlk dil çifti:** Türkçe → Almanca A1  
**Mimari prensip:** "Code is language-agnostic, content is language-dependent" — kod jenerik, ders içerikleri ayrı data dosyalarında  
**Hedef platform:** Android (Expo Go ile development, EAS Build ile production APK)  
**Geliştirme ortamı:** Windows 10 + VS Code + Expo Go (Android cihaz)  
**Proje sahibi:** Kod yazmıyor, AI'lar aracılığıyla geliştiriyor. Türkçe iletişim tercih ediliyor. Patch değil temiz mimari istiyor.

---

## 2. TEKNİK STACK

```
React Native           0.81.5
Expo SDK               54
expo-router            6 (file-based routing)
TypeScript             5.9 (strict-ish, no any)
Zustand                5 (with persist middleware)
react-native-reanimated 4
react-native-svg       15
react-native-safe-area-context
@expo/vector-icons (Ionicons)
expo-av                ⚠️ deprecated SDK 54'te — gelecekte expo-audio'ya geçilecek
expo-speech            (TTS — Android voice parametresi DESTEKLENMEZ)
expo-haptics
@react-native-async-storage/async-storage
@expo-google-fonts/nunito
lottie-react-native    (henüz kullanılmıyor)
```

**Çalıştırma:**
```
cd C:\Users\i9pc\Documents\Vogel
npx expo start --clear
```
Telefonda Expo Go ile QR'ı tara.

**⚠️ DİKKAT:** Bilgisayarda iki Vogel klasörü vardı (`C:\Users\i9pc\Vogel` — eski bozuk şablon, `C:\Users\i9pc\Documents\Vogel` — gerçek proje). Daima `Documents\Vogel`'den çalıştır.

---

## 3. KLASÖR YAPISI

```
app/
├── _layout.tsx                 Root: font + hydration + TTS warmup + heart refill ticker
├── NoHeartsScreen.tsx          /NoHeartsScreen route (can=0 ekranı)
├── (tabs)/
│   ├── _layout.tsx             Alt tab bar (safe area destekli)
│   ├── index.tsx               🏠 Ana ekran — SVG demiryolu + zigzag istasyonlar
│   ├── leaderboard.tsx         🏆 Lig sıralaması
│   ├── profile.tsx             👤 Profil + tekrar merkezi sayacı
│   └── shop.tsx                🛒 Mağaza (kupa, premium)
├── lesson/
│   └── [lessonId].tsx          📚 Ders ekranı — reducer + queue (REFACTORED)
└── review/
    └── index.tsx               🔁 Tekrar merkezi (yanlış yapılan soruları çözme)

src/
├── components/
│   ├── Confetti.tsx            50 parçacık konfeti animasyonu
│   ├── PathNode.tsx            🎯 Squircle istasyon node'u (24px radius, 8px 3D)
│   ├── TopBar.tsx              XP/can/streak bar
│   ├── UnitHeader.tsx          Ünite başlık kartı
│   ├── exercises/
│   │   ├── MultipleChoiceExercise.tsx   şıklar Fisher-Yates ile random
│   │   ├── TranslateExercise.tsx        wordBank random + seçilen kelime havuzdan KAYBOLUR
│   │   └── ListenExercise.tsx           hoparlör butonu + onPressIn + hitSlop
│   └── lesson/
│       ├── AnswerFeedback.tsx
│       ├── LessonComplete.tsx           🎉 Konfeti + 3 istatistik kartı + DEVAM
│       ├── LessonHeader.tsx
│       ├── NoHeartsScreen.tsx           Bileşen — app/NoHeartsScreen.tsx tarafından sarmalanır
│       └── ProgressBar.tsx              (default export)
├── data/
│   └── courses/
│       ├── index.ts            export ALL_COURSES, getCourseById
│       └── tr-de-a1.ts         Türkçe→Almanca A1 — 3 ünite, ~8 ders, her ders ~8 egzersiz
├── store/
│   └── useUserStore.ts         🏛️ Tek merkezi Zustand store (büyük — birden çok AI yazdı)
├── theme/
│   ├── colors.ts               Candy palette + alias'lar (red, green, neutral100-900 vs.)
│   ├── spacing.ts              xs/sm/md/base/lg/xl/xxl + radius + buttonShadowOffset
│   ├── typography.ts           Nunito fontları + textStyles
│   └── index.ts                Tek export noktası
├── types/
│   └── index.ts                Exercise/Lesson/Course/ExerciseType
└── utils/
    ├── exerciseHelpers.ts      isAnswerCorrect, getCorrectAnswerText, joinWords, getReviewPayloadForExercise
    └── sounds.ts               expo-av ile playSound(key) — sounds RAM cache

assets/
└── sounds/                     ffmpeg ile üretilmiş tatlı ses efektleri
    ├── correct.mp3 (5KB)       İki notalı parlak ding
    ├── wrong.mp3 (6KB)         Alçak titreşimli buzz
    ├── lesson_complete.mp3 (14KB)   Yükselen 4 notalı fanfare
    └── unit_complete.mp3 (20KB)     Büyük akor + fanfare
```

---

## 4. YAPILANLAR (kronolojik özet)

### 🎨 Tasarım sistemi
- `colors.ts` — Candy palette: primary `#6D28D9` (mor), sBahnBlue `#00BBF9`, vb.
- Geriye dönük uyumluluk için tüm alias'lar eklendi: `red`, `redDark`, `incorrectBg`, `green`, `greenDark`, `blueLight`, `disabled`, `neutral100`...`neutral900`. Eski/yeni kod tek paletten okuyor.
- Bileşenler artık `colors.red` çağırınca `#FF4B4B` alıyor, `colors.neutral500` çağırınca `#777777` alıyor.

### 🏠 Ana ekran (SVG demiryolu)
- `(tabs)/index.tsx` içinde react-native-svg ile 4 katmanlı tren yolu:
  1. Drop shadow (rgba opak)
  2. Açık mavi ballast (`#B8E6FF`)
  3. Ana mavi ray (`sBahnBlue`)
  4. Beyaz cross-tie pattern (`strokeDasharray="3,14"`) — travers efekti
- Geniş zigzag: `STATION_SPACING_Y=210`, `ZIG_PATTERN=[0,110,0,-110,60,-60,0,110]`
- Aktif duraga 🚂 emoji overlay
- BAŞLA balonu aktif duraga (pembe, alt ok'lu)
- PathNode: squircle (24px radius), 8px 3D derinlik, basılınca aşağı çöker

### 📚 Ders ekranı (PRODUCTION REFACTOR)
- **TAMAMEN YENİDEN YAZILDI** — `app/lesson/[lessonId].tsx`
- **useReducer state machine**:
  - State: `{ phase, queue, inputs, stats, lastResult }`
  - Phases: `PLAYING | FEEDBACK | COMPLETE` (discriminated union, no `any`)
  - Actions: `INIT | SELECT_OPTION | ADD_WORD | REMOVE_WORD_AT | CHECK_ANSWER | CONTINUE`
  - Race condition matematiksel olarak imkansız (no setTimeout, no lock ref)
- **Queue-based progression**:
  - `queue` = kalan exercise ID'lerinin sıralı dizisi
  - Doğru cevap → `queue.shift()`
  - Yanlış cevap → `queue.shift()` + `queue.push(wrongId)` (yanlış sona atılır)
  - Queue boşalınca → COMPLETE → `completeLesson(lessonId)` + `clearLessonProgress(lessonId)` + `registerStudySession()`
- **Per-lesson persistent progress**:
  - `lessonProgress: Record<lessonId, { queue, stats, timestamps }>` store'da AsyncStorage'a persist edilir
  - Kullanıcı çıkıp girince queue'dan devam eder (yarım kalan ders)
- **Granular Zustand selectors** — `useUserStore(s => s.xp)` gibi tek tek (destructure ETME!)
- **Tüm `useCallback` + `useMemo`** ile render optimizasyonu
- Render path'leri: notFound | empty | noHearts | complete | mountIncomplete | mainScreen — hiçbir beyaz ekran ihtimali yok
- Exercise transition: sadece `FadeInRight` entering (exit animation YOK — eski egzersiz key değişince anında unmount)

### 🎯 Egzersiz tipleri
- **MultipleChoice**: Şıklar her egzersizde Fisher-Yates ile random sıralanır (`useMemo` keyed on `exercise.id`)
- **Translate**: wordBank random; seçilen kelime havuzdan **tamamen kaybolur** (opacity 0 değil, render edilmez); üstteki kelimeye tıklayınca yerine geri döner
- **Listen**: wordBank random; aynı translate UI'sini sarmalıyor; Almanca konuşma `expo-speech` ile (`onPressIn` + `hitSlop` ile instant tap)

### 🎉 Ders tamamlama (LessonComplete)
- 3 istatistik kartı: XP earned (altın), Doğruluk %, Kalan Can
- **Her** ders bitiminde konfeti patlıyor (sadece ünite değil)
- **Her** ders bitiminde 4 atışlı haptic burst (`Success → Heavy → Heavy → Success`)
- **Ünite tamamlandığında** ekstralar: yıldız → kupa ikonu, altın → mor arka plan, "Ders" → "Ünite Tamamlandı!"
- Pulse + sallanma animasyonu (Reanimated)

### 💔 Can sistemi
- Store: `hearts`, `maxHearts`, `nextHeartRefillAt`
- `HEART_REFILL_MINUTES = 1` ⚠️ TEST İÇİN — production'da 30 yap
- `loseHeart()` — yanlış cevapta tetiklenir, premium kullanıcı için no-op
- `applyHeartRefills()` — geçen süreyi hesaplayıp birikmiş canları ekler (app açılırken + 60sn'de bir tick)
- `refillHearts()` — 450 kupa karşılığı tümünü doldurur
- Can=0 + ders ekranında → `/NoHeartsScreen` route'una yönlendir
- `NoHeartsScreen` ekranı: kırık kalp, geri sayım sayacı (her saniye günceller), "450 Kupa ile Doldur" + "Ana Ekrana Dön" butonları

### 🔁 Review (tekrar merkezi)
- Spaced repetition (basit): strength 0→5, nextReviewAt geçince "due"
- `recordReviewResult(payload, isCorrect)`:
  - **Sadece yanlış cevapta yeni item EKLENİR** (kritik bug fix — eskiden her cevapta ekleniyordu, 110 fantom item birikmişti)
  - Doğru cevap + zaten queue'da → strength artar
  - Doğru cevap + 3 üst üste doğru streak + strength 5 → queue'dan **mezun olur** (silinir)
- `getDueReviewItems()` — sadece `wrongCount > 0` olanları döndürür (çift güvenlik)
- `normalizeReviewItems()` — her app açılışında bozuk itemları sessizce temizler (self-healing)

### 🔊 Ses sistemi
- `src/utils/sounds.ts` — `playSound(key)` API'si, 4 ses cache'lenir
- `expo-av Audio.Sound.createAsync` ile lazy load
- `playsInSilentModeIOS: true`, hata olursa sessizce yutar
- Sesler **ffmpeg ile sandbox'ta üretildi** (sine wave + envelope + fade):
  - `correct.mp3`: 1047Hz + 1568Hz iki notalı bell
  - `wrong.mp3`: 180Hz tremolo buzz
  - `lesson_complete.mp3`: C-E-G-C arpeggio
  - `unit_complete.mp3`: 3-note pickup + 3-note chord
- **Önemli not**: Eğer sesleri değiştirmek istersen ya manuel mp3 koy ya da kullanıcıdan iste; sandbox'lar genelde dış indirmeleri engelliyor.

### 🗣️ TTS gecikmesi — DETAYLI NOT
- expo-speech'in `volume` parametresi **Android'de DESTEKLENMİYOR** (sadece iOS).
- Bu yüzden `Speech.speak(text, { volume: 0.01 })` Android'de **TAM SESLE** çalar.
- Otomatik warmup yapmaya çalışan herhangi bir `Speech.speak()` çağrısı kullanıcıyı rahatsız edecektir.
- Mevcut çözüm (`app/_layout.tsx`): Sadece `Audio.setAudioModeAsync` + `Speech.getAvailableVoicesAsync()` çağrılır — ikisi de gerçekten sessizdir.
- Sonuç: Almanca voice paketi ilk hoparlör dokunuşunda yüklenir (~500ms-1sn gecikme), sonraki dokunuşlar instant.
- **KALICI ÇÖZÜM = Pre-recorded Almanca audio dosyaları** kullanmak. Sandbox bunu üretemiyor (espeak-ng / gtts hiçbiri sandbox'a girmiyor). Kullanıcı dışarıdan dosya temin etmeli veya Google Cloud TTS gibi bir servise yönlendirilmeli.

### 🛡️ Diğer fixler
- Egzersiz geçişinde üst üste binme: `FadeOutLeft.exiting` kaldırıldı, sadece `FadeInRight.entering` kaldı
- Alt tab bar: `useSafeAreaInsets().bottom` ile gesture barından yukarı itildi
- Ders ekranı alt butonları (KONTROL ET/DEVAM): aynı şekilde safe area paddingBottom
- `/NoHeartsScreen` route'u — PathNode'daki `router.push('/NoHeartsScreen')` artık crash etmiyor
- "Demiryolunu sıfırla" butonu ana ekranda — DEV ARACI, production'da kaldırılacak

---

## 5. KRİTİK ÖRÜNTÜLER / KONVANSİYONLAR

### Export tipleri
- `LessonComplete` → **named export** (`export function LessonComplete()`)
- `AnswerFeedback` → **named export**
- Tüm exercise bileşenleri → **named export**
- `ProgressBar` → **default export** (istisna)

İmport karışıklığı bir kez büyük bir bug'a yol açtı (default vs named) — dikkat.

### Zustand store kullanımı
- ❌ `const { xp, hearts } = useUserStore()` — destructure ETME, her store değişikliğinde re-render eder
- ✅ `const xp = useUserStore(s => s.xp)` — granular selector
- Action'lar pure, set() içinde state değişimi yapar; side-effect side-by-side (örn. `playSound()`) component'te.

### Tema kullanımı
- Asla hardcoded renk yazma (`'#58CC02'` değil, `colors.primary`)
- İstisnalar: gradient/şeffaf renkler için `rgba(...)` doğrudan
- `spacing.xs/sm/md/base/lg/xl/xxl/xxxl/huge`
- `radius.sm/md/lg/xl/pill`
- `buttonShadowOffset` (4px standart 3D depth)

### Route konvansiyonu
- ✅ `router.push('/review')`
- ❌ `router.push('/review/index')`
- ✅ `router.push('/lesson/${lesson.id}')`
- ✅ `router.replace('/')` ana ekrana dön

### Egzersiz tipleri (`src/types/index.ts`)
```ts
type ExerciseType = 'translate' | 'multipleChoice' | 'listen' | 'matchPairs' | 'fillBlank' | 'speak';
```
- multipleChoice: `options[]` + `correctOptionId`
- translate: `prompt` + `correctAnswer` + `wordBank[]`
- listen: `audioText` + `correctAnswer` + `wordBank[]`
- matchPairs / fillBlank / speak: tip tanımlı ama UI bileşeni yok — `[lessonId].tsx`'te `isSupportedExercise` filter ile atlanıyor

### Cevap doğrulama
`isAnswerCorrect(exercise, answer)` — `src/utils/exerciseHelpers.ts`. multipleChoice için `option.id` karşılaştırır, translate/listen için joinedWords karşılaştırır. Asla `option.correct: boolean` kontrolü yapma — veri yapısı `correctOptionId: string`.

---

## 6. BİLİNEN SORUNLAR / TUZAKLAR

1. **expo-av deprecated**: SDK 54'te uyarı var. Production'a çıkmadan `expo-audio` ve `expo-video`'ya migrate edilmeli.
2. **SafeAreaView deprecated (RN'in built-in'i)**: `react-native-safe-area-context`'ten alınmalı her yerde. Bazı yerlerde hâlâ RN'in olanı kullanılıyor.
3. **Heart refill 1 dakika**: `HEART_REFILL_MINUTES = 1` — TEST ayarı. Production'da **30** yap.
4. **DEMİRYOLU SIFIRLA butonu**: Dev için ana ekranda. Production'da kaldırılacak.
5. **İki paralel lesson tracking sistemi**:
   - `lessonExerciseProgress` (eski, başka AI tarafından eklenmiş, korundu)
   - `lessonProgress` (yeni queue tabanlı, ben ekledim)
   Hangisinin kalıcı olacağına karar verilmeli. Şu an `lessonProgress` aktif kullanılıyor (ders ekranında).
6. **Sandbox/AI ortamı kısıtları**: Harici siteler (Mixkit, Pixabay, GitHub raw vb.) bloklu. Pip de bloklu. Almanca TTS audio üretimi mümkün değil sandbox içinden.
7. **Bazı bileşenlerde hardcoded renk**: `#58CC02`, `#FF4B4B` gibi. Tema sistemine taşınmalı.

---

## 7. NE YAPILACAK (YOL HARİTASI)

### 🔴 Yüksek öncelik
1. **Pre-recorded Almanca audio**: Listen egzersizleri için her cümlenin mp3'ünü bundle'a koymak. TTS gecikmesini sıfırlar.
2. **`HEART_REFILL_MINUTES = 30`**: Production'a çıkmadan değiştir.
3. **DEMİRYOLU SIFIRLA butonunu kaldır**: Production'a çıkmadan kaldır.
4. **expo-av → expo-audio migration**: Sounds modülü ve _layout'taki Audio.setAudioModeAsync güncellenmeli.
5. **EAS Build setup**: APK üretmek için.

### 🟡 Orta öncelik
6. **Onboarding flow**: İlk açılışta dil çifti seçimi + günlük hedef seçimi.
7. **Daily quests**: 3 günlük görev sistemi (X XP kazan, Y ders bitir, Z streak'i koru).
8. **Reward chest**: Ünite sonunda açılan sandık animasyonu (ekran görüntüsünde görüldü).
9. **Badges / rozetler**: Streak rozeti, mükemmel ders rozeti, vb.
10. **Combo XP**: Üst üste doğru cevaplarda XP çarpanı.
11. **Daha fazla içerik**: Ünite 4+, A2 seviye.
12. **Mascot karakteri**: Duolingo'nun baykuşu gibi bir karakter (Vogel = kuş).

### 🟢 Düşük öncelik / polish
13. **Spaced repetition algoritması iyileştirmesi**: SM-2 algoritması gibi.
14. **Lottie animasyonları**: lottie-react-native zaten kurulu, kullanılmıyor.
15. **Hardcoded renklerin temizliği**: Tüm bileşenleri tema'ya bağla.
16. **Test yaz**: Hiç unit test yok.
17. **Accessibility**: Screen reader desteği, font scaling, vb.
18. **TypeScript strict mode tam aktif**: tsconfig'de `strict: true` ama bazı yerlerde `any` izleri olabilir.

---

## 8. SİZE DEVRALDIĞIMDA NE BEKLİYORUM

- **Patch değil, mimari**: Kullanıcı "buraya bir try-catch ekle" tarzı patchlerden bıkmış. Production-grade çözüm istiyor.
- **Türkçe iletişim**: Tüm açıklamaları Türkçe yap.
- **Test talimatı**: Her değişiklikten sonra "telefonu sallayıp reload de" veya "Metro'yu Ctrl+C ile durdur, `npx expo start --clear`" gibi net talimat ver.
- **Mevcut çalışan şeyi kırma**: Konfeti, sesler, demiryolu SVG, can sistemi vs. çalışıyor — refactor yaparken bunları korumaya özen göster.
- **Granular selectors**: Zustand'ı yanlış kullanma — destructure etme.
- **Reducer pattern**: [lessonId].tsx'teki state machine örneğine bak, benzer kalıbı kullan.
- **TypeScript strict, no `any`**: Discriminated union'lar, generic'ler, `unknown` + tip guard'lar kullan.

---

## 9. HIZLI DOĞRULAMA KONTROLÜ

Kod yazmadan önce projenin gerçek halini görmek için:

```bash
# Mevcut store yapısı
cat src/store/useUserStore.ts | head -150

# Ders ekranı reducer
cat "app/lesson/[lessonId].tsx" | head -200

# Veri yapısı
cat src/data/courses/tr-de-a1.ts | head -80

# Mevcut tema
cat src/theme/colors.ts
```

Eğer kullanıcı bir bug rapor ederse, **mutlaka önce ilgili dosyayı okuyup mevcut durumu doğrula**, sonra düzelt. Birden çok AI çalıştığı için kodun anlık hali context'inden farklı olabilir.

---

## 10. KULLANICININ SON DEDİĞİ

> "Patch değil production-grade architecture istiyorum. Lesson state flow + progression engine + exercise state machine + lesson completion pipeline + locking/unlocking + persistent progress hepsi profesyonel kurulmalı."

Bunlar büyük ölçüde tamamlandı. Sıradaki büyük iş **monetization-ready hâle getirmek**: onboarding + daily quests + badges + APK build + production cleanup (HEART_REFILL_MINUTES = 30, DEMİRYOLU SIFIRLA butonu kaldır, expo-av migration).

Başarılar. 🦅
