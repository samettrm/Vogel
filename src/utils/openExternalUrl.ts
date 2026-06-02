import { Alert, Linking } from 'react-native';

// ════════════════════════════════════════════════════════════════
// GÜVENLİ HARİCİ LİNK AÇMA — Apple Guideline 3.1.2(c)
//
// ❌ canOpenURL YASAK: iPad sandbox'ta (reviewer cihazı) https için bile
//    spurious "false" dönebiliyor → link sessizce ölür → Apple "işlevsel
//    link yok" diye reddeder (Lexora 3.1.2(c) reddinin kök sebebi buydu).
// ❌ .catch(() => {}) YASAK: sessiz yutma.
//
// ✅ Sıra: WebBrowser (SafariViewController, in-app) → Linking.openURL
//    (sistem tarayıcı, ÖN-KONTROL YOK) → son çare Alert ile URL göster.
//    Hiçbir aşamada canOpenURL ile kapı kontrolü yapılmaz.
// ════════════════════════════════════════════════════════════════

export async function openExternalUrl(
  url: string,
  label = 'Bağlantı',
): Promise<void> {
  // 1) expo-web-browser (lazy require — Expo Go / crash güvenli)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebBrowser = require('expo-web-browser');
    if (WebBrowser?.openBrowserAsync) {
      await WebBrowser.openBrowserAsync(url);
      return;
    }
  } catch {
    // WebBrowser yok / açılamadı → sistem tarayıcısına düş
  }
  // 2) Sistem tarayıcısı — canOpenURL KAPISI YOK (spurious false sorununu önler)
  try {
    await Linking.openURL(url);
    return;
  } catch {
    // 3) Son çare: URL'yi göster (kullanıcı kopyalayıp tarayıcıya yapıştırabilir)
    Alert.alert(label, url, [{ text: 'Tamam' }]);
  }
}
