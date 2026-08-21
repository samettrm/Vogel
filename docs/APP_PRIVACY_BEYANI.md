# App Store Connect — App Privacy formu (Vogel)

> Kaynak: kod tabanından doğrulanmış hâl, 21 Ağustos 2026.
> App Store Connect → Vogel → **App Privacy** → Edit.
> ⚠️ Bu form, uygulamanın GERÇEKTE topladığı veriyle birebir uymak zorunda
> (Guideline 5.1.2). Uyumsuzluk red sebebidir.

## Özet: "Data is collected from this app" → **EVET**

Aşağıdaki her kalem için Apple üç şey sorar:
1. Bu veriyi topluyor musunuz?
2. **Kullanıcı kimliğine bağlı mı** (Linked to You)?
3. **Takip için mi** (Used for Tracking)?

---

## 1. Contact Info → Email Address ✅ TOPLA

| Soru | Cevap |
|---|---|
| Amaç | **App Functionality** (hesap oluşturma, giriş, ilerleme senkronu) |
| Kimliğe bağlı mı | **EVET** |
| Takip için mi | **HAYIR** |

Kanıt: Firebase Authentication (e-posta/Google/Apple girişi). Apple ile Giriş'te
gizli yönlendirme adresi de e-posta sayılır.

## 2. Contact Info → Name ✅ TOPLA

| Soru | Cevap |
|---|---|
| Amaç | **App Functionality** |
| Kimliğe bağlı mı | **EVET** |
| Takip için mi | **HAYIR** |

Kanıt: `src/services/auth.ts` → `updateProfile(cred.user, { displayName })`,
RevenueCat'e `$displayName` olarak da iletiliyor.

## 3. Identifiers → User ID ✅ TOPLA

| Soru | Cevap |
|---|---|
| Amaç | **App Functionality** |
| Kimliğe bağlı mı | **EVET** |
| Takip için mi | **HAYIR** |

Kanıt: Firebase UID; Firestore yolu `/users/{uid}/...`, RevenueCat app_user_id.

## 4. Usage Data → Product Interaction ✅ TOPLA

| Soru | Cevap |
|---|---|
| Amaç | **App Functionality** + **Analytics** |
| Kimliğe bağlı mı | **EVET** |
| Takip için mi | **HAYIR** |

Kanıt: XP, seri, tamamlanan dersler, sınav sonuçları → Firestore
(`src/services/sync.ts`); son açılış zamanı → `/users/{uid}/devices/*`.

## 5. Diagnostics → Crash Data ✅ TOPLA

| Soru | Cevap |
|---|---|
| Amaç | **App Functionality** |
| Kimliğe bağlı mı | **HAYIR** |
| Takip için mi | **HAYIR** |

Kanıt: Sentry (`src/config/sentry.ts`).

## 6. Purchases → Purchase History ✅ TOPLA

| Soru | Cevap |
|---|---|
| Amaç | **App Functionality** |
| Kimliğe bağlı mı | **EVET** |
| Takip için mi | **HAYIR** |

Kanıt: RevenueCat abonelik durumu; `/purchases` koleksiyonu (rcWebhook).

## 7. Identifiers → Device ID ✅ TOPLA  ⚠️ REKLAM NEDENİYLE DİKKAT

| Soru | Cevap |
|---|---|
| Amaç | **Third-Party Advertising** + **App Functionality** |
| Kimliğe bağlı mı | **HAYIR** |
| Takip için mi | **EVET** — ATT izni verilirse |

Kanıt: Google AdMob, `requestNonPersonalizedAdsOnly: false`. ATT izni
istendiği için (`NSUserTrackingUsageDescription` mevcut) **Tracking = EVET**
işaretlenmeli. Bu, ATT prompt'unun varlığıyla tutarlı olmak zorunda.

---

## Cihaz bilgisi hakkında not

Ülke, dil, cihaz markası/modeli, işletim sistemi sürümü ve uygulama sürümü
topluyoruz (`src/services/presence.ts`). Apple'ın listesinde bunların
karşılığı **"Usage Data → Product Interaction"** ve **"Diagnostics"**
kapsamındadır; ayrı bir "Device Info" kalemi yoktur.

⚠️ **Coarse Location İŞARETLEMEYİN.** Ülke bilgisi cihazın *bölge ayarından*
okunuyor; konum izni istenmiyor, IP'den konum çıkarımı yapılmıyor. Apple
"Location" kalemini konum servisleri için ayırmıştır. Yanlış işaretlemek
gereksiz izin beyanı olur.

---

## Formdan sonra

Gizlilik politikası URL'si: `https://samettrm.github.io/Vogel/privacy.html`
Bu politika 21 Ağu 2026'da yukarıdaki kalemlerin tamamını kapsayacak şekilde
yeniden yazıldı (uygulama içi metin: `app/privacy-policy.tsx`).
