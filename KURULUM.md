# Vogel — Kurulum (expo-router sürümü)

Bu zip, modern Expo şablonuna (file-based routing) uygun hazırlandı.

## Hangi durumdaysan?

### Durum A: Henüz Vogel projen yok (veya silmek üzeresin)

Şu adımları sırayla yap:

```powershell
cd C:\Users\i9pc\Documents
npx create-expo-app@latest Vogel
cd Vogel
npx expo install lottie-react-native expo-av expo-haptics expo-speech @react-native-async-storage/async-storage @expo-google-fonts/nunito expo-splash-screen
npm install zustand
```

### Durum B: Vogel projen var ve `npm install` zaten bitmiş

Yukarıdaki "npx expo install" ve "npm install zustand" komutlarını çalıştır.

## Dosyaları yerleştir

Bu zip'i indirip aç. İçinde şunlar olacak:

- `app/` klasörü → senin Vogel projendeki `app/` klasörünün **üzerine** yazılacak
- `src/` klasörü → senin Vogel projende henüz yok, **yeni** ekleniyor
- `babel.config.js` → senin Vogel projendekinin **üzerine** yazılacak
- `KURULUM.md` → bu dosya

**Kolay yöntem:** Zip'in içindekilerin **hepsini** seç ve doğrudan Vogel klasörüne sürükle. Windows "Replace files?" diye sorarsa **"Yes to All"** de.

## Çalıştır

```powershell
npx expo start -c
```

`-c` flag'i önemli, babel.config.js değiştiği için önbelleği temizliyor.

QR kodu çıkınca telefondan Expo Go ile tara.

## Ne göreceksin

- Üst: bayrak (🇩🇪), alev (0), kalp (5), XP (0)
- Orta: 3 ünite, her birinde zikzak yerleşmiş yuvarlak ders düğümleri
- İlk düğümün üstünde "BAŞLA" balonu
- Alt: 3 sekme (YOL, LİG, PROFİL)

Bir düğüme dokun → uyarı çıkar. "Tamamla (test)" dersen XP +10, sıradaki ders açılır.

## Sıradaki adım

Bunlar çalıştıktan sonra:
- Gerçek ders ekranı (egzersizleri açacak)
- İlk 3 egzersiz türü: çeviri, çoktan seçmeli, dinleme
- TTS ile Almanca telaffuz
- Doğru/yanlış animasyonları ve haptik

Bir hata çıkarsa tüm hata mesajını aynen yapıştır.
