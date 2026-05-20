# Vogel CHANGELOG

## [0.2.0] — 2026-05-20 — Performans + Achievements + Müfredat Genişletme

### 🚀 Performans (En Büyük İyileştirme)
- **Lesson screen useReducer refactor**: 12 ayrı `useState` → tek `useReducer`. Reducer içinde `inputBlocked` guard'ı sayesinde handler callback'leri tamamen stable referans.
- **React.memo**: Tüm exercise componentleri (MultipleChoice, Translate, Listen, FillBlank, Speak) + Feedback componentleri (Correct, Wrong) + LessonNode + SegmentedRing memo'landı.
- **useCallback**: Map ekranı + Lesson ekranı tüm handler'lar useCallback ile sarıldı (`addWord`, `removeWordAt`, `selectOption`, `checkAnswer`, `continueLesson`, `getLessonInfo`, `handleLessonPress`, vs).
- **Side effects**: `setTimeout(0)` ile playSound/Haptics/addXp gibi yan etkiler UI render'ını bloklamıyor.
- **Sonuç**: KONTROL ET / DEVAM ET tıklamaları artık anında tepki veriyor, soru arası geçişlerde kasma yok, map ekranı scroll'u akıcı.

### 🏆 Achievements Sistemi (Yeni)
- 17 başarım rozeti (`src/data/achievements.ts`): İlk ders, 10/50/100 ders, 3/7/30 günlük seri, 100/1000/5000 XP, A1/A2/B1 tamamlama, mükemmel ders, ilk alışveriş, premium, görev avcısı.
- 4 renk grubu (neon / gold / purple / cyan) — her rozet kendi ışıma ile.
- **AchievementToast**: Yeni rozet açılınca üstten kayan toast, 3.5sn auto-dismiss + dokunmayla erken kapanır, glow animasyonu, haptic feedback.
- **AchievementsSummary**: Profile ekranında özet kart (`X/17 rozet açıldı`) + ilk 4 rozet önizleme.
- **app/achievements.tsx**: Tüm rozetler grid ekranı — kilitliler soluk + lock overlay, açıklar renkli + glow.
- Store entegrasyonu: `achievementsUnlocked: Set<string>`, `checkAndUnlockAchievements()` action — her ders tamamında otomatik çağrılır.

### 📚 Müfredat Genişletme (4 Yeni Seviye)
- **A1**: 6 ünite × 4 ders = 24 ders, 100+ kelime, 35+ cümle. Selamlaşma, sayılar 1-20, kişisel bilgi, aile, temel fiiller, objeler+renkler, içecek+yemek.
- **B1**: 24 ders. Perfekt geçmiş zaman, gelecek planları, tatil-seyahat, sağlık-doktor, iş-kariyer, alışveriş.
- **B2**: 24 ders. Yan cümleler (weil/dass/obwohl/wenn), Konjunktiv II, Passiv, çevre, teknoloji, kültür-sanat.
- **C1**: 24 ders. İdiyomatik ifadeler, akademik dil, politik tartışma, Genitiv, Konjunktiv I (dolaylı anlatım), soyut kavramlar.
- A2 zaten önceki sürümde genişletilmişti — dokunulmadı.
- Toplam ~120 ders, ~500+ kelime, ~150+ cümle. Almanca isimler artikelli (Der/Die/Das).

### 📝 Gramer İpuçları
- `Lesson.grammarNote?: { tr, en }` alanı (`src/types/index.ts`).
- `GrammarTipCard` componenti — ders öncesi modal overlay olarak gösterilir.
- A1 ve B1'deki kritik derslerde gramer notları eklendi (sein, haben, Perfekt haben/sein, artikel sistemi).
- Lesson screen'de intro card "Anladım" butonuna kadar gösterilir, sonra ilk soruya geçilir.

### 🎨 UI Polish
- **StreakBanner**: Profile'da streak > 0 ise "🔥 Serini koru! N gündür aktifsin" kartı altın renkli glow ile.
- **NextLevelCard**: Map ekranında seviye tamamlandıysa "Bu seviye tamam! Sonraki seviye: A2 →" CTA kartı.
- **ConfirmDialog**: Native Alert.alert yerine tema-aware modal (önceki sürümde geldi, koruma altında).
- **XP Bar (LessonHeader)**: Düz parlak neon yeşil + soldan sağa beyaz shimmer + bar konturunda sarmal helix elektrik (önceki sürümde finalize edildi).

### 🌍 Tema + i18n Health Check
- **SegmentedRing**: `dark` import kaldırıldı → `useThemeColors` ile migrate.
- **StreakCalendar**: Full migrate — `dark.X` → `c.X`, hardcoded Türkçe → `t()` ile i18n.
- **DailyQuestPanel**: Legacy `colors.X` → `c.X` migrate, hardcoded TR → i18n.
- **SpeakExercise**: Tema + i18n migrate, `Alert.alert` mesajları i18n key'leri kullanıyor.
- **LevelUpScreen**: Tema + i18n migrate (aktif tetiklenmiyor ama hazır).
- i18n'e yeni sectionlar: `streakCalendar`, `dailyQuestPanel`, `levelUp`, `achievements`, `grammarTip`, `recommended`, `streakBanner`, `nextLevel`.

### 🔧 Lesson Screen Refactor (Madde 6)
- Speak inline ~50 satır → `SpeakExercise` componentine taşındı.
- Lesson screen artık daha okunabilir; egzersiz türü değiştiğinde sadece ilgili component render edilir.

### 🎧 Ses Kalitesi Altyapısı (Madde 9)
- `ListenExercise.audioUrl?: string` opsiyonel alan (`src/types/index.ts`).
- ListenExercise: `audioUrl` varsa expo-av ile çalar, yoksa expo-speech TTS fallback.
- Şimdilik tüm `audioUrl` null — ileride gerçek mp3'ler eklenebilir.

### 🐛 Store + Migration
- Store version 5 → 6.
- Yeni alanlar: `achievementsUnlocked: Set<string>`, `recentlyUnlocked: string | null` (transient), `hasFirstPurchase: boolean`, `hasPerfectLesson: boolean`.
- Migration: önceki sürümden gelen state'lerde yeni alanlar default değerlerle başlar.

### ⛔ Atlandı (Sonraki Sürüm)
- **Madde 8 — Push Notifications**: `expo-notifications` package kurulu değil. Kullanıcı onayıyla yüklenince Settings'e ReminderHour picker + store'a `reminderEnabled` + `reminderHour` alanları eklenecek + daily reminder scheduling.

---

## [0.1.0] — 2026-05 — Temel Sürüm

İlk çalışan sürüm. Onboarding, ana harita, ders sistemi, profil, market, settings, review, daily-goal ekranları. Dark/Light tema, TR/EN dil. Zustand + AsyncStorage persist. Spaced repetition. Günlük görevler. Heart refill timer. XP/level sistemi. Lig (league) yapısı.
