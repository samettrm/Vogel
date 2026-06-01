# 🚀 LAPTOP DEVAM PROMPT — Google Play Abonelikleri

> Masaüstünde Claude tarafından hazırlandı (2026-06-01). **Laptop'ta:** Vogel klasöründe
> `git pull origin main` → Claude Code'u aç → aşağıdaki **PROMPT** bloğunu yapıştır.
> İş bitince bu dosyayı silebilirsin (`git rm LAPTOP-PROMPT-PLAY-SUBS.md` + `[skip ci]` commit).

---

## 📋 LAPTOP'TA CLAUDE'A YAPIŞTIR

```
Vogel'de Google Play abonelik kurulumuna kaldığımız yerden devam ediyoruz.

ÖNCE OKU: CLAUDE.md → STABILITY-LOCK.md → TODO.md → src/config/revenuecat.ts.

DURUM — KOD TARAFI TAMAM (değişiklik gerekmez):
- src/services/purchases.ts: platform-bağımsız RC v10 entegrasyonu (init, login/logout,
  fetchPremiumPackages, purchasePlan, restore, checkIsPremiumSafe). RC, platformu API key
  ile kendi seçiyor; iOS zaten canlıda çalışıyor → Android için ekstra kod yok.
- src/config/revenuecat.ts: product ID + entitlement + offering tanımlı (STABILITY-LOCK kilidi).
- src/utils/manageSubscriptions.ts: "Aboneliği Yönet" Android'de
  play.google.com/store/account/subscriptions açıyor (iOS + Android ✓).

KALAN İŞ = PLAY CONSOLE + REVENUECAT PANEL KONFİGÜRASYONU (kod değil, dashboard).
Şu an buradayız → "Play Console'da 3 abonelik ürünü oluştur" (memory: IN PROGRESS).

YAPILACAKLAR (sırayla):
1) PLAY CONSOLE → Monetize with Play → Products → Subscriptions → "Create subscription".
   3 ürün, product ID'ler revenuecat.ts ile BİREBİR AYNI olmalı:
     - vogel_premium_monthly   →  ₺199 / ay
     - vogel_premium_yearly    →  ₺999,99 / yıl   (%58 indirim vurgusu)
     - vogel_premium_family    →  ₺1499,99 / yıl  (2-6 üye)
   Her ürün için: Base plan ekle → "Auto-renewing" → billing period (monthly/yearly) →
   fiyat (TR ₺) → Activate. (İstersen intro/free-trial offer ekle; şu an UI'da trial YOK,
   "direkt abonelik" — PremiumPlansCard.tsx. Trial eklersen UI metnini de güncelle.)
   ⚠️ Yeni Play modeli: Subscription > Base plan > Offer. RC base plan'ları okur.

2) REVENUECAT DASHBOARD → Vogel projesi → Products: 3 Play ürününü ekle (import/manual) →
   "Vogel: Language Lessons Pro" entitlement'ına bağla →
   "default" offering'e Package olarak ekle ($rc_monthly / $rc_annual / custom family).
   Bağlantı için RC, Play Service Account kredisi ister (Play Console → API access →
   service account → RC'ye yükle). Zaten bağlıysa atla.

3) PLAY CONSOLE → Testing → Closed testing → mevcut sürümü YAYINLA (oluşturmak yetmez).
   AAB 1.0.3 (versionCode 2) yüklü. Yayınlanmadıysa "Start rollout".

4) 12+ tester topla (opt-in link paylaş) → 14 gün aktif test → sonra Production başvurusu.

KRİTİK KURALLAR:
- revenuecat.ts product ID / entitlement / offering değerlerine DOKUNMA (STABILITY-LOCK).
- Her commit mesajına [skip ci] ekle (main'e push → Codemagic iOS build tetikler; user manuel tetikler).
- git push'u SEN otomatik çalıştırma → commit hazırla, push komutunu user'a bildir.
- versionCode her track için unique; aynısı iki kez kullanılmaz.
- tsc 0 olmadan commit etme (kod değişirse: npx tsc --noEmit).

ANAHTAR BİLGİLER (laptop'ta memory yok — buraya yazıyorum):
- RC Android public SDK key (env EXPO_PUBLIC_RC_API_KEY_ANDROID): goog_LOmFYcxKjVcztaGxgYHjeoMyqOD
- RC iOS key: env EXPO_PUBLIC_RC_API_KEY_IOS
- Entitlement: "Vogel: Language Lessons Pro"  |  Offering: "default"
- Play Console dev hesabı: bsdigitalapp@gmail.com  (trsamet71 DEĞİL)
- Ödeme/merchant profili: 1193-5947-5865 (Samet TERME bireysel, TR, %15 program kayıtlı)
- Android status: Closed Testing, AAB 1.0.3 (versionCode 2) yüklü
- Keystore: android/app/vogel-release.keystore (gitignored, Desktop backup) — KAYBETME
- Test hesabı (Play App Access): apple-reviewer@vogel-app.com / VogelReview2026!

ÇIKTI BEKLENTİSİ: Bu adımların çoğu benim (user) dashboard'da tıklayacağım iş; sen bana
adım adım yönlendir, hangi ekrana ne gireceğimi söyle, takıldığım yeri çöz. Kod değişikliği
çıkarsa (örn. trial UI metni) öner + uygula, ama önce STABILITY-LOCK'a takılıyor mu kontrol et.
```

---

## 🔎 Bağlam (masaüstü oturumu özeti — 2026-06-01)

- **iOS:** App Store'da canlı / TestFlight aktif. Bu işle ilgisi yok.
- **Android:** Closed Testing aşamasında. 14 gün + 12 tester → sonra Production.
- **Neden kod yok:** RevenueCat tek SDK ile her iki store'u soyutluyor; iOS'taki satın alma
  akışı Android'de de aynı kodla çalışır. Tek fark store-side ürün tanımı + RC bağlama.
- **Tehlike alanları:** `revenuecat.ts` STABILITY-LOCK'ta; her commit `[skip ci]`; keystore
  yedeği şart; versionCode unique.

**Repo referansları:** [src/config/revenuecat.ts](src/config/revenuecat.ts) ·
[src/services/purchases.ts](src/services/purchases.ts) ·
[docs/ANDROID_RELEASE_PLAYBOOK.md](docs/ANDROID_RELEASE_PLAYBOOK.md) ·
[STABILITY-LOCK.md](STABILITY-LOCK.md) · [TODO.md](TODO.md)
