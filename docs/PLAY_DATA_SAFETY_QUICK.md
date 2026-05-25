# Play Data Safety — Quick Reference

Google Play Console → Policy → App content → Data safety formunun TÜM cevapları tek tabloda.

> Bu cevaplar Vogel'in mevcut entegrasyonlarına göre (Firebase Auth + Firestore + Analytics, Sentry, RevenueCat). Yeni bir SDK eklendiğinde bu dosya güncellensin.

---

## 1. Data collection and security

| Soru | Cevap |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** |
| Do you provide a way for users to request their data be deleted? | **Yes** |

**How users request deletion:**
- In-app: Settings → Hesabımı sil (planlanan)
- Email: `bsdigitalapp@gmail.com`

---

## 2. Data types collected

| Data Type | Collected? | Shared? | Processed Ephemerally? | Optional/Required | Purpose(s) |
|---|---|---|---|---|---|
| **Personal info → Email address** | Yes | No | No | Required | Account management |
| **Personal info → User IDs** (Firebase UID) | Yes | No | No | Required | Account management, Analytics |
| **Personal info → Name** | No | — | — | — | — |
| **Personal info → Address** | No | — | — | — | — |
| **Personal info → Phone number** | No | — | — | — | — |
| **Financial info → Purchase history** (RevenueCat) | Yes | No | No | Required | Account management |
| **Financial info → Credit card / payment info** | No | — | — | — | Apple/Google handles payment, we don't see card data |
| **Location → Approximate location** | No | — | — | — | — |
| **Location → Precise location** | No | — | — | — | — |
| **Web history** | No | — | — | — | — |
| **Files and docs** | No | — | — | — | — |
| **Calendar** | No | — | — | — | — |
| **Contacts** | No | — | — | — | — |
| **App activity → App interactions** (Firebase Analytics) | Yes | No | No | Optional | Analytics |
| **App activity → In-app search history** | No | — | — | — | — |
| **App activity → Installed apps** | No | — | — | — | — |
| **App activity → Other user-generated content** | No | — | — | — | — |
| **App info and performance → Crash logs** (Sentry) | Yes | No | No | Optional | App functionality, Analytics |
| **App info and performance → Diagnostics** (Sentry performance) | Yes | No | No | Optional | App functionality, Analytics |
| **App info and performance → Other app performance data** | No | — | — | — | — |
| **Device or other IDs** (Advertising ID) | No | — | — | — | — |
| **Audio → Voice or sound recordings** | No | — | — | — | Mic kullanılır ama on-device speech recognition — ses kaydedilmez/iletilmez |
| **Audio → Music files** | No | — | — | — | — |
| **Photos and videos** | No | — | — | — | — |
| **Health and fitness** | No | — | — | — | — |
| **Messages** | No | — | — | — | — |

---

## 3. Security practices

| Soru | Cevap |
|---|---|
| Is data encrypted in transit? | **Yes** (Firebase + RevenueCat + Sentry hepsi HTTPS/TLS) |
| Do you provide a way for users to request data deletion? | **Yes** |
| Committed to Google Play Families Policy? | **No** (target 18+) |
| Independent security review? | **No** |

---

## 4. Purpose explanations (Play formunda "Add purpose" derken)

- **Account management:** Hesap oluşturma, login, password reset, kullanıcı tanıma, satın alma geçmişi (RevenueCat)
- **Analytics:** Hangi seviyelerin/derslerin daha çok kullanıldığını anlamak, crash'leri görmek
- **App functionality:** Cross-device sync (Firestore), crash recovery (Sentry)

---

## 5. Not Collected (formda DON'T toggle these to Yes)

Aşağıdaki kategorileri yanlışlıkla "Yes" yapma:
- Advertising ID / Device IDs → biz advertising ID'si kullanmıyoruz
- Audio recordings → mikrofon erişimi var ama kayıt yok
- Photos and videos → galeri erişim izni `app.json`'da var ama şu an UI'da kullanılmıyor
- Precise/approximate location → location services kullanmıyoruz

> Eğer ileride bunlardan birini entegre ederseniz (örn. avatar upload galeriden), bu dosyayı + Play formunu güncelleyin.
