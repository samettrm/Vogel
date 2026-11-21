import ExpoModulesCore

/// KURULUM ORTAMI — canlı reklam kararı için (Emir Defteri A13 · 21-11-2026).
///
/// `__DEV__` TestFlight'ı App Store'dan ayıramaz: ikisi de aynı yayın derlemesidir. 21-11-2026'da yayıncı hesabı
/// kalıcı kapandı; TestFlight'ta canlı reklam gösterilmesi açıklardan biriydi. Bu modül ortamı adıyla söyler:
///   "appstore"   — App Store'dan kurulmuş (makbuz adı `receipt`, imza profili yok)  → canlı reklam serbest
///   "testflight" — TestFlight (makbuz adı `sandboxReceipt`, imza profili yok)        → yalnız test reklamı
///   "xcode"      — Xcode, ad hoc ya da kurumsal kurulum (pakette imza profili var)    → yalnız test reklamı
///   "simulator"  — simülatör                                                         → yalnız test reklamı
///   "bilinmiyor" — makbuz adı okunamadı                                              → yalnız test reklamı
public class KurulumOrtamiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KurulumOrtami")

    Function("ortam") { () -> String in
      return KurulumOrtamiModule.hesapla()
    }
  }

  static func hesapla() -> String {
    #if targetEnvironment(simulator)
      return "simulator"
    #else
      // App Store ve TestFlight paketinde imza profili bulunmaz; Xcode / ad hoc / kurumsal kurulumda bulunur.
      // Kaynak: Apple TN3125 "Inside Code Signing: Provisioning Profiles" › Profile location.
      if Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") != nil {
        return "xcode"
      }
      switch Bundle.main.appStoreReceiptURL?.lastPathComponent {
      case "receipt":
        return "appstore"
      case "sandboxReceipt":
        return "testflight"
      default:
        return "bilinmiyor"
      }
    #endif
  }
}
