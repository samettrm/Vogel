# 🐦 Vogel — Almanca Öğrenme Uygulaması

Turkish → German dil öğrenme uygulaması. Duolingo tarzı dersler, XP/seri/can sistemi, başarımlar ve günlük görevler.

## ⚡ Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu (cache temizleyerek)
npx expo start -c

# Telefonunda Expo Go uygulamasıyla QR kodu tara
```

**Gereksinimler:**
- Node.js 20+
- Expo SDK 54
- Expo Go (iOS/Android telefonda)

## 📁 Klasör Yapısı

```
Vogel/
├── app/                     # Expo Router sayfaları
│   ├── (tabs)/             # Tab navigator (Harita / Profil / Market / Dersler)
│   ├── lesson/[lessonId].tsx  # Ders ekranı (dinamik)
│   ├── onboarding.tsx      # İlk açılış akışı
│   ├── settings.tsx        # Ayarlar
│   ├── achievements.tsx    # Tüm rozetler grid
│   ├── daily-goal.tsx      # Günlük hedef ekranı
│   ├── review.tsx          # Spaced repetition tekrar
│   └── _layout.tsx         # Root layout (StatusBar, GestureHandler, AchievementToast)
└── src/
    ├── components/         # Tüm UI bileşenleri
    │   ├── achievements/   # AchievementToast + Summary
    │   ├── exercises/      # MultipleChoice / Translate / Listen / FillBlank / Speak
    │   ├── feedback/       # CorrectFeedback / WrongFeedback / Confetti
    │   ├── lesson/         # LessonHeader / LessonComplete / GrammarTip / LevelUp
    │   ├── map/            # LessonNode / MapPath / SegmentedRing / BirdMascot / LevelTabs
    │   ├── profile/        # AvatarCard / XPBar / StatGrid / StreakCalendar / DailyQuestPanel / StreakBanner
    │   ├── shop/           # ShopItem / KupaPackage
    │   └── ui/             # ConfirmDialog / GlassCard / PrimaryButton / Chip / IconButton
    ├── data/
    │   ├── courses/        # A1, A2, B1, B2, C1 müfredat dosyaları
    │   └── achievements.ts # Başarım rozet tanımları
    ├── i18n/               # TR/EN sözlüğü + useT hook
    ├── store/              # Zustand store (useUserStore.ts)
    ├── theme/              # Renk paleti + useThemeColors hook
    ├── types/              # TypeScript tip tanımları
    └── utils/              # exerciseHelpers, sounds (Audio cache)
```

## 🏗️ Mimari Notları

### State Yönetimi
- **Zustand** + AsyncStorage persist (`vogel-user-storage`, version 6).
- Tüm state `useUserStore.ts` içinde. Set'ler için custom serializer/reviver.
- Self-healing merge: eski buggy versiyonlarda yanlış cevaplı dersler completed olarak kalmışsa hydration'da otomatik temizlenir.

### Tema Sistemi
- **Default dark mode.** Sistem tema takip edilmez (Appearance API kullanılmaz).
- Renkler `src/theme/colors.ts`'de iki palette: `dark` + `light`.
- Component'lerde `const c = useThemeColors()` + `makeStyles(c)` pattern'i.
- Asla module-level `dark.X` import etme — daima hook ile.

### Çoklu Dil (i18n)
- TR + EN destekli. `src/i18n/index.ts` tek dosyada sözlük.
- Türkçe karakterler doğru: ı, İ, ö, Ö, ü, Ü, ş, Ş, ğ, Ğ, ç, Ç.
- Kullanım: `const t = useT()`, sonra `t('common.continue')` veya `t('achievements.summary', { unlocked: 5, total: 18 })`.
- Yeni metin eklerken hardcoded string yazma — daima sözlüğe ekle.

### Performans
- Lesson screen `useReducer` ile tek state (12 useState → 1 dispatch).
- Tüm exercise + feedback component'leri `React.memo`.
- Handler'lar `useCallback` + state bağımlılığı yok → tamamen stable referans.
- LessonNode + SegmentedRing memo (haritada 30+ instance var).
- Sounds: `Audio.Sound` instance cache, ilk çalmadan sonra reuse.

### Müfredat
- 5 seviye: A1, A2, B1, B2, C1 — toplam ~120 ders, ~500+ kelime, ~150+ cümle.
- Her ders ortalama 7 egzersiz (5 multipleChoice + 2 cümle).
- Almanca isimler artikelli (Der/Die/Das).
- Bazı derslerde `grammarNote` alanı var → ders öncesi intro card gösterilir.

### Başarımlar
- 17 rozet, 4 renk grubu (neon/gold/purple/cyan).
- `src/data/achievements.ts`'de tanımlar (id + iconName + i18n key + check fn + color).
- Lesson tamamlandığında `checkAndUnlockAchievements()` çağrılır.
- Yeni rozet açılınca üstten kayan toast (`AchievementToast`, 3.5sn).

### Spaced Repetition
- Yanlış cevaplanan egzersizler `reviewItems` map'inde saklanır.
- Her doğru cevapta `strength` artar (max 5), 3 ardışık doğruda kayıttan silinir.
- `app/review.tsx` ekranı `getDueReviewItems()` ile vade gelmiş tekrarları gösterir.

### Günlük Görevler
- Her gün 3 random görev (1 ders / 30 XP / 10 doğru cevap gibi).
- Tamamlanınca claim butonu → ödül XP eklenir.
- Tarih değişince otomatik rotasyon (`refreshDailyQuestsIfNeeded`).

## 🧪 Test Komutu

```bash
cd C:\Users\i9pc\Documents\Vogel
npx expo start -c
```

Test akışı:
1. **Onboarding** → günlük hedef seç → ana ekran (Harita)
2. **Bir derse gir** → eğer grammarNote varsa intro card → cevapla → feedback → devam
3. **Profil** → AvatarCard, XPBar, StatGrid, AchievementsSummary, DailyQuestPanel, StreakCalendar görünmeli
4. **Achievements** → /achievements'a git, tüm rozetler grid görünmeli
5. **Settings** → tema değiştir (dark/light), dil değiştir (tr/en)

## ⚠️ Bilinen Sorunlar

- **Speech.speak (TTS)** Android'de bazen kasıyor — `lastSpeakAtRef` ile 250ms debounce var.
- **Audio.Sound** ilk yüklemede kısa gecikme var — soundCache ile sonraki çalmalar hızlı.
- **Level Up Screen** aktif tetiklenmiyor — store'da `level` alanı yok, sadece XP/100 hesaplaması var. İlerleyen sürümlerde milestone tetikleyici eklenebilir.
- **Push Notifications**: expo-notifications package kurulu değil. Hatırlatma sistemi için kurulması gerek.
- **MatchPairs egzersizi**: Type tanımı var ama UI render edilmiyor (lesson screen sadece 5 tip render ediyor: MC/Translate/Listen/FillBlank/Speak).
- **Gerçek STT (sesten metne)**: SpeakExercise'da cloud STT yok; mikrofon kaydı sonrası hedef metni kademe kademe yazıyor (simülasyon).

## 🔧 Geliştirici İpuçları

### Yeni Bir Ders Eklemek
1. `src/data/courses/tr-de-XX.ts` içinde uygun ünitenin `lessons` array'ine ekle.
2. ID formatı: `tr-de-{level}-u{unitNo}-l{lessonNo}` (örn `tr-de-a1-u2-l3`).
3. Her egzersiz unique ID: `tr-de-a1-u2-l3-e1`.
4. Gramer notu eklemek için `grammarNote: { tr: '...', en: '...' }` koy.

### Yeni Bir Rozet Eklemek
1. `src/data/achievements.ts`'de `ACHIEVEMENTS` array'ine yeni `AchievementDefinition` ekle.
2. `src/i18n/index.ts`'de `achievements.{newRozetId}Title` ve `{newRozetId}Desc` keylerini ekle.
3. `check` fonksiyonunda `AchievementState` üzerinden koşulu yaz.

### Yeni Bir Egzersiz Türü Eklemek
1. `src/types/index.ts`'de `ExerciseType` union'ına yeni tip ekle ve type tanımı yap.
2. `src/components/exercises/NewExercise.tsx` oluştur, `React.memo` ile sar.
3. `app/lesson/[lessonId].tsx`'de render dalını ekle + reducer'a aksiyon ekle.
4. `src/utils/exerciseHelpers.ts`'de `getCorrectAnswerText` ve `isAnswerCorrect` fonksiyonlarına case ekle.

## 📜 Lisans

Özel — sahibi: Samet.
