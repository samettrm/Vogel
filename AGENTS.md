# Vogel — Claude Agent Protokolü

Bu dosya, bu repoda Claude ile çalışırken kullanılan "çıktı al" otomasyon
protokolünü tanımlar. Yeni bir Claude oturumu açıldığında bu dosyayı oku ve
aşağıdaki komutları aynen uygula.

---

## 📁 Repo & SDK konumları

### 💻 Laptop (avbus)
- Repo:          `D:\Vogel`
- JDK 17:        `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`
- Android SDK:   `D:\Android\Sdk`
- Gradle cache:  `D:\Android\gradle-cache`
- APK output:    `D:\Android\`

### 🖥️ Desktop (i9pc) — 2026-05-24'ten itibaren
- Repo:          `C:\Users\i9pc\Documents\Vogel`
- JDK 17:        `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`
- Android SDK:   `C:\Android\Sdk`
- Gradle cache:  `C:\Android\gradle-cache`
- APK output:    `C:\Android\`

Env vars User scope'ta kalıcı set (JAVA_HOME, ANDROID_HOME, ANDROID_SDK_ROOT,
GRADLE_USER_HOME, PATH). Lexora ile paylaşımlı.

> Bash sandbox cwd'si farklı gösterebilir — her zaman mevcut makinenin absolute
> path'ini kullan.

---

## 📦 Komut tablosu

| Komut | Ne yapar |
|---|---|
| **`çıktı al ios`** | git commit (varsa) + push + iOS production build + TestFlight'a auto-submit |
| **`çıktı al android`** | git commit (varsa) + push + Android **APK** build (sideload için, submit YOK) |
| **`çıktı al`** (yalın) | "iOS mu Android mı?" diye sor |

---

## 🔄 "çıktı al ios" akışı — Codemagic CI

> ⚠️ iOS build artık **EAS değil Codemagic** üzerinden yapılıyor.
> `codemagic.yaml` repo köküne eklendi; `main`'e her push'ta otomatik tetiklenir.

```
1. git status --porcelain   # uncommit var mı?
2. (varsa) git add -A && git commit -m "<özet mesaj>"
3. git push origin main
   → push tetikleyici: Codemagic otomatik mac_mini_m2 build başlatır
4. İzlemek için: https://codemagic.io/apps  (Vogel → ios-production)
5. Build bitti mi? Dashboard'da yeşil tik veya email (sametrme@gmail.com)
6. Sonuç: IPA otomatik TestFlight'a submit edilir
```

**Süre tahmini:** ~20-30 dk build + ~5-10 dk Apple işleme → toplam ~35 dk.

**Build numarası:** Codemagic `BUILD_NUMBER + 100` offset kullanır (EAS ile
çakışmayı önlemek için). EAS build #7 → Codemagic build #1 = iOS build 101.

**Sonuç:** TestFlight "İç Testçiler" grubuna otomatik dağılır.

**Codemagic hesap bilgisi:**
- URL: https://codemagic.io
- Bağlı GitHub hesabı: sametrme@gmail.com
- App Store Connect entegrasyonu adı: `Vogel_ASC`
- Workflow adı: `ios-production`

---

## 🔄 "çıktı al android" akışı

```bash
1. git status --porcelain
2. (varsa) git add -A && git commit -m "<özet mesaj>"
3. git push origin main
4. eas build --platform android --profile production --non-interactive
   → background'da çalıştır
5. Build bittiğinde APK URL'sini kullanıcıya ver
```

**Süre tahmini:** ~15-25 dk build → APK URL.

**Sonuç:** APK indirilir, telefona sideload ile kurulur (Play Store değil).

> ⚠️ **EAS QUOTA UYARISI:** 2026-05 sonunda Free tier Android quota'sı doldu.
> **Reset tarihi: 2026-06-01.** Tarih bu tarihten önceyse EAS cloud'da `eas build`
> hata verir ("monthly limit exhausted"). O durumda **acil durum yedeği** olarak
> aşağıdaki "🔧 Local build" akışını kullan.

> ⚠️ **Play Store onayı durumu:** Play onayı incelemede olduğu için şimdilik APK.
> Onay gelince:
> 1. `eas.json` → `build.production.android.buildType` → `"app-bundle"` (geri al)
> 2. `eas.json` → `submit.production.android` bloğunu doldur (serviceAccountKeyPath, track: "internal", releaseStatus: "completed" vb.)
> 3. `google-service-account.json`'u proje köküne koy (gitignore'da olsun)
> 4. Bu dosyada "çıktı al android" komutuna `--auto-submit` flag'ini geri ekle
> 5. Lexora ile aynı anda yap

---

## 🔧 Local Android build — sadece EAS quota dolduğunda

EAS quota'sı dolu olduğunda APK'yi Windows'ta direkt gradle ile üret.

### Laptop (D: sürücü)

```powershell
Set-Location "D:\Vogel"
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
$env:ANDROID_HOME = 'D:\Android\Sdk'
$env:ANDROID_SDK_ROOT = 'D:\Android\Sdk'
$env:GRADLE_USER_HOME = 'D:\Android\gradle-cache'
$env:GRADLE_OPTS = '-Xmx4g -XX:MaxMetaspaceSize=1g'
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:SENTRY_DISABLE_AUTO_UPLOAD = 'true'
$env:SENTRY_ALLOW_FAILURE = 'true'

npx expo prebuild --platform android --clean
Set-Location "D:\Vogel\android"
.\gradlew.bat assembleDebug 2>&1 | Out-File "D:\Android\build.log" -Encoding utf8
Copy-Item "D:\Vogel\android\app\build\outputs\apk\debug\app-debug.apk" "D:\Android\Vogel-debug.apk" -Force
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

**APK çıktı:** `D:\Android\Vogel-debug.apk`

### Desktop (C: sürücü)

```powershell
Set-Location "C:\Users\i9pc\Documents\Vogel"
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
$env:ANDROID_HOME = 'C:\Android\Sdk'
$env:ANDROID_SDK_ROOT = 'C:\Android\Sdk'
$env:GRADLE_USER_HOME = 'C:\Android\gradle-cache'
$env:GRADLE_OPTS = '-Xmx4g -XX:MaxMetaspaceSize=1g'
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:SENTRY_DISABLE_AUTO_UPLOAD = 'true'
$env:SENTRY_ALLOW_FAILURE = 'true'

npx expo prebuild --platform android --clean
Set-Location "C:\Users\i9pc\Documents\Vogel\android"
.\gradlew.bat assembleDebug 2>&1 | Out-File "C:\Android\build.log" -Encoding utf8
Copy-Item "C:\Users\i9pc\Documents\Vogel\android\app\build\outputs\apk\debug\app-debug.apk" "C:\Android\Vogel-debug.apk" -Force
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

**APK çıktı:** `C:\Android\Vogel-debug.apk`

---

**Süre:** İlk build ~30-40 dk (cache boşken), sonraki ~5-15 dk. ~190 MB.
Play Store'a yüklenmez ama sideload (Drive/USB/adb) ile telefona kurulur.

**Hata kovalama:**
- Sentry "Auth token required" → env vars yukarıdaki gibi set olmamış demek
- Gradle "out of memory" → `GRADLE_OPTS` heap artır
- Output pipeline buffer overflow → asla `Select-Object -Last N` ile gradle output
  pipe'lama; her zaman `Out-File`'la dosyaya yaz, sonra `Get-Content -Tail`
- CMake eksik hatası → `& "C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat" "cmake;3.22.1"`

---

## ⚙️ Setup şartları (zaten ayarlı, kontrol için)

### EAS (Android)
| Şart | Yer | Olması gereken |
|---|---|---|
| Apple ID | `eas.json` → submit.production.ios.appleId | `sametrme@gmail.com` |
| Auto-increment | `eas.json` → build.production.autoIncrement | `true` |
| ASC App ID | `eas.json` → submit.production.ios.ascAppId | `6771534635` |
| Encryption | `app.json` → ios.infoPlist.ITSAppUsesNonExemptEncryption | `false` |
| Android build type | `eas.json` → build.production.android.buildType | **`"apk"` (geçici)** |

### Codemagic (iOS)
| Şart | Yer | Olması gereken |
|---|---|---|
| Workflow | `codemagic.yaml` | Repo kökünde mevcut |
| Tetikleyici | push to `main` | Otomatik |
| Signing | **Lexora ile paylaşımlı cert** — `IOS_DIST_PRIVATE_KEY` env var | `appstore_credentials` grubunda, Codemagic → Vogel → Env vars (Lexora ile **aynı PEM**) |
| ASC API Key | `appstore_credentials` grubu | APP_STORE_CONNECT_PRIVATE_KEY + KEY_IDENTIFIER (C4Z2AK6JRF) + ISSUER_ID |
| Firebase / RC / Google env vars | `codemagic.yaml` → `environment.vars` | `EXPO_PUBLIC_*` değerleri inline (commit'lidir, public bundle'a embed olur) |
| `--create` flag | `codemagic.yaml` | **KALDIRILDI** — paylaşımlı cert zaten Apple'da kayıtlı |

> ⚠️ **ÖNEMLİ:** `codemagic.yaml`'a asla `ios_signing:` bloğu ekleme!
> Bu blok Codemagic'in pre-build profile check'ini tetikler → "No matching profiles" hatası.
> Signing tamamen script adımlarında `app-store-connect fetch-signing-files --certificate-key "@env:IOS_DIST_PRIVATE_KEY"` ile yapılıyor (--create flag YOK).

---

## 🍎 Apple bilgisi

```
Apple ID:        sametrme@gmail.com
Apple Team ID:   7Q6ZYGVH67 (Samet TERME - Individual)
Provider ID:     128933404
Bundle ID:       com.yenipc002.Vogel
ASC App ID:      6771534635
ASC API Key ID:  C4Z2AK6JRF (Admin — Codemagic APP_STORE_CONNECT_KEY_IDENTIFIER)
```

**Distribution cert durumu (2026-05, güncel):**
- Apple hesabında **1 adet aktif iOS Distribution cert** (Lexora ile **ORTAK**, expires 2027/05/20)
- Codemagic Vogel'in `IOS_DIST_PRIVATE_KEY` env var'ı = Lexora'nın PEM'iyle **AYNI**
- Yeni cert oluşturulmuyor — `fetch-signing-files` mevcut cert'i bulup kullanıyor
- Eski iki Distribution cert'i (`vogel_dist_key.pem` dahil) **revoke edildi** — Apple cert limit'i temizlendi

**Cert kaybolursa yapılacaklar:**
1. Apple Developer → eski cert'i revoke et (boş slot açmak için)
2. Lexora ile aynı PEM'i tekrar oluştur veya Codemagic'in `--create` flag'i ile yeniden ürettir
3. `IOS_DIST_PRIVATE_KEY` env var'ını her iki projede güncelle (Vogel + Lexora)

Apple cred'ler keychain'de cache'lendi, build sırasında sormaz.

---

## ❌ YAPMA

- `--non-interactive` flag'ini çıkarma → terminalde takılır
- Android'e şu an `--auto-submit` ekleme → submit config eksik, hata verir
- buildNumber'ı manuel artırma → Codemagic `app-store-connect get-latest-build-number` ile otomatik artırıyor
- Aynı build'i tekrar submit etme → "Build already submitted" hatası
- iOS için `eas build --platform ios` çalıştırma → iOS Codemagic'e geçti, EAS quota'yı boşa harcar
- `codemagic.yaml`'a `ios_signing:` bloğu ekleme → "No matching profiles found" hatası (13 build bu yüzden başarısız oldu!)
- `codemagic.yaml`'a `--create` flag'i geri ekleme → Apple "409 cert limit dolu" döner (paylaşımlı cert zaten var)
- Vogel'in `IOS_DIST_PRIVATE_KEY` env var'ını Lexora'nınkinden FARKLI bir değerle değiştirme → eski yanlış senaryo; artık her ikisi de **aynı PEM** olmalı (paylaşımlı cert)
- `EXPO_PUBLIC_*` env vars'ları sadece `.env`'e koyma → Codemagic .env'i okumaz! `codemagic.yaml > environment.vars` içine de inline ekle
