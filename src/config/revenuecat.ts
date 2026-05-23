import { Platform } from 'react-native';

// ════════════════════════════════════════════════════════════════
// REVENUECAT YAPILANDIRMASI
// ════════════════════════════════════════════════════════════════
//
// API KEY ALMAK:
//   1. https://app.revenuecat.com → Create Account
//   2. Create Project → Add App → iOS (Bundle ID: com.yenipc002.Vogel)
//   3. API Keys → Public SDK Key kopyala → .env'e ekle:
//      EXPO_PUBLIC_RC_API_KEY_IOS=appl_xxxxxxxxxxxxxxxxxx
//
// app.json'da SENTRY_ORG_SLUG ve SENTRY_PROJECT_SLUG gibi,
// buradaki ID'ler de App Store Connect'te tanımlananlarla eşleşmeli.
// ════════════════════════════════════════════════════════════════

export const RC_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? '',
  android: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? '',
  default: '',
}) ?? '';

// RevenueCat Dashboard → Entitlements → Create "premium"
export const ENTITLEMENT_PREMIUM = 'Vogel: Language Lessons Pro';

// RevenueCat Dashboard → Offerings → Default Offering ID
export const OFFERING_DEFAULT = 'default';

// ────────────────────────────────────────────────────────────────
// APP STORE CONNECT ÜRÜN ID'LERİ
// App Store Connect → Monetization → In-App Purchases bölümünde
// aşağıdaki product ID'lerle ürünleri oluştur.
// ────────────────────────────────────────────────────────────────
export const PRODUCT_IDS = {
  // ── ABONELİKLER (Subscriptions > Auto-Renewable Subscription) ──
  premiumMonthly:  'vogel_premium_monthly',   // ₺99.99 / ay
  premiumYearly:   'vogel_premium_yearly',    // ₺499.99 / yıl

  // ── AİLE PLANI (Auto-Renewable Subscription, Family Sharing) ──
  premiumFamily:   'vogel_premium_family',    // ₺1199.99 yıllık aile

  // ── TÜKETİLEBİLİR (Consumable In-App Purchase) ────────────────
  xp100:   'vogel_xp_100',    // ₺19.99 → 100 XP
  xp500:   'vogel_xp_500',    // ₺49.99 → 500 XP
  xp1500:  'vogel_xp_1500',   // ₺99.99 → 1500 XP
  hearts5: 'vogel_hearts_5',  // ₺19.99 → 5 can
} as const;

// RevenueCat Dashboard'da "premium" entitlement'ını şu 3 ürünle bağla:
//   vogel_premium_monthly / vogel_premium_yearly / vogel_premium_lifetime
