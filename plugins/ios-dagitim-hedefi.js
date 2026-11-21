/**
 * Vogel — iOS DAĞITIM HEDEFİ DÜZELTMESİ (Xcode 27). Kaynak: kalorimetre/plugins/ios-dagitim-hedefi.js (11-10-2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NEDEN VAR (11-10-2026)
 *
 * Bu Mac Xcode 27.0'a geçti; SDK'nın desteklediği en düşük dağıtım hedefi 15.0.
 * CocoaPods'un ürettiği kaynak-paketi alt-hedefleri kendi podspec'lerinin düşük
 * `IPHONEOS_DEPLOYMENT_TARGET` değerini koruyor ve derleme şu hatayla duruyor:
 *
 *   error: The iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is
 *   set to 9.0, but the range of supported deployment target versions is 15.0
 *   to 27.0.x. (in target 'SDWebImage-SDWebImage' from project 'Pods')
 *
 * Kalorimetre'de yedi hedef takıldı: SDWebImage (9.0), RevenueCat ve
 * PurchasesHybridCommon (13.0), RNCAsyncStorage kaynakları (13.4),
 * Google-Mobile-Ads ve GoogleUserMessagingPlatform kaynakları (12.0),
 * RNSVGFilters (12.4). Eski Xcode'da bunlar yalnız uyarıydı; 1.2.0 (build 69)
 * o yüzden derlenebilmişti.
 *
 * React Native'in `react_native_post_install` adımı yalnız
 * `pod_target_installation_results`u geziyor ve bu alt-hedefleri ATLIYOR. Buradaki
 * döngü Pods projesindeki bütün hedefleri kapsar. Uygulamanın kendi hedefi zaten
 * 15.1 (app.json › expo-build-properties › ios.deploymentTarget).
 *
 * 🔴 Biçimlendirilmiş derleme çıktısı bu satırları ❌ ile gösterir ama uyarıları da
 * öyle gösterebilir; gerçek hatayı `.expo/xcodebuild.log` içindeki `error:`
 * satırları söyler.
 *
 * Çözüm `PAEM-Kolay/plugins/ios-imzalama-ve-hedef.js` içindeki dağıtım hedefi
 * yamasıyla aynıdır (18-09-2026). O eklentinin imzalama bölümü buraya ALINMADI:
 * Kalorimetre'nin yayın betiği (scripts/yerel-yayin.sh) imza kimliğini ve
 * profili `xcodebuild`e açıkça veriyor.
 *
 * `ios/` gitignore'da ve her yayın derlemesinde `expo prebuild --clean` ile
 * yeniden üretiliyor; Podfile'a elle yazılan düzeltme kaybolurdu.
 *
 * 🔴 SESSİZ KALMAZ: enjeksiyon noktası bulunamazsa HATA FIRLATIR.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MIN_HEDEF = '15.1';
const IM = '# vogel:dagitim-hedefi'; // idempotens nişanı

const YAMA = `
    ${IM} — Xcode 27 SDK minimumu 15.0. react_native_post_install,
    # CocoaPods'un ürettiği kaynak-paketi alt-hedeflerini atlıyor; bu döngü
    # onları da kapsar. Bkz. plugins/ios-dagitim-hedefi.js
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${MIN_HEDEF}.to_f
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_HEDEF}'
        end
      end
    end
`;

/** Saf dönüşüm: Podfile metnine yamayı ekler. Zaten ekliyse aynen döner. */
function podfileDonustur(podfile) {
  if (podfile.includes(IM)) return podfile;
  const kanca = /react_native_post_install\(\s*installer[\s\S]*?\)\n/;
  if (!kanca.test(podfile)) {
    throw new Error(
      'ios-dagitim-hedefi: Podfile içinde react_native_post_install çağrısı bulunamadı — ' +
        'Expo şablonu değişmiş olabilir. Sessizce geçmiyorum.',
    );
  }
  return podfile.replace(kanca, (eslesme) => eslesme + YAMA);
}

module.exports = function iosDagitimHedefi(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const yol = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      fs.writeFileSync(yol, podfileDonustur(fs.readFileSync(yol, 'utf8')));
      return cfg;
    },
  ]);
};
module.exports.podfileDonustur = podfileDonustur;
module.exports.MIN_HEDEF = MIN_HEDEF;
module.exports.IM = IM;
// Vogel 22-11-2026: 1.0.8 arşivi AppAuth-AppAuthCore_Privacy hedefinde (12.0) durdu; 1.0.7 Xcode 26 ile alınmıştı.
