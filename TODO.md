# Vogel — TODO

Açık problemler ve yapılması gerekenler. Tamamlanan maddeleri sil ya da en alta "Tamamlananlar" başlığı altına taşı.

Format: `- [ ] başlık` + altta gerekirse `**Why:**` / **referans dosya** / risk notu.

---

## 🔴 Yüksek öncelik (release blocker / yakın vade)

### App Store Connect
- [ ] **Screenshot 5.png + 10.png reject sorunu**
  - 1284x2778 olarak yüklenmişti, Apple bazı device class'larda strict
  - Çözüm: 1242x2688'e resize (sharp ile script ekle veya manuel)
  - **publish blocker DEĞİL ama temizlenmeli**

---

## 🟡 Orta öncelik (post-launch / next sprint)

### Android yayın
- [ ] **Play Console onayı geldi mi takip et**
  - Onay sonrası [AGENTS.md:90-99](AGENTS.md) playbook'unu uygula:
    - `eas.json` → `buildType: "app-bundle"`
    - `submit.production.android` doldur (serviceAccountKey, track: "internal")
    - `google-service-account.json` repo köküne (gitignore'lu)
    - `çıktı al android` komutuna `--auto-submit` ekle
  - Codemagic `android-production` workflow'una `google_play:` publishing bloğu ekle

- [ ] **EAS Android quota 2026-06-01 sonrası**
  - Reset olunca normal EAS cloud build'e dön
  - O tarihten önce build gerekirse [AGENTS.md → Local Android build](AGENTS.md) ile gradle

### Onboarding & engagement
- [ ] **Smart reminder mesaj kalitesi**
  - `src/utils/smartReminders.ts` — motivasyon-aware mesajlar, 24h yenileme
  - A/B test edilebilir mi? Hangi mesaj en yüksek retention veriyor — Sentry breadcrumb'lara bak

- [ ] **First Lesson Confetti'yi ders #1 sonrası boost'la**
  - Misafir kullanıcılar 1. dersi bitirince ekstra kutlama → conversion booster

### Premium / IAP
- [ ] **3-day free trial UI metni doğru mu**
  - PaywallModal + PremiumPlansCard + Shop ekranında consistent mi
  - "3 gün ücretsiz dene" vs "3 gün ücretsiz" — net dilde olsun

---

## 🟢 Düşük öncelik / polish

- [ ] **`expo-av` → `expo-audio` migration**
  - SDK 55'te `expo-av` kaldırılacak. Şu an deprecation warning ignore edilmiş ([app/_layout.tsx:64-69](app/_layout.tsx:64))
  - `src/utils/sounds.ts` + `app/_layout.tsx`'teki `Audio.setAudioModeAsync` migrate edilecek
  - SDK 55'e geçmeden ÖNCE yapılmalı

- [ ] **Lottie animasyonları**
  - `lottie-react-native` kurulu ama kullanılmıyor — başarım açılış / ünite tamamlama animasyonları için kullanılabilir

- [ ] **MatchPairs egzersizi UI**
  - Type tanımı var, lesson screen render etmiyor (`isSupportedExercise` ile atlanıyor)
  - İçerikte de kullanılmıyor — ya tip tanımını kaldır ya UI ekle

- [ ] **Real STT (sesten metne)**
  - SpeakExercise şu an mikrofon kaydı sonrası hedef metni kademeli yazıyor (simülasyon)
  - `@jamsch/expo-speech-recognition` kurulu, gerçek STT entegre edilebilir

- [ ] **Hardcoded renk temizliği**
  - Bazı bileşenlerde hâlâ `#58CC02`, `#FF4B4B` gibi hardcoded renkler var
  - Tema sistemine taşı (`useThemeColors()`)

- [ ] **Test eksikliği**
  - Hiç unit test yok. Kritik mantık (isAnswerCorrect, sync merge, secureStore lazy load) için Jest setup'ı kurulabilir

---

## ⚙️ Teknik borç

- [ ] **İki paralel lesson tracking sistemi** *(post-launch'a ertelendi 2026-05-26)*
  - `lessonExerciseProgress` (eski) + `lessonProgress` (yeni queue tabanlı)
  - Aktif olan: `lessonProgress`. Eski'yi temizle ya da rolünü netleştir.
  - **Karar:** Release öncesi riskli — production'a çıktıktan sonra ele al, migration yaz

- [ ] **`KURULUM.md` ve `README_UYGULAMA.md` eski**
  - İlk kuruluş dönemine ait, mevcut mimariyle uyumsuz
  - Silinebilir veya `docs/archive/` altına taşınabilir

- [ ] **`VOGEL_HANDOFF.md` güncellenmeli ya da silinmeli**
  - Eski A1-only dönemine ait handoff
  - Artık CLAUDE.md + AGENTS.md + TODO.md var, bu redundant

- [ ] **`App Start Span could not be finished` uyarısı**
  - Sentry wrap'in init'i bekledikten sonra çalışması için init senkron olmalı
  - Şu an `Sentry.init` async durmuş gibi davranıyor — kontrol et

- [ ] **TypeScript strict tam kapsama**
  - `tsconfig.json`'da `strict: true` ama bazı yerlerde `any` izleri olabilir
  - `npx tsc --noEmit` çalıştır, raporla

---

## 📝 Açık kararlar

- [ ] **Play Store family plan handling**
  - iOS'ta Apple Family Sharing var. Android'de aile planı nasıl distribute edilecek? (Play Console family library?)

- [ ] **Cross-device sync vs cihaz-bazlı onboarding**
  - Şu an onboarding cihaz-bazlı. Bir kullanıcı 2 cihazda farklı motivation/goal seçerse hangisi kazanır?
  - Kararı dokümante et.

- [ ] **EAS quota dolduğunda iOS'a etkisi**
  - iOS Codemagic'te, etki yok ama belge ekle (AGENTS.md'de var ama yorum gerekebilir)

---

## ✅ Yakın zamanda tamamlananlar (referans için)

- ✅ **TestFlight build f341b31 cihazda test edildi — crash yok** (2026-05-26)
- ✅ **Privacy Policy app içi entegrasyonu tamamlandı** — privacy-policy.tsx + Settings link + ASC URL (2026-05-26)
- ✅ **App Store Connect IAP onayı — 3 ürün de onaylı** (monthly/yearly/family) (2026-05-26)
- ✅ **expo-secure-store SDK 54 uyumsuzluğu crash fix** (f341b31, 2026-05-26)
- ✅ **Cihaz-bağlı onboarding bypass** — secureStore ile (c9f921e)
- ✅ **Sync race condition fix** — logout'ta upload timer iptal (12d776d)
- ✅ **2 misafir ders + zorunlu login (Duolingo paterni)** (a2fe2c1)
- ✅ **Firebase auth + cross-device sync + Goethe/TELC exam sistemi** (86f68d3)
- ✅ **Sentry source map upload + AGENTS.md signing docs** (f94cc8b)
- ✅ **Apple Review test account bypass** (70f1f1e)

---

> Sürekli güncellenir. Yeni bug/iş çıkarsa yukarıya ekle, biten/iptal olanları "Tamamlananlar"a taşı.
