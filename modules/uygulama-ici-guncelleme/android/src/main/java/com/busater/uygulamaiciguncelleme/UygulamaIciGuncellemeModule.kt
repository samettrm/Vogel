package com.busater.uygulamaiciguncelleme

import android.app.Activity
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.ActivityResult
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * GOOGLE PLAY UYGULAMA İÇİ GÜNCELLEME (23-10-2026, Samet: "uygulama içi güncellemeyi ekle").
 *
 * Avukat "Güncelle"ye dokununca Play'in kendi tam ekran güncelleme akışı (IMMEDIATE) uygulamanın İÇİNDE açılır: indirir,
 * kurar, uygulamayı yeniden başlatır — Play Store'a gitmek gerekmez. Yalnız Play'den kurulmuş (Play imzalı) uygulamada
 * çalışır; kabloyla kurulmuş yerel derlemede Play "güncelleme yok" ya da hata döner → JS mağaza sayfasını açar.
 *
 * Her hata Promise'e döner (sessiz yutma yok); hiçbir çağrı uygulamayı çökertmez.
 */
class PlayGuncellemeHatasi(neden: Throwable?) :
  CodedException("ERR_PLAY_GUNCELLEME", neden?.message ?: "Google Play güncelleme bilgisi alınamadı", neden)

class UygulamaIciGuncellemeModule : Module() {
  private var yonetici: AppUpdateManager? = null

  private fun yonetici(): AppUpdateManager {
    yonetici?.let { return it }
    val baglam = appContext.reactContext?.applicationContext
      ?: throw PlayGuncellemeHatasi(IllegalStateException("React bağlamı yok"))
    return AppUpdateManagerFactory.create(baglam).also { yonetici = it }
  }

  override fun definition() = ModuleDefinition {
    Name("UygulamaIciGuncelleme")

    /** Play'in bu cihaz için bildiği güncelleme durumu. */
    AsyncFunction("durum") { promise: Promise ->
      try {
        yonetici().appUpdateInfo
          .addOnSuccessListener { bilgi ->
            promise.resolve(
              mapOf(
                "musait" to (bilgi.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE),
                "suruyor" to (bilgi.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS),
                "hemenIzinli" to bilgi.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE),
                "surumKodu" to bilgi.availableVersionCode(),
              )
            )
          }
          .addOnFailureListener { e -> promise.reject(PlayGuncellemeHatasi(e)) }
      } catch (e: Exception) {
        promise.reject(PlayGuncellemeHatasi(e))
      }
    }

    /**
     * Tam ekran güncellemeyi başlatır (ya da yarıda kalmışsa sürdürür). Sonuç: "basladi" (kabul etti; Play kurup
     * yeniden başlatır), "vazgecildi" (Play ekranında vazgeçti), "basarisiz" (Play akışı hata verdi), "yok" (güncelleme
     * yok ya da bu cihazda tam ekran güncelleme izinli değil → JS mağaza sayfasını açar).
     */
    AsyncFunction("baslat") { promise: Promise ->
      try {
        val etkinlik: Activity = appContext.currentActivity
          ?: return@AsyncFunction promise.resolve("yok")
        val y = yonetici()
        y.appUpdateInfo
          .addOnSuccessListener { bilgi ->
            val suruyor = bilgi.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
            val musait = bilgi.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
              bilgi.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
            if (!suruyor && !musait) {
              promise.resolve("yok")
              return@addOnSuccessListener
            }
            try {
              y.startUpdateFlow(bilgi, etkinlik, AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build())
                .addOnSuccessListener { sonuc ->
                  promise.resolve(
                    when (sonuc) {
                      Activity.RESULT_OK -> "basladi"
                      Activity.RESULT_CANCELED -> "vazgecildi"
                      ActivityResult.RESULT_IN_APP_UPDATE_FAILED -> "basarisiz"
                      else -> "basarisiz"
                    }
                  )
                }
                .addOnFailureListener { e -> promise.reject(PlayGuncellemeHatasi(e)) }
            } catch (e: Exception) {
              promise.reject(PlayGuncellemeHatasi(e))
            }
          }
          .addOnFailureListener { e -> promise.reject(PlayGuncellemeHatasi(e)) }
      } catch (e: Exception) {
        promise.reject(PlayGuncellemeHatasi(e))
      }
    }
  }
}
