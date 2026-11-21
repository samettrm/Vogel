/**
 * CANLI REKLAM İZNİ — Emir Defteri A13 · reklam-standardi.md (21-11-2026).
 *
 * Reklam ortamı üç değerlidir:
 *   "canli" — mağazadan kurulmuş uygulama: iOS App Store ("appstore"), Android Google Play ("play") → canlı birim
 *   "test"  — geliştirme derlemesi, simülatör, emülatör, Xcode ya da adb ile elle kurulan derleme  → Google test birimi
 *   "yok"   — TestFlight / App Review (iOS "testflight") ve ortamı okunamayan her durum           → hiç reklam yok
 *
 * Neden: 08-09-2026 askısı ve 21-11-2026 kalıcı kapanış. TestFlight ve elle kurulan yayın derlemesi, mağaza
 * sürümüyle aynı derleme türüdür; `__DEV__` onları ayıramaz ve eski kural TestFlight'ta canlı reklam gösterdi.
 * TestFlight'ta test reklamı da gösterilmez: App Review aynı ortamda açar, test reklamı 2.1 reddi riskidir.
 * Ortamı `modules/kurulum-ortami` yerel modülü söyler. Modül derlemeye girmemişse (pod install yapılmadı vb.)
 * ortam "modul-yok" olur → hiç reklam yok.
 *
 * Sınır: Play iç / kapalı test kanalı Play kurulumu sayılır (Google ayırt ettirmiyor); owner cihazına zaten reklam
 * gösterilmez.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type KurulumOrtamiModulu = { ortam(): string };
export type ReklamOrtami = 'canli' | 'test' | 'yok';

let onbellek: string | null = null;

/** "appstore" · "testflight" · "xcode" · "simulator" · "play" · "diger" · "emulator" · "gelistirme" · "modul-yok" · "bilinmiyor" */
export function kurulumOrtami(): string {
  if (onbellek !== null) return onbellek;
  if (__DEV__) {
    onbellek = 'gelistirme';
    return onbellek;
  }
  const modul = requireOptionalNativeModule<KurulumOrtamiModulu>('KurulumOrtami');
  let ortam = 'modul-yok';
  if (modul) {
    try {
      ortam = modul.ortam();
    } catch (hata) {
      console.warn('[reklam] kurulum ortamı okunamadı; reklam gösterilmeyecek', hata);
      ortam = 'bilinmiyor';
    }
  }
  onbellek = ortam;
  return ortam;
}

export function reklamOrtami(): ReklamOrtami {
  const ortam = kurulumOrtami();
  if (ortam === 'gelistirme') return 'test';
  if (Platform.OS === 'ios') {
    if (ortam === 'appstore') return 'canli';
    if (ortam === 'simulator' || ortam === 'xcode') return 'test';
    return 'yok';
  }
  if (Platform.OS === 'android') {
    if (ortam === 'play') return 'canli';
    if (ortam === 'emulator' || ortam === 'diger') return 'test';
    return 'yok';
  }
  return 'yok';
}

/** Canlı birim istenebilir mi? Yalnız App Store (iOS) ya da Google Play (Android) kurulumunda evet. */
export function canliReklamIzni(): boolean {
  return reklamOrtami() === 'canli';
}

/** Google test birimi gösterilebilir mi? Geliştirme, simülatör/emülatör ve elle kurulan derlemede evet. */
export function testReklamIzni(): boolean {
  return reklamOrtami() === 'test';
}

/** Yalnız testler için: önbelleği sıfırlar. */
export function __kurulumOrtamiSifirla(): void {
  onbellek = null;
}

/**
 * Ortama göre birim seçer: mağaza kurulumu → canlı, test ortamı → test birimi, TestFlight / bilinmeyen → '' (reklam yok).
 * Boş kimlik dönen yerde çağıran taraf reklamı hiç oluşturmaz.
 */
export function birimSec(testBirimi: string, canliBirim: string): string {
  const ortam = reklamOrtami();
  if (ortam === 'canli') return canliBirim;
  if (ortam === 'test') return testBirimi;
  return '';
}
