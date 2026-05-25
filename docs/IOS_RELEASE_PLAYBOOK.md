# iOS Release Playbook — App Store Connect

App Store Connect'te 1.0.2 versiyonu submit etmek için adım adım rehber. Her alan tam ne yazılacak/seçilecek burada.

> **Önkoşullar**
> - Build TestFlight'a yüklü mü? → Codemagic `ios-production` workflow tetiklendi mi?
> - Privacy Policy URL erişilebilir mi? → https://samettrm.github.io/Vogel/privacy.html
> - `docs/STORE_LISTING.md` hazır mı? → metadata'ları oradan kopyalayacaksın

---

## 1. App Privacy Form (EN KRİTİK)

App Store Connect → Vogel → App Privacy → Get Started

Yanlış doldurulursa Apple reject eder. Vogel'in topladığı data kategorileri ve doğru cevaplar aşağıda.

### Contact Info → Email Addresses
- **Do you or your third-party partners collect this data?** YES
- **Is this data linked to the user's identity?** YES
- **Is this data used for tracking?** NO
- **Purposes:**
  - App Functionality (account creation, password recovery)
  - Product Personalization

### Identifiers → User ID
- **Do you collect?** YES (Firebase UID)
- **Linked to user?** YES
- **Used for tracking?** NO
- **Purposes:**
  - App Functionality

### Usage Data → Product Interaction
- **Do you collect?** YES (Firebase Analytics + Sentry breadcrumbs)
- **Linked to user?** YES
- **Used for tracking?** NO
- **Purposes:**
  - Analytics
  - App Functionality

### Diagnostics → Crash Data
- **Do you collect?** YES (Sentry)
- **Linked to user?** NO (anonymized)
- **Used for tracking?** NO
- **Purposes:**
  - App Functionality
  - Analytics

### Diagnostics → Performance Data
- **Do you collect?** YES (Sentry performance monitoring)
- **Linked to user?** NO
- **Used for tracking?** NO
- **Purposes:**
  - App Functionality
  - Analytics

### Purchases → Purchase History
- **Do you collect?** YES (RevenueCat)
- **Linked to user?** YES
- **Used for tracking?** NO
- **Purposes:**
  - App Functionality

### Diğer kategoriler (toplamıyoruz)
- Location → **NO**
- Health & Fitness → **NO**
- Financial Info → **NO**
- Contacts → **NO**
- User Content → **NO** (kullanıcı not/içerik üretmiyor)
- Browsing History → **NO**
- Search History → **NO**
- Sensitive Info → **NO**
- Audio Data → **NO** (mikrofon kullanılır ama ses kaydedilmez/iletilmez — on-device speech recognition)

---

## 2. Age Rating Questionnaire

App Store Connect → App Information → Age Rating → Edit

| Soru | Cevap |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Sexual Content or Nudity | None |
| Graphic Sexual Content and Nudity | None |
| Profanity or Crude Humor | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Mature/Suggestive Themes | None |
| Simulated Gambling | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Contests | None |
| Unrestricted Web Access | None |
| Gambling and Contests | None |
| **Made for Kids** | **No** (4+ ama "Made for Kids" track'i değil) |
| **In-App Purchases** | **Yes** |

**Sonuç:** Age 4+

---

## 3. App Review Information

App Store Connect → Vogel → 1.0.2 → App Review Information

### Test Account (App Review için ZORUNLU — Sign in zorunlu app'ler için)

**ÖNCE Firebase'de account oluştur:**
1. Firebase Console → vogel-3e071 → Authentication → Users → Add user
2. Email: `apple-reviewer@vogel-app.com`
3. Password: `VogelReview2026!`
4. Save → kullanıcıyı listede gör → 3 nokta → Email verified: YES

**SONRA App Review Information bölümünü doldur:**

**Sign-in required:** ✅ YES

**Username:**
```
apple-reviewer@vogel-app.com
```

**Password:**
```
VogelReview2026!
```

**Notes for Reviewer:**
```
This app requires login. Please use the credentials above.

The app teaches German to Turkish speakers. After login, you'll
see the lesson map (CEFR levels A1 through C1). Tap any unlocked
lesson node to start practicing.

Premium features (Goethe/TELC exam prep modules, unlimited hearts,
Sprechen speaking modules) require subscription, but you can fully
test free lessons (A1 level, first 6 units) without subscription.

For testing Sign in with Apple, please use any iCloud account.
Sign In with Apple is implemented natively (iOS 13+).

For testing Google Sign-In, please use any Google account.

Microphone permission is requested only when the user opens a
Sprechen (speaking) exercise. Speech recognition runs on-device
via Apple's Speech framework — no audio is sent to our servers.

Subscription cancellation: Users can cancel anytime via Apple ID
Settings → Subscriptions. No additional cancellation flow needed
inside the app per App Store guidelines.
```

### Contact Information

- **First Name:** Samet
- **Last Name:** TERME
- **Phone Number:** (kendi telefonun, ülke koduyla: +90...)
- **Email:** bsdigitalapp@gmail.com (veya trsamet71@gmail.com)

---

## 4. Version Information

App Store Connect → Vogel → 1.0.2

### Localization sırası
1. Önce Turkish (Primary) ekle/güncelle — `docs/STORE_LISTING.md` → Turkish (TR) bölümü
2. Sonra English (U.S.) ekle — `docs/STORE_LISTING.md` → English bölümü

Her dil için doldurulacak alanlar:
- Name
- Subtitle
- Promotional Text
- Description
- Keywords
- Support URL
- Marketing URL (opsiyonel)
- Privacy Policy URL → https://samettrm.github.io/Vogel/privacy.html
- What's New in This Version

### Build seçimi

Pricing and Availability → Build → "+" → en son Codemagic build'i seç (versiyon 1.0.2, build number Codemagic tarafından otomatik artırılır).

---

## 5. Screenshots

### iPhone (zorunlu)
- **6.7" / 6.9" Display** (iPhone 15/16 Pro Max) — 1290 × 2796 px → **EN AZ 3 adet, max 10**
- **6.5" Display** (iPhone 11 Pro Max / XS Max) — 1284 × 2778 px → opsiyonel ama önerilir
- **5.5" Display** (iPhone 8 Plus) — 1242 × 2208 px → kullanıcı tabanı varsa

### iPad (supportsTablet: true olduğu için zorunlu)
- **13" iPad Pro (M4)** — 2064 × 2752 px → EN AZ 3 adet
- **12.9" iPad Pro (3rd-6th gen)** — 2048 × 2732 px → otomatik üretebilir

### Önerilen 6 screenshot konsepti (TR + EN versiyonları ayrı yükle)
1. Map ekranı — "A1'den C1'e öğren" başlığıyla
2. Lesson içi (multiple choice question) — "Akıllı sorular ile pratik" başlığıyla
3. Sprechen exercise — "Konuşma pratiği yap" başlığıyla
4. Sınav modu — "Goethe & TELC formatında hazırlan" başlığıyla
5. Profile / streak — "Günlük seri ile motivasyonu koru" başlığıyla
6. Premium / Paywall — "Sınırsız öğren" başlığıyla

---

## 6. In-App Purchases

App Store Connect → Vogel → Features → In-App Purchases

RevenueCat dashboard üzerinden bağlı olan IAP'ler (manuel olarak App Store Connect'te de tanımlı olmalı):

- **Vogel Premium Monthly** (auto-renewable)
- **Vogel Premium Yearly** (auto-renewable, indirimli)

Her IAP için:
- Reference Name (internal): `vogel_premium_monthly` / `vogel_premium_yearly`
- Product ID: RevenueCat'te yazdığın
- Subscription Group: "Vogel Premium" (tek grup, monthly ↔ yearly geçiş yapılsın)
- Pricing
- Localization (TR + EN): Display Name + Description
- Review screenshot: paywall ekranının screenshot'ı (ZORUNLU)

---

## 7. Submit Checklist

App Store Connect → Vogel → 1.0.2 → ekranın üstündeki sol panel adım adım:

- [ ] **App Information** — kategori, content rights doldurulu
- [ ] **Pricing and Availability** — Free, all territories
- [ ] **App Privacy** — yukarıdaki cevaplar girildi
- [ ] **Age Rating** — 4+ seçili
- [ ] **Version 1.0.2 → Build** — Codemagic build seçildi
- [ ] **Version 1.0.2 → Screenshots** — iPhone + iPad yüklü
- [ ] **Version 1.0.2 → Localization** — TR + EN tüm metinler yüklü
- [ ] **Version 1.0.2 → App Review Information** — test account + notes yazılı
- [ ] **Version 1.0.2 → Version Release** — "Manually release this version" seçili (kontrol için)

Hepsi yeşil ✓ olunca **Save → Add for Review → Submit for Review**.

---

## 8. Yaygın Reject Nedenleri (Önlem)

| Reject Nedeni | Önlem |
|---|---|
| Guideline 5.1.1 — Privacy form eksik/yanlış | Yukarıdaki App Privacy cevaplarını birebir uygula |
| Guideline 2.1 — Test account çalışmıyor | Firebase'de manuel verify et, App Review başlamadan önce login dene |
| Guideline 3.1.2 — Subscription disclosure eksik | Description'da auto-renewal + cancel info var (STORE_LISTING.md'de hazır) |
| Guideline 5.1.5 — Permission açıklaması belirsiz | `app.json` → `NSMicrophoneUsageDescription` net (Türkçe) |
| Guideline 4.0 — Design (rare) | Screenshots gerçek app görüntüleri olsun, mockup olmasın |

---

## 9. Submit Sonrası

- **Status:** "Waiting for Review" (1-3 gün) → "In Review" (12-48 saat) → "Pending Developer Release" veya "Ready for Sale"
- Manuel release seçtiysen Apple onaylayınca "Pending Developer Release" → tek tuşla yayına al
- Reject olursa: Resolution Center'da Apple'ın yorumu olur, fix'le → Reply + Submit
