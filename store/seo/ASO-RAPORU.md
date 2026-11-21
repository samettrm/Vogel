# Vogel — ASO raporu (Emir Defteri A22)

**Tarih:** 21-11-2026 · **Sürüm:** 1.0.8 ile mağazaya gider · **Standart:** `~/.claude/standards/magaza-seo-standardi.md`

Mağazaya giden son metinler bu klasörde:
- `app-store-metinleri.json`: tr ve en-US.
- `play-metinleri.json`: Play'de yalnız tr-TR kaydı var.

Uygulama abonelik sunar. Her metinde iki bağlantı bulunur:
- Kullanım Koşulları (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- Gizlilik Politikası: https://samettrm.github.io/Vogel/privacy.html

## 1. Ürün gerçeği (koddan, `src/data/courses`)

- **Türkçeden:** Almanca, İngilizce, İspanyolca, Fransızca, İtalyanca, Arapça; her biri A1–C1.
- **İngilizceden:** yalnız Almanca, A1–C1.
- **Özellikler:**
  - Seviye belirleme testi
  - Konuşma (Sprechen)
  - Tekrar merkezi
  - Kelime kartları
  - Sınav ekranı (Goethe/TELC biçimi)
  - Seri, XP, lider tablosu
  - Aile planı
- **Vogel Plus:**
  - Reklamsız kullanım
  - Sınırsız can
  - Sınırsız kart pratiği
  - Sınav hazırlığı
  - Sınırsız AI açıklaması

## 2. Mevcut durumdaki kusurlar

- **TR:**
  - Ad "Vogel: Dil Dersleri" değeri anlatıyor ama aranan kelimeyi ("almanca") içermiyor.
  - Anahtar kelimeler adda geçen "dil" ve "ders"i tekrar ediyor.
- **en-US:**
  - Anahtar kelimeler English, Spanish, French, Italian ve Arabic diyor.
  - İngilizce konuşan kullanıcı bunları öğrenemez; yalnız Almanca öğrenebilir. Bu yanıltıcı vaat kaldırıldı.
- **Türkçe açıklama:** "sen" hitabıyla yazılmış ("başla, seç, öğren"). BUSATER ürün dili "siz".
- **Gizlilik paragrafı:** yeni analitik sunucusunu söylemiyordu.
- **"Kısa bir reklam izleyip can kazan" vaadi:** reklam yayıncı hesabı 21-11-2026'da kapandığı için ödüllü reklam garanti değil. Vaat kaldırıldı.
- **Play açıklaması:**
  - Başlıklar emojiyle yazılmış (A9).
  - Yalnız Almancadan söz ediyordu.
  - Kanıtlanmamış sayılar içeriyordu ("2000+ kelime" gibi).
  - İletişim adresi A14 destek adresi değildi.
  - Hepsi değiştirildi.
- **Sıralama:** "almanca öğren", "dil öğrenme", "ingilizce öğren" (TR) ve "learn german" (US) aramalarının ilk 10'unda yoktuk (`itunes.apple.com/search`, 21-11-2026).

## 3. Rakip dökümü — App Store

| Arama | İlk sıralar (yorum sayısı) |
|---|---|
| almanca öğren (TR) | Learn German (Beginners) 208 · Duolingo 509.996 · Türkçe-Almanca Kelimeler 8 · Busuu 87.801 · Learn German Beginners Easily 323 · WörterMeister 21 · Goethe Almanca A1-B1 0 · Learn German in Turkish 271 |
| dil öğrenme (TR) | Duolingo · Busuu · Airlearn 2.106 · Memrise 64.402 · HelloTalk 9.400 · Mondly 13.249 · Falou 21.992 · Learna 37.780 |
| ingilizce öğren (TR) | Simpler 14.627 · Kolay İngilizce Kelime 36.925 · Duolingo · Voscreen 2.154 · Busuu · Konuşarak Öğren 2.092 · Cake 14.128 · EnglishCentral 14.470 |
| learn german (US) | Learn German for Beginners 3.433 · DW Learn German 133 · Duolingo · Seedlang 1.780 · Learn German Beginners Easily 513 · Grammatisch 723 · Babbel 758.705 |

**Fırsat:** "almanca öğren" aramasında ilk 10'un yarısı çok az yorumlu, küçük uygulamalar (0–323 yorum). Türkçe konuşanlara Almanca bu kategoride ulaşılabilir bir niş. "dil öğrenme" ve "ingilizce öğren" devlerin alanı; ikincil hedef.

Rakip uygulamaların adı hiçbir alana yazılmadı. "Goethe" yalnız açıklamada geçiyor; uygulamanın sınav biçimini anlatıyor ve sonunda marka/bağımsızlık satırı var. Anahtar kelimeye yazılmadı.

## 4. Kelime havuzu (mağaza otomatik tamamlaması, 21-11-2026)

**TR:**
- almanca öğreniyorum · almanca öğren · almanca kelime öğren · almanca a1 · almanca oyun · almanca türkçe · almanca öğrenme
- dil öğrenme · ücretsiz dil öğren · yabancı dil öğrenme
- ingilizce öğrenme · ingilizce öğrenme oyun
- ispanyolca öğren · ispanyolca kelime
- goethe a1 (marka, alınmadı)

**US:**
- learn german · learn german for beginners · learn german vocab a1 a2 b1 · learn german grammatisch (rakip adı, alınmadı)
- german learning app · language learning

## 5. Seçim

| Alan | Önce | Sonra |
|---|---|---|
| TR ad | Vogel: Dil Dersleri | **Vogel: Almanca ve Dil Öğren** (27) |
| TR alt başlık | 6 dilde oyunlaştırılmış ders | **A1-C1 kelime, gramer, konuşma** (29) |
| TR anahtar | almanca,ingilizce,…,dil,ders,kelime,gramer,seviye | **öğreniyorum,öğrenme,ingilizce,ispanyolca,fransızca,italyanca,arapça,sınav,a2,b1,b2,türkçe,ders,oyun** (99) |
| en-US ad | Vogel: Language Lessons | **Vogel: Learn German A1-C1** (25) |
| en-US alt başlık | Six Languages, One Lesson Map | **Vocabulary, grammar, speaking** (29) |
| en-US anahtar | german,english,spanish,… | **deutsch,language,lessons,beginners,a2,b1,b2,exam,words,phrases,verbs,practice,flashcards,course** (95) |
| Play başlık | Vogel: Language Lessons | **Vogel: Almanca ve Dil Öğren** |
| Play kısa | Türkçeden Almancaya… | **Almanca öğrenme: A1-C1 kelime, gramer ve konuşma; 6 dil ve sınav hazırlığı.** (75) |

**Gerekçe:** Apple adı, alt başlığı ve anahtar kelimeleri birleştirerek dizinler. Bu birleşimle şu aramalar kapsanır:
- almanca öğren / öğreniyorum / öğrenme
- almanca a1 · almanca kelime
- dil öğren / öğrenme
- ingilizce / ispanyolca öğren
- almanca türkçe
- learn german · german a1 · german vocabulary · german grammar

Mekanik denetim:
- Ad ve alt başlık ≤ 30 karakter, anahtar kelime ≤ 100 karakter.
- Ad ve alt başlıkla kelime tekrarı yok.
- Play'de yasaklı ifade yok ("ücretsiz", "en iyi").

## 6. Ölçüm (~19-12-2026)

- App Store Connect: "App Store araması" kaynaklı gösterim ve indirme.
- Play: "Google Play araması" edinmesi.
- Sıra: almanca öğren, almanca a1, almanca kelime, learn german.
