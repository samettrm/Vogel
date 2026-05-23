# Vogel — Claude Agent Protokolü

Bu dosya, bu repoda Claude ile çalışırken kullanılan "çıktı al" otomasyon
protokolünü tanımlar. Yeni bir Claude oturumu açıldığında bu dosyayı oku ve
aşağıdaki komutları aynen uygula.

---

## 📁 Repo konumu (KRİTİK)

**Repo `D:\Vogel`'de.** Eski `C:\Users\avbus\Documents\Vogel` yolu artık geçersiz
(disk yer açmak için 2026-05-23'te D:'ye taşındı). Tüm komutlarda absolute path
`D:\Vogel` kullan veya `Set-Location D:\Vogel` ile başla. Bash sandbox cwd'si
hala C: gösterebilir, takma.

Paylaşımlı tool yolları:
- JDK 17:           `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`
- Android SDK:      `D:\Android\Sdk`
- Gradle cache:     `D:\Android\gradle-cache`
- APK output:       `D:\Android\` (Vogel-debug.apk, Vogel.apk vb.)

Env vars User scope'ta kalıcı set (JAVA_HOME, ANDROID_HOME, ANDROID_SDK_ROOT,
GRADLE_USER_HOME, PATH). Lexora ile paylaşımlı.

---

## 📦 Komut tablosu

| Komut | Ne yapar |
|---|---|
| **`çıktı al ios`** | git commit (varsa) + push + iOS production build + TestFlight'a auto-submit |
| **`çıktı al android`** | git commit (varsa) + push + Android **APK** build (sideload için, submit YOK) |
| **`çıktı al`** (yalın) | "iOS mu Android mı?" diye sor |

---

## 🔄 "çıktı al ios" akışı

```bash
1. git status --porcelain   # uncommit var mı?
2. (varsa) git add . && git commit -m "<özet mesaj>"
3. git push origin main
4. eas build --platform ios --profile production --auto-submit --non-interactive
   → background'da çalıştır (run_in_background: true)
5. Build bittiğinde output dosyasını oku, kullanıcıya raporla
```

**Süre tahmini:** ~15-25 dk build + ~5-10 dk Apple processing → toplam ~30 dk.

**Sonuç:** TestFlight "İç Testçiler" grubuna otomatik dağılır.

---

## 🔄 "çıktı al android" akışı

```bash
1. git status --porcelain
2. (varsa) git add . && git commit -m "<özet mesaj>"
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
Sonuç: `D:\Android\Vogel-debug.apk` — sideload için yeterli.

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

# android/ klasörü yoksa veya kirliyse:
npx expo prebuild --platform android --clean

Set-Location "D:\Vogel\android"
.\gradlew.bat assembleDebug 2>&1 | Out-File "D:\Android\build.log" -Encoding utf8

# Sonuç:
Copy-Item "D:\Vogel\android\app\build\outputs\apk\debug\app-debug.apk" `
          "D:\Android\Vogel-debug.apk" -Force

# Build sonrası daemon'u kapat (RAM/disk rahatlasın):
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Süre:** İlk build ~30-40 dk (cache boşken), sonraki ~5-15 dk.

**APK:** `D:\Android\Vogel-debug.apk`, debug-signed, ~190 MB. Play Store'a
yüklenmez ama sideload (Drive/USB/adb) ile telefona kurulur.

**Hata kovalama:**
- Sentry "Auth token required" → env vars yukarıdaki gibi set olmamış demek
- Gradle "out of memory" → `GRADLE_OPTS` heap artır
- Output pipeline buffer overflow → asla `Select-Object -Last N` ile gradle output
  pipe'lama; her zaman `Out-File`'la dosyaya yaz, sonra `Get-Content -Tail`
- C: diskine yazıyor sanısı → cwd `D:\Vogel`'de mi kontrol et

---

## ⚙️ Setup şartları (zaten ayarlı, kontrol için)

| Şart | Yer | Olması gereken |
|---|---|---|
| Apple ID | `eas.json` → submit.production.ios.appleId | `sametrme@gmail.com` |
| Auto-increment | `eas.json` → build.production.autoIncrement | `true` |
| ASC App ID | `eas.json` → submit.production.ios.ascAppId | `6771534635` |
| Encryption | `app.json` → ios.infoPlist.ITSAppUsesNonExemptEncryption | `false` |
| Android build type | `eas.json` → build.production.android.buildType | **`"apk"` (geçici)** |

---

## 🍎 Apple bilgisi

```
Apple ID:        sametrme@gmail.com
Apple Team ID:   7Q6ZYGVH67 (Samet TERME - Individual)
Provider ID:     128933404
Dist cert ID:    6CV56NRC3X (2027-05'e kadar, Lexora ile ortak)
Bundle ID:       com.yenipc002.Vogel
ASC App ID:      6771534635
```

Apple cred'ler keychain'de cache'lendi, build sırasında sormaz.

---

## ❌ YAPMA

- `--non-interactive` flag'ini çıkarma → terminalde takılır
- Android'e şu an `--auto-submit` ekleme → submit config eksik, hata verir
- buildNumber'ı manuel artırma → autoIncrement yapıyor
- Aynı build'i tekrar submit etme → "Build already submitted" hatası
