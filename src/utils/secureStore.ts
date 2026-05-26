import * as SecureStore from 'expo-secure-store';

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
// ════════════════════════════════════════════════════════════════

const DEVICE_LOGIN_FLAG = 'vogel.device_had_signed_in_user';

/**
 * Bu cihazda en az bir kez başarılı kullanıcı girişi yapıldığını işaretle.
 * Login flow'unun tüm 3 yolunda (email/Google/Apple) success sonrası çağrılır.
 */
export async function markDeviceAsLoggedIn(): Promise<void> {
  try {
    await SecureStore.setItemAsync(DEVICE_LOGIN_FLAG, '1', {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // SecureStore native modülü yoksa (Expo Go) sessizce devam.
    // Production build'de native modül vardır.
  }
}

/**
 * Bu cihazda daha önce kullanıcı girişi yapılmış mı?
 * App açılışında OnboardingGuard tarafından kontrol edilir.
 */
export async function hasDeviceEverLoggedIn(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(DEVICE_LOGIN_FLAG);
    return value === '1';
  } catch {
    return false;
  }
}
