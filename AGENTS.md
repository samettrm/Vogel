# Vogel — Claude Agent Protokolü

Bu dosya, bu repoda Claude ile çalışırken kullanılan "çıktı al" otomasyon
protokolünü tanımlar. Yeni bir Claude oturumu açıldığında bu dosyayı oku ve
aşağıdaki komutları aynen uygula.

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

> ⚠️ **Geçici durum:** Play Store onayı incelemede olduğu için şimdilik APK.
> Onay gelince:
> 1. `eas.json` → `build.production.android.buildType` → `"app-bundle"` (geri al)
> 2. `eas.json` → `submit.production.android` bloğunu doldur (serviceAccountKeyPath, track: "internal", releaseStatus: "completed" vb.)
> 3. `google-service-account.json`'u proje köküne koy (gitignore'da olsun)
> 4. Bu dosyada "çıktı al android" komutuna `--auto-submit` flag'ini geri ekle
> 5. Lexora ile aynı anda yap

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
