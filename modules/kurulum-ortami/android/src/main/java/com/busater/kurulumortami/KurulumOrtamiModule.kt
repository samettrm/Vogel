package com.busater.kurulumortami

import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * KURULUM ORTAMI — canlı reklam kararı için (Emir Defteri A13 · 21-11-2026).
 *
 * `__DEV__` adb ile elle kurulan yayın APK'sını Play kurulumundan ayıramaz. Bu modül kurulum kaynağını söyler:
 *   "play"       — Google Play kurdu (`com.android.vending`)  → canlı reklam serbest
 *   "diger"      — adb, dosya ya da başka mağaza                → yalnız test reklamı
 *   "emulator"   — emülatör                                    → yalnız test reklamı
 *   "bilinmiyor" — kaynak okunamadı                            → yalnız test reklamı
 *
 * Sınır: Play iç / kapalı test kanalından kurulum da "play" döner; Google bu ayrımı uygulamaya vermiyor.
 */
class KurulumOrtamiModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KurulumOrtami")

    Function("ortam") {
      hesapla()
    }
  }

  private fun hesapla(): String {
    if (emulatorMu()) return "emulator"
    val baglam = appContext.reactContext ?: return "bilinmiyor"
    val kaynak: String? = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        baglam.packageManager.getInstallSourceInfo(baglam.packageName).installingPackageName
      } else {
        @Suppress("DEPRECATION")
        baglam.packageManager.getInstallerPackageName(baglam.packageName)
      }
    } catch (hata: Exception) {
      // Kaynak okunamazsa ortam bilinmiyor sayılır ve canlı reklam istenmez.
      return "bilinmiyor"
    }
    return if (kaynak == "com.android.vending") "play" else "diger"
  }

  private fun emulatorMu(): Boolean =
    Build.FINGERPRINT.startsWith("generic") ||
      Build.FINGERPRINT.contains("emulator") ||
      Build.HARDWARE.contains("goldfish") ||
      Build.HARDWARE.contains("ranchu") ||
      Build.PRODUCT.contains("sdk") ||
      Build.MODEL.contains("Emulator") ||
      Build.MODEL.contains("Android SDK built for")
}
