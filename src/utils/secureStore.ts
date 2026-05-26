// ════════════════════════════════════════════════════════════════
// SECURE DEVICE FLAG — cihaz-bağlı login geçmişi
//
// Amaç: Aynı cihazda uninstall + reinstall yapan kullanıcıyı, hiç
// yüklemediği yeni bir cihaza geçen kullanıcıdan ayırt etmek.
//
// Mekanik:
//   - iOS  → Keychain (WHEN_UNLOCKED_THIS_DEVICE_ONLY)
//   - And. → EncryptedSharedPreferences
//
// Bu flag uninstall sonrası **persist eder** (cihaz değişene kadar
// silinmez) ama iCloud Backup / Google Backup ile YENİ cihaza
// TAŞINMAZ. THIS_DEVICE_ONLY anahtar erişim sınıfı sayesinde:
//
//   ADIM 5: Aynı cihaz silip yeniden yükleme → flag bulunur →
//           onboarding ATLANIR, direkt login ekranı.
//   ADIM 6: Yeni cihazda ilk yükleme → flag yok → onboarding +
//           2 misafir ders + zorunlu login normal akışı.
//
// Set: Kullanıcı başarıyla login olduğunda (email / Google / Apple)
//      login.tsx'te çağrılır.
//
// ⚠️ LAZY REQUIRE: expo-secure-store native modülü Expo Go veya
// yanlış kurulmuş build'de bulunamayabilir. Top-level import yerine
// require() ile sarmalayarak modül-level crash'i önlüyoruz; modül
// yoksa fonksiyonlar sessizce no-op çalışır (ADIM 5 davranışı kaybolur
// ama uygulama crash etmez).
// ════════════════════════════════════════════════════════════════

const DEVICE_LOGIN_FLAG = 'vogel.device_had_signed_in_user';

let _SecureStore: any = null;
let _loadAttempted = false;

function getSecureStore(): any | null {
  if (_loadAttempted) return _SecureStore;
  _loadAttempted = true;
  try {
    // Lazy require — modül yoksa exception fırlamadan null döner
    _SecureStore = require('expo-secure-store');
    return _SecureStore;
  } catch {
    return null;
  }
}

/**
 * Bu cihazda en az bir kez başarılı kullanıcı girişi yapıldığını işaretle.
 * Login flow'unun tüm 3 yolunda (email/Google/Apple) success sonrası çağrılır.
 * Native modül yoksa sessizce no-op olur.
 */
export async function markDeviceAsLoggedIn(): Promise<void> {
  const ss = getSecureStore();
  if (!ss?.setItemAsync) return;
  try {
    await ss.setItemAsync(DEVICE_LOGIN_FLAG, '1', {
      keychainAccessible: ss.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Native modül var ama yazma başarısız (örn. keychain disabled) — sessizce devam
  }
}

/**
 * Bu cihazda daha önce kullanıcı girişi yapılmış mı?
 * App açılışında OnboardingGuard tarafından kontrol edilir.
 * Native modül yoksa false döner — yeni cihaz gibi davranılır (ADIM 6).
 */
export async function hasDeviceEverLoggedIn(): Promise<boolean> {
  const ss = getSecureStore();
  if (!ss?.getItemAsync) return false;
  try {
    const value = await ss.getItemAsync(DEVICE_LOGIN_FLAG);
    return value === '1';
  } catch {
    return false;
  }
}
