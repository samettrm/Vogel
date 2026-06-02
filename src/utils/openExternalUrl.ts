import { Alert, Linking } from 'react-native';

// ════════════════════════════════════════════════════════════════
// GÜVENLİ HARİCİ LİNK AÇMA — Apple Guideline 3.1.2(c) uyumu
//
// ❌ YASAK:  Linking.openURL(url).catch(() => {})
//    Link sessizce başarısız olursa Apple "işlevsel link yok" diye
//    reddeder (Lexora 3.1.2(c) reddinin sebebi buydu).
//
// ✅ DOĞRU:  canOpenURL → openURL; başarısızsa URL'yi Alert ile göster.
//    Böylece kullanıcı (ve Apple reviewer) linki HER durumda görür —
//    sessiz yutma yok.
// ════════════════════════════════════════════════════════════════

export async function openExternalUrl(
  url: string,
  label = 'Bağlantı',
): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('unsupported');
    await Linking.openURL(url);
  } catch {
    // Açılamadı → URL'yi kullanıcıya göster (kopyalayıp tarayıcıya yapıştırabilir)
    Alert.alert(label, url, [{ text: 'Tamam' }]);
  }
}
