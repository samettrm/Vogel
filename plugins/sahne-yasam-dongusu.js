/**
 * PAEM Kolay — SAHNE (UIScene) YAŞAM DÖNGÜSÜ. Xcode 27 / iOS 27 SDK ile derlenen ikilide ZORUNLU.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NEDEN VAR (02-10-2026 · ANTI-SİSTEM FAZ 4.49 · KAPI 100)
 *
 * iOS 27 SDK'sıyla derlenmiş ve UIScene yaşam döngüsünü benimsememiş uygulamayı UIKit açılışta
 * bilerek durdurur (EXC_BREAKPOINT, çerçeve
 * `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`). BUSATER'in üç
 * uygulaması bu yüzden 2.1(a) "crashed on launch" reddi aldı (Büro 22-09, Görev 27-09, Hukuki Sözlük
 * 27-09-2026; üçü de iPad Air 11" M3 · iPadOS 27.0). PAEM'in Build 19–22'si aynı Xcode'la, sahne
 * düzeni OLMADAN alındı; kapı 02-10-2026 ön uçuşunda yakaladı.
 *
 * 🔴 YALNIZ MANİFEST YETMEZ (FAZ 4.49 madde 2): UIKit DELEGEYİ arar. Bu eklenti üçünü birlikte kurar:
 *   1. Info.plist → `UIApplicationSceneManifest` (tek sahne).
 *   2. AppDelegate → React Native artık `didFinishLaunching`'de değil, sahnenin penceresine kurulur;
 *      `configurationForConnecting` aynı delegeyi kodda da bildirir (plist ile çift güvence).
 *   3. SceneDelegate → `delegate.window` bağlanır (Apple/Google giriş sayfaları sunum çıpasını oradan
 *      arar); URL ve NSUserActivity eski AppDelegate yollarına aktarılır (sahne düzeninde UIKit bunları
 *      AppDelegate'e GÖNDERMEZ); etkin/arka plan geçişleri Expo abonelerine iletilir; sahne kopup
 *      yeniden bağlanırsa React ikinci kez başlatılmaz.
 *
 * Desen `Hukuki-Sozluk/plugins/sahne-yasam-dongusu.js` ile aynıdır (iOS 27'de kanıtlandı); o dosya
 * KOPYALANMADI, salt okunup PAEM'in şablonuna uyarlandı. Aynı SDK'daki (Expo 54 · RN 0.81.5) JSPS
 * Kolay da SceneDelegate ile incelemeden geçti.
 *
 * 🔴 `ios/` GITIGNORE'DA ve her derlemede yeniden üretilmiyor. Bu yüzden iki yol birlikte var:
 *   · prebuild → bu eklenti (app.json `plugins`)
 *   · var olan yerel `ios/` → `node scripts/sahne-yerel-uygula.mjs` (AYNI dönüşümü uygular)
 * Dönüşüm tek yerde (`appDelegateDonustur`, `SAHNE_MANIFESTI`) durur; iki yol ayrışamaz.
 *
 * 🔴 SESSİZ KALMAZ: şablon değişmişse HATA FIRLATIR. Yarım uygulanmış sahne düzeni (manifest var,
 * pencere yok) boş ekranla açılır — bu da red sebebidir.
 *
 * Kapı: scripts/test/sahne.test.mjs
 */
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const SAHNE_ADI = 'Default Configuration';

const SAHNE_MANIFESTI = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: SAHNE_ADI,
        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
      },
    ],
  },
};

const PENCERE_KURULUMU =
  /window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*factory\.startReactNative\(\s*withModuleName: "main",\s*in: window,\s*launchOptions: launchOptions\)/;

const LINKING_NIRENGI = '  // Linking API';

const SAHNE_YAPILANDIRMASI = `  // Sahne yapılandırması — Info.plist'teki UIApplicationSceneManifest'in kod karşılığı.
  // Seçici açıkça yazıldı: ExpoAppDelegate bu yöntemi bildirmediği için alt sınıfta
  // Objective-C'ye kendiliğinden açılacağına güvenilmez.
  @objc(application:configurationForConnectingSceneSession:options:)
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    // Yalnız uygulama sahnesi React'i taşır. Harici ekran / yansıtma rolüne delege
    // verilmez; verilseydi o ekranda ikinci bir kopya kurulur ve AppDelegate.window oraya kayardı.
    guard connectingSceneSession.role == .windowApplication else {
      return UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
    }
    let configuration = UISceneConfiguration(name: "${SAHNE_ADI}", sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }

`;

const SAHNE_DELEGESI = `
// MARK: - Sahne yaşam döngüsü (plugins/sahne-yasam-dongusu.js üretir)

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  // Süreç yaşarken iOS arka plandaki sahneyi koparıp sonra yeniden bağlayabilir. React kökü
  // burada tutulur: yeniden bağlanan sahneye ikinci bir React yüzeyi kurulmaz (gezinme yığını
  // ve yarım kalan sınav sıfırlanırdı), aynı kök yeni pencereye takılır.
  private static var reactRootViewController: UIViewController?

  private var appDelegate: AppDelegate? {
    UIApplication.shared.delegate as? AppDelegate
  }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard session.role == .windowApplication, let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = appDelegate, let factory = appDelegate.reactNativeFactory else {
      // didFinishLaunching sahneden önce çalışır; buraya düşmek şablonun bozulduğu
      // anlamına gelir. Boş pencereyle açılmak yerine durur.
      preconditionFailure("SceneDelegate: React Native fabrikası kurulmamış")
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    if let rootViewController = Self.reactRootViewController {
      window.rootViewController = rootViewController
      window.makeKeyAndVisible()
      forward(connectionOptions, to: appDelegate)
      return
    }

    // Soğuk açılış bağlantısı React Native başlamadan önce iletilir; böylece ilk URL
    // kaydı JS ilk kez sorduğunda doludur.
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    forward(connectionOptions, to: appDelegate)

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
    Self.reactRootViewController = window.rootViewController
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = appDelegate else { return }
    for context in URLContexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: Self.openOptions(context))
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    appDelegate?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    appDelegate?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    appDelegate?.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    appDelegate?.applicationDidEnterBackground(UIApplication.shared)
  }

  private func forward(_ connectionOptions: UIScene.ConnectionOptions, to appDelegate: AppDelegate) {
    for context in connectionOptions.urlContexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: Self.openOptions(context))
    }
    for userActivity in connectionOptions.userActivities {
      _ = appDelegate.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
  }

  private static func openOptions(_ context: UIOpenURLContext) -> [UIApplication.OpenURLOptionsKey: Any] {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
    if let sourceApplication = context.options.sourceApplication {
      options[.sourceApplication] = sourceApplication
    }
    if let annotation = context.options.annotation {
      options[.annotation] = annotation
    }
    return options
  }
}
`;

/**
 * Saf dönüşüm: Expo'nun Swift AppDelegate metnini sahne düzenine çevirir.
 * Zaten çevrilmişse aynen döner (idempotent). Şablon tanınmazsa HATA fırlatır.
 */
function appDelegateDonustur(kod) {
  if (kod.includes('class SceneDelegate')) return kod;

  if (!PENCERE_KURULUMU.test(kod)) {
    throw new Error(
      'sahne-yasam-dongusu: didFinishLaunching içindeki pencere kurulumu bulunamadı — Expo şablonu değişmiş olabilir',
    );
  }
  let cikti = kod.replace(
    PENCERE_KURULUMU,
    `// React Native burada BAŞLATILMAZ: pencere sahneye aittir ve
    // SceneDelegate.scene(_:willConnectTo:options:) içinde kurulur.`,
  );

  if (!cikti.includes(LINKING_NIRENGI)) {
    throw new Error('sahne-yasam-dongusu: "// Linking API" nirengisi bulunamadı — Expo şablonu değişmiş olabilir');
  }
  cikti = cikti.replace(LINKING_NIRENGI, `${SAHNE_YAPILANDIRMASI}${LINKING_NIRENGI}`);

  return `${cikti.trimEnd()}\n${SAHNE_DELEGESI}`;
}

function withSahneManifesti(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = SAHNE_MANIFESTI;
    return cfg;
  });
}

function withSahneDelegesi(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('sahne-yasam-dongusu: yalnız Swift AppDelegate destekleniyor');
    }
    cfg.modResults.contents = appDelegateDonustur(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = function sahneYasamDongusu(config) {
  return withSahneDelegesi(withSahneManifesti(config));
};
module.exports.appDelegateDonustur = appDelegateDonustur;
module.exports.SAHNE_MANIFESTI = SAHNE_MANIFESTI;
module.exports.SAHNE_ADI = SAHNE_ADI;
