# 🛠️ SORUN ÇÖZME SİSTEMİ (EMİR)

> Bu bir **EMİR**'dir — her bug'da uygula. Samet'in kalıcı kuralı (tevkil `LAPTOP_HANDOFF.md` ile aynı sistem).
> Kanıtlandı: deep-link, iptal sonrası WhatsApp onayı, sessiz build hatası, tablo sahipliği bug'ları hep böyle çözüldü.

## TEMEL İLKE
Bir sorunu **ASLA TAHMİNLE çözme.** "Şu olabilir" deyip rastgele kod değiştirme/deneme **YAPMA.**
Önce sorunun **NEREDE** ve **NEDEN** olduğunu **KANITLA**, sonra çöz. Tahminle yama = yeni bug + zaman kaybı.

## YÖNTEM (teker teker, sırayla)

**1) ANLA** — Sorunu net tanımla: hangi ekran/akış, ne bekleniyordu, ne oldu? Samet (kod bilmez) anlattığını somut adıma çevir.

**2) HİPOTEZLERİ ÇIKAR + AKIŞI HARİTALA** — O akış baştan sona hangi aşamalardan geçiyor? (örn: buton → istek → backend/route → DB → cevap → ekran). Kopabileceği HER noktayı listele.

**3) TEŞHİS İZİ KUR (en kritik adım)** — Şüpheli akışın HER aşamasına bir İŞARET koy ve ETİKETLE. Akışın tam NEREDE durduğunu / hangi değerle bozulduğunu GÖZLE gör. (Araçlar bu repoya özel → aşağıda.)

**4) İZİ OKU + KÖK SEBEBİ KANITLA** — Hangi işarete kadar ulaşıldı, hangisinde durdu, hangi değer yanlıştı? "İşte tam burada, şu yüzden" diyebildiğinde DUR. Bu kanıttır, tahmin değil.

**5) KÖKTEN ÇÖZ** — Semptomu değil, kanıtladığın kök sebebi düzelt. Mevcut güvenli kalıbı örnek al (kopyala-uydurma değil).

**6) DOĞRULA** — Değişiklik gerçekten canlı/derlenmiş mi teyit et (aşağıdaki repo-özel doğrulama).

**7) KULLANICIYA DENETTİR** — Samet'e somut adımla "şunu şöyle dene" de, çalıştı mı sor. Çalışmadıysa **3. adıma dön** (izi derinleştir), tahmine KAÇMA.

**8) TEMİZLE** — Geçici teşhis izlerini kaldır; kalıcı gözlem halkaları kalır. (Kuralları bozma: tsc=0, kilitli alanlara dokunma.)

> **ÖZET CÜMLE:** "Tahmin etme — işaretle, izle, kanıtla, kökten çöz, doğrula, denettir."

## 3. adım — Bu repo için teşhis araçları (Expo / React Native)

Akış: Ekran → state (Zustand) → native modül / API → cevap → render. Kopma noktaları: state, native lazy-load, async data, build/cache.

- **Konsol izi:** her aşamaya `console.log('[ETİKET]', deger)` → Metro konsolunda nerede durduğunu / hangi değerin yanlış olduğunu GÖR.
- **Metro/Expo:** `npx expo start` — kırmızı ekran/uyarılar. **Tip:** `npx tsc --noEmit` (tsc=0).
- **Native/build:** `eas build:list` + build loglarında sessiz hata. iOS açılış-snapshot/cache → sürüm bump kalıbı.
- **Cihaz farkı:** simülatör vs gerçek cihaz — fark varsa native/izin/cache.
- **Doğrulama:** tsc=0 → build → cihazda denettir; değişiklik gerçekten bundle'da mı teyit et.

---
*Bu dosya Samet'in tüm repolarına entegre edilen ortak "SORUN ÇÖZME SİSTEMİ"dir (2026-06-16). Bug'larda bu yöntem zorunludur.*
