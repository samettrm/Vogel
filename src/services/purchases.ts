import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  RC_API_KEY,
  ENTITLEMENT_PREMIUM,
  OFFERING_DEFAULT,
  PRODUCT_IDS,
} from '../config/revenuecat';

// ════════════════════════════════════════════════════════════════
// SATIN ALMA SERVİSİ — RevenueCat v10
//
// Kullanım:
//   - initPurchases()   → _layout.tsx'ten app açılışında çağrılır
//   - fetchPremiumPackages() → PremiumPlansCard'da fiyat göstermek için
//   - purchasePlan()    → kullanıcı plan seçince çağrılır
//   - purchaseProduct() → XP / can satın alımı için
//   - restorePurchases() → "Satın almaları geri yükle" butonu için
//   - checkIsPremium()  → uygulama başlangıcında premium durumu senkronize et
//
// RC yapılandırılmamışsa (API key yok) → tüm fonksiyonlar graceful no-op döner.
// ════════════════════════════════════════════════════════════════

let _initialized = false;

// ─────────────────────────────────────────────────────────────────
// BAŞLATMA
// ─────────────────────────────────────────────────────────────────

export function initPurchases(): void {
  if (!RC_API_KEY || _initialized) return;
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey: RC_API_KEY });
    _initialized = true;
  } catch {
    // Expo Go'da native modül yok — sessizce geç, mock mod devreye girer
  }
}

export function isPurchasesConfigured(): boolean {
  return !!RC_API_KEY && _initialized;
}

// ─────────────────────────────────────────────────────────────────
// TİPLER
// ─────────────────────────────────────────────────────────────────

export type PlanId = 'monthly' | 'yearly' | 'family';

export type PremiumPackage = {
  id: PlanId;
  rcPackage: PurchasesPackage;
  priceString: string;
};

export type PurchaseResult =
  | { ok: true; customerInfo: CustomerInfo }
  | { ok: false; cancelled: boolean; message?: string };

// ─────────────────────────────────────────────────────────────────
// PREMIUM PAKETLERİ ÇEK (fiyat gösterimi için)
// ─────────────────────────────────────────────────────────────────

export async function fetchPremiumPackages(): Promise<PremiumPackage[] | null> {
  if (!isPurchasesConfigured()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current ?? offerings.all[OFFERING_DEFAULT];
    if (!offering) return null;

    const result: PremiumPackage[] = [];
    for (const pkg of offering.availablePackages) {
      const productId = pkg.product.identifier;
      const id: PlanId | null =
        productId === PRODUCT_IDS.premiumMonthly  ? 'monthly'
        : productId === PRODUCT_IDS.premiumYearly ? 'yearly'
        : productId === PRODUCT_IDS.premiumFamily  ? 'family'
        : null;

      if (id) {
        result.push({ id, rcPackage: pkg, priceString: pkg.product.priceString });
      }
    }
    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// PREMIUM PLAN SATIN AL (subscription / lifetime)
// ─────────────────────────────────────────────────────────────────

export async function purchasePlan(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, customerInfo };
  } catch (e: unknown) {
    return handlePurchaseError(e);
  }
}

// ─────────────────────────────────────────────────────────────────
// TÜKETİLEBİLİR / TEK SEFERLİK ÜRÜN SATIN AL (XP, can)
// ─────────────────────────────────────────────────────────────────

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    const products = await Purchases.getProducts([productId]);
    if (!products.length) {
      return { ok: false, cancelled: false, message: 'Ürün bulunamadı.' };
    }
    const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
    return { ok: true, customerInfo };
  } catch (e: unknown) {
    return handlePurchaseError(e);
  }
}

// ─────────────────────────────────────────────────────────────────
// SATIN ALMALARI GERİ YÜKLE
// ─────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isPurchasesConfigured()) {
    return { ok: false, cancelled: false, message: 'RevenueCat yapılandırılmadı.' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { ok: true, customerInfo };
  } catch (e: unknown) {
    return handlePurchaseError(e);
  }
}

// ─────────────────────────────────────────────────────────────────
// PREMİUM DURUMU KONTROL ET (app açılışında senkronize etmek için)
// ─────────────────────────────────────────────────────────────────

export async function checkIsPremium(): Promise<boolean> {
  if (!isPurchasesConfigured()) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Güvenli premium kontrolü — sadece RC kesin yanıt verirse store'u güncelle.
 *
 * Dönüş değerleri:
 *   true  → RC "premium" dedi → store'u true yap
 *   false → RC "premium değil" dedi → store'u false yap
 *   null  → RC yanıt vermedi (ağ hatası, yapılandırılmamış) → mevcut değere dokunma
 *
 * Bu sayede telefon değişiminde yeni cihazda internet yoksa eski AsyncStorage
 * değeri korunur; kullanıcı asla yanlışlıkla premium'dan çıkarılmaz.
 */
export async function checkIsPremiumSafe(): Promise<boolean | null> {
  if (!isPurchasesConfigured()) return null; // RC yok → bilmiyoruz
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
  } catch {
    return null; // ağ hatası / timeout → kesin bilgi yok
  }
}

// ─────────────────────────────────────────────────────────────────
// HATA YARDIMCISI
// ─────────────────────────────────────────────────────────────────

function handlePurchaseError(e: unknown): PurchaseResult {
  const err = e as {
    code?: string;
    userCancelled?: boolean | null;
    message?: string;
    underlyingErrorMessage?: string;
  };

  // Kullanıcı ödeme sayfasını kapattıysa sessizce geç
  const cancelled =
    err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    err.userCancelled === true;

  return {
    ok: false,
    cancelled,
    message: cancelled ? undefined : (err.underlyingErrorMessage ?? err.message),
  };
}
