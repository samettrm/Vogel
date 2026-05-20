# 📱 Vogel APK Build Kılavuzu

## Tek Seferlik Kurulum

### 1) Expo Hesabı Oluştur
- https://expo.dev/signup → ücretsiz hesap aç
- Email doğrula

### 2) EAS CLI Kur
PowerShell aç:
```powershell
npm install -g eas-cli
```

Kuruldu mu kontrol:
```powershell
eas --version
```
(Bir versiyon numarası yazmalı, örn. `eas-cli/16.0.0`)

### 3) Proje Dizinine Geç + Login
```powershell
cd C:\Users\i9pc\Documents\Vogel
eas login
```
Expo hesabıyla giriş yap (email + password).

---

## APK Build (Her seferinde)

### 4) Build Başlat
```powershell
eas build --profile preview --platform android
```

**İlk seferinde** şunları sorabilir:
- *"Project ID exists but linked to another account. Continue?"* → **Y** dersen yeni projectId oluşturur, app.json güncellenir. Eğer hesap eşleşmiyorsa bu olur.
- *"Generate new Android Keystore?"* → **Y** (Expo bunu hesabında saklar, bir daha sormaz)

Sonrası otomatik:
- Dosyalar Expo cloud'a yüklenir (~1-2 dk)
- Cloud'da build çalışır (~15-25 dk ilk seferinde, sonradan ~8-12 dk)
- Bittiğinde terminale **build URL'i** yazar:
  ```
  ✔ Build finished
  Android app: https://expo.dev/accounts/<sen>/projects/Vogel/builds/<id>
  ```

### 5) APK İndir
- URL'i tarayıcıda aç → "Install" veya "Download" butonu var
- APK'yı bilgisayara indir (örn. `Vogel-1.0.0.apk`)

### 6) Telefona Aktar (3 yöntem)

**A — USB kablo:** Telefonu PC'ye bağla → MTP modu → APK'yı `Download/` klasörüne kopyala

**B — Google Drive:** APK'yı Drive'a at → telefondan Drive uygulamasında indir

**C — WhatsApp self-chat:** Kendine WhatsApp'tan APK gönder (50MB altıysa)

### 7) Telefonda Kur
- Dosya yöneticisinden APK'ya dokun
- *"Bilinmeyen kaynaklardan yükle"* uyarısı çıkarsa → **Ayarlar'a git** → izin ver → geri dön → kur
- Uygulama "Vogel" adıyla yüklenir, icon görünür

---

## Sonraki Build'ler

Kod değişti, yeni APK lazımsa sadece bu yeter:
```powershell
cd C:\Users\i9pc\Documents\Vogel
eas build --profile preview --platform android
```

---

## Sorun Çıkarsa

### Build Fail Olursa
Build URL'sini aç, **Logs** sekmesine bak. En sık karşılaşılan hatalar:

**1. "React Compiler" hatası**
→ `app.json` aç, `experiments.reactCompiler: true` satırını `false` yap, tekrar build.

**2. "Missing icon file"**
→ `assets/images/` altında dosyalar var mı kontrol et.

**3. "Package name in use"**
→ `app.json`'daki `android.package` zaten başka birinde. Değiştir, örn. `com.samet.vogel`.

**4. "Network/timeout"**
→ İnternet yavaşsa upload uzun sürer. Tekrar dene.

### APK Telefonda Açılmıyor
- Android sürümü 7.0+ olmalı (Expo SDK 54 min: API 24)
- *"Uygulama yüklenmedi"* hatası → eski Vogel APK'sı varsa önce kaldır

---

## Hızlı Referans Tablosu

| Durum | Komut |
|---|---|
| EAS CLI kur | `npm install -g eas-cli` |
| Giriş yap | `eas login` |
| APK build | `eas build --profile preview --platform android` |
| Build durumunu izle | `eas build:list` |
| Login durumu | `eas whoami` |

---

## Build Profili Notları

**preview** profile (şu an seçili) → **APK**, internal distribution. İdeal: telefonda test.

**production** profile → **AAB** (Android App Bundle). Sadece Play Store yükleme için. Bizim için şimdi GEREKLİ DEĞİL.

**development** profile → APK + dev client. Hot reload, debug menü. İleride lazım olabilir.

---

## EAS Free Tier Limitleri

- Ayda **30 build** ücretsiz (yeterli, biz aylık 5-10 build yapabiliriz)
- Build sırası bazen 5-15 dk beklemek gerekebilir (peak saatlerde)
- Build süresi ~15 dk → toplam ~30 dk başlangıç noktasından APK'ya
