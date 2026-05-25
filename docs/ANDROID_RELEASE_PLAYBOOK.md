# Android Release Playbook — Play Store

İlk Play Store yayını için sıfırdan adım adım rehber. Keystore üret → Codemagic'e bağla → Play Console aç → AAB yükle.

> **Önkoşullar**
> - Java 17 (keystore üretmek için lokal `keytool` lazım — Android Studio kuruluysa zaten var)
> - Google Play Developer hesabı (henüz açılmadıysa adım 5)
> - `docs/STORE_LISTING.md` hazır — metadata oradan

---

## 1. Production Keystore Oluştur

Vogel klasöründe terminal aç:

```bash
cd C:\Users\i9pc\Documents\Vogel

keytool -genkey -v -keystore vogel-release.keystore \
  -alias vogel-release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype JKS
```

PowerShell'de backslash yerine backtick (`) ile çok satır kullan:

```powershell
keytool -genkey -v -keystore vogel-release.keystore `
  -alias vogel-release `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storetype JKS
```

### Sorulara yanıt
| Soru | Cevap |
|---|---|
| Enter keystore password | **Çok güçlü bir şifre seç** (en az 16 karakter, kaydet) |
| Re-enter password | aynısı |
| What is your first and last name? | Samet TERME |
| Organizational unit | Vogel |
| Organization | yenipc002 |
| City or Locality | (kendi şehrin) |
| State or Province | (kendi ilin) |
| Country code (XX) | TR |
| Is CN=Samet TERME, OU=Vogel, ... correct? | yes |
| Enter key password for <vogel-release> | **Enter** (store şifresiyle aynı olsun) |

Çıktı: `vogel-release.keystore` dosyası proje kökünde.

### KEYSTORE'U KAYBETME — KESİN YEDEKLE

Bu keystore'u kaybedersen Play Store'a aynı app'in yeni versiyonunu yükleyemezsin (yeni app olarak başlamak zorunda kalırsın). 3 yerde yedekle:

1. **Şifre yöneticisi** (1Password / Bitwarden / Apple Keychain) — keystore dosyasını + şifresini birlikte
2. **USB stick** — fiziksel yedek, evdeki bir kasada
3. **Email** (sadece kendine, encrypted) — `vogel-release.keystore` attach + şifre ayrı

---

## 2. SHA-1 ve SHA-256 Fingerprint'leri Al

```bash
keytool -list -v -keystore vogel-release.keystore -alias vogel-release
```

Şifre gir. Çıktıda şu blok olacak:

```
Certificate fingerprints:
         SHA1: AB:CD:EF:01:23:45:...
         SHA256: 01:23:45:67:89:AB:...
```

**Her ikisini de kopyala — bir sonraki adımda Firebase'e eklenecek.**

---

## 3. Firebase'e Yeni SHA'ları Ekle

Firebase Console → vogel-3e071 → Project Settings → "Your apps" → Vogel Android (`com.yenipc002.Vogel`) → SHA certificate fingerprints → **Add fingerprint**

- SHA-1: yukarıdan kopyala
- "Add fingerprint" → tekrar bas
- SHA-256: yukarıdan kopyala

> ⚠️ **Debug keystore SHA-1'ini SİLME** — local test build'ler hala debug keystore kullanır. Production fingerprint'i SİL değil EKLE.

Firebase yeni `google-services.json` üretir → **Download** → `android/app/google-services.json` olarak indir (Codemagic build'inden önce repo'da olmalı veya env var olarak inject edilmeli).

---

## 4. Keystore'u Base64'e Çevir + Codemagic'e Yükle

Codemagic'in Linux instance'ı keystore dosyasını base64 string olarak alır.

### Encode

**macOS / Linux:**
```bash
base64 -i vogel-release.keystore > vogel-keystore.base64.txt
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("vogel-release.keystore")) | Out-File -Encoding ASCII vogel-keystore.base64.txt
```

`vogel-keystore.base64.txt` içeriğini kopyala (tek satır, çok uzun bir string).

### Codemagic Environment Variable Group

Codemagic → Teams → Personal → Environment variables → **Add group** → İsim: `android_credentials`

Aşağıdaki 4 variable'ı ekle (hepsi **Secure ✅**):

| Variable | Value | Secure |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | (base64 string'in tamamı) | ✅ |
| `ANDROID_KEYSTORE_PASSWORD` | keystore şifren | ✅ |
| `ANDROID_KEY_ALIAS` | `vogel-release` | ✅ |
| `ANDROID_KEY_PASSWORD` | key şifren (genelde store şifresiyle aynı) | ✅ |

Save group → `codemagic.yaml` zaten bu grubu reference ediyor.

### Local dosyaları temizle

```bash
# Base64 dosyasını GİT'E COMMIT ETME
del vogel-keystore.base64.txt
# Keystore'u repo'ya commit etme (zaten .gitignore'da)
```

---

## 5. Google Play Developer Hesabı Aç

https://play.google.com/console/signup → $25 + kimlik doğrulama (pasaport veya ehliyet fotoğrafı). 1-3 iş günü sürer.

Hesap açıldıktan sonra → Console → **Create app**.

---

## 6. Play Console'da App Oluştur

| Alan | Değer |
|---|---|
| App name | Vogel: Almanca Dersler |
| Default language | Turkish (tr-TR) |
| App or game | App |
| Free or paid | Free (with in-app purchases) |
| Declarations | tüm kutucukları işaretle (developer programs policies + US export laws) |

Create app → sol panelde adım listesi çıkar.

---

## 7. App Content (Policy bölümü)

Play Console → Policy → App content

### 7a. Privacy Policy
- URL: `https://samettrm.github.io/Vogel/privacy.html`
- Save

### 7b. App Access (test account)
- "All or some functionality is restricted" seçimi YES
- Test credentials ekle:
  - **Username:** `apple-reviewer@vogel-app.com` (iOS ile aynı)
  - **Password:** `VogelReview2026!`
  - **Notes:** "Login is required to access lessons. Use these credentials. Premium features (Goethe/TELC exam modules) require subscription but A1 free lessons are accessible without subscription."

### 7c. Ads
- Contains ads: **No**

### 7d. Content rating
- Bölüm 8'e bak (alt başlık)

### 7e. Target audience
- Target age: **18+** (genç öğrenciler de kullanabilir ama Play'in Designed for Families track'inden çıkmak için 18+ seç)
- Appeals to children: **No**

### 7f. News app
- Is this a news app? **No**

### 7g. COVID-19 contact tracing
- **No**

### 7h. Data safety
- Bölüm 9'a bak (detaylı, ayrı tablo)

### 7i. Government apps
- **No**

### 7j. Financial features
- **No**

### 7k. Health
- **No**

---

## 8. Content Rating

Play Console → Policy → App content → Content rating → Start questionnaire

### Email
- Developer email: `bsdigitalapp@gmail.com` (veya kendi email'in)
- Confirm email

### Category
- Reference, News, or Educational → **Educational**

### Questionnaire (tümüne **No**)
- Violence: **No**
- Sexuality: **No**
- Language: **No**
- Controlled substance: **No**
- Gambling: **No**
- User-generated content: **No**
- Sharing user location: **No**
- Personal info collection: **YES** (email, user ID)
- Web browsing access: **No**
- Digital purchases: **YES** (RevenueCat subscriptions)

**Result:** Everyone (3+)

---

## 9. Data Safety Form

Play Console → Policy → App content → Data safety

`docs/PLAY_DATA_SAFETY_QUICK.md` dosyasında tablo halinde tam cevaplar var. Özet:

### Data collection and security
- **Does your app collect or share any of the required user data types?** YES
- **Is all user data collected by your app encrypted in transit?** YES
- **Do you provide a way for users to request their data deletion?** YES

### Data types collected (her biri için "purpose" seç)
- **Personal info → Email address** — Required, Account management
- **Personal info → User IDs** — Required, Account management + Analytics
- **App activity → App interactions** — Optional, Analytics
- **App info and performance → Crash logs** — Optional, Analytics + App functionality
- **App info and performance → Diagnostics** — Optional, Analytics
- **Financial info → Purchase history** — Required, Account management (RevenueCat)

### Security practices
- Data encrypted in transit: **YES**
- Users can request data deletion: **YES**
  - Where: in-app + email (`bsdigitalapp@gmail.com`)
- Committed to Play Families Policy: **No** (target 18+)
- Independent security review: **No**

---

## 10. Store Listing

Play Console → Store presence → Main store listing

Tüm metinler `docs/STORE_LISTING.md` → Google Play Console bölümünde hazır.

Doldurulacak alanlar (TR primary, EN secondary):
- App name (30 char)
- Short description (80 char)
- Full description (4000 char)
- App icon (512×512 PNG)
- Feature graphic (1024×500 PNG)
- Phone screenshots (en az 2, max 8 — 1080×1920 önerilir)
- 7-inch tablet screenshots (opsiyonel ama önerilir)
- 10-inch tablet screenshots (opsiyonel)
- App category: Education
- Tags: Language Learning, Education, Reference
- Contact email: `bsdigitalapp@gmail.com`
- Website (opsiyonel): `https://samettrm.github.io/Vogel`
- Privacy policy: `https://samettrm.github.io/Vogel/privacy.html`

---

## 11. AAB Build Al

### Codemagic ile (önerilen)
1. Codemagic dashboard → Vogel project → `android-production` workflow → **Start new build**
2. ~25 dk sonra `app-release.aab` artifact'ı email'e gelir + Codemagic UI'ında download butonu

### Local fallback (Codemagic patlarsa)
```powershell
cd C:\Users\i9pc\Documents\Vogel
npx expo prebuild --platform android --clean

# Keystore'u android/app/'a kopyala
copy vogel-release.keystore android\app\vogel-release.keystore

# gradle.properties'e signing config ekle
@"
VOGEL_RELEASE_STORE_FILE=vogel-release.keystore
VOGEL_RELEASE_STORE_PASSWORD=<keystore-sifresi>
VOGEL_RELEASE_KEY_ALIAS=vogel-release
VOGEL_RELEASE_KEY_PASSWORD=<key-sifresi>
"@ | Out-File -Append -Encoding ASCII android\gradle.properties

# Signing patch (scripts/patch-android-signing.sh'ı git-bash ile çalıştır)
bash scripts/patch-android-signing.sh

# Build
cd android
./gradlew bundleRelease
# Çıktı: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 12. Internal Testing Track'e Yükle

Play Console → Testing → Internal testing → **Create new release**

1. App bundle upload: `app-release.aab`
2. Release name: `1.0.2 (versionCode 1)`
3. Release notes (her dilde — STORE_LISTING.md → What's New)
4. Save → Review release → **Start rollout to Internal testing**

### Tester ekle
- Internal testing → Testers → Create email list
- Liste: `internal-testers` → kendi email'ini, 2-3 arkadaş email'ini ekle (max 100)
- Save changes → opt-in link'i Play'in gönderdiği email'den al

### Test süresi
- En az 7 gün gerçek kullanım — bug varsa düzelt, version artır, yeni AAB upload
- Crash yoksa adım 13'e geç

---

## 13. Production'a Promote

Play Console → Testing → Internal testing → release seç → **Promote release → Production**

veya direkt Production → Create new release → AAB upload

### Rollout strategy
- **Staged rollout:** %10 → 24 saat bekle → %25 → %50 → %100
- ANR/crash spike olursa Play otomatik durdurur (Vitals → Bad behavior)

### Submit
Review release → Start rollout to Production → **Production** track'inde "In review" status'ü → 1-7 gün

---

## 14. Submit Sonrası

| Status | Anlamı |
|---|---|
| In review | Google manuel inceliyor (1-7 gün) |
| Rejected | Policy reason'ı Play Console → Inbox'ta — fix + resubmit |
| Pending publication | Onaylandı, dakikalar içinde Play Store'da görünür |
| Published | Canlı |

İlk yayın sonrası **Vitals** sekmesini takip et — crash rate %1'in altında olmalı.
