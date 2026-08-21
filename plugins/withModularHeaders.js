const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin — Podfile'a `use_modular_headers!` enjekte eder.
 *
 * Neden: Google/Firebase Swift pod'ları (AppCheckCore → GoogleUtilities,
 * RecaptchaInterop) statik kütüphane olarak derlenirken module map gerektirir.
 * `@react-native-google-signin/google-signin` + `react-native-google-mobile-ads`
 * en güncel pod sürümlerinde `pod install` şu hatayla patlar:
 *   "The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
 *    `RecaptchaInterop`, which do not define modules."
 *
 * Bu plugin `expo prebuild` her çalıştığında düzeltmeyi tekrar uygular,
 * böylece lokal build (manuel xcodebuild) tekrarlanabilir kalır.
 */
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (!contents.includes('use_modular_headers!')) {
        contents = contents.replace(
          /use_expo_modules!/,
          'use_expo_modules!\n\n  # Google/Firebase Swift pods (AppCheckCore) module map gerektirir\n  use_modular_headers!'
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
