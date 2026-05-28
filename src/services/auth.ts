import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { firebaseAuth, isFirebaseConfigured } from '../config/firebase';

// ════════════════════════════════════════════════════════════════
// AUTH SERVİSİ — Email · Google · Apple
//
// Firebase yapılandırılmamışsa tüm fonksiyonlar hata döner (graceful).
// Google ve Apple modülleri lazy require ile yüklenir — platform uyumsuzluğunda
// uygulama crash etmez.
// ════════════════════════════════════════════════════════════════

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; code: string; message: string };

// ─── Email / Şifre ────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth)
    return _notConfigured();
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return { ok: true, user: cred.user };
  } catch (e: any) {
    return { ok: false, code: e.code ?? 'unknown', message: _mapError(e.code) };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth)
    return _notConfigured();
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    // Doğrulama e-postasını hemen gönder — best-effort, başarısız olursa
    // kullanıcı verify ekranındaki "Yeniden gönder" butonunu kullanabilir.
    try { await sendEmailVerification(cred.user); } catch {}
    return { ok: true, user: cred.user };
  } catch (e: any) {
    return { ok: false, code: e.code ?? 'unknown', message: _mapError(e.code) };
  }
}

// ─── Email Verification ────────────────────────────────────────────

/**
 * Aktif kullanıcıya doğrulama e-postası gönderir (resend).
 * Rate-limit edilebilir (auth/too-many-requests) — UI cooldown ile kullansın.
 */
export async function sendVerificationEmail(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth) return _notConfigured();
  const user = firebaseAuth.currentUser;
  if (!user) return { ok: false, code: 'no-user', message: 'Önce giriş yap.' };
  try {
    await sendEmailVerification(user);
    return { ok: true, user };
  } catch (e: any) {
    return { ok: false, code: e.code ?? 'unknown', message: _mapError(e.code) };
  }
}

/**
 * Aktif kullanıcıyı sunucudan yeniden çeker ve emailVerified durumunu döner.
 * Verify ekranı bunu polling ile çağırır — kullanıcı linke tıklayınca true döner.
 */
export async function reloadCurrentUser(): Promise<boolean> {
  if (!firebaseAuth?.currentUser) return false;
  try {
    await reload(firebaseAuth.currentUser);
    return firebaseAuth.currentUser.emailVerified;
  } catch {
    return firebaseAuth.currentUser?.emailVerified ?? false;
  }
}

// ─── Google Sign-In ────────────────────────────────────────────────

/** Google Web Client ID yoksa buton gösterilmez. */
export const isGoogleConfigured = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let _googleSigninModule: any = null;
let _googleConfigured = false;

/**
 * @react-native-google-signin/google-signin modülünü güvenli şekilde yükler.
 * Expo Go'da native modül yok → null döner, crash etmez.
 */
function _loadGoogleSigninModule(): any | null {
  if (_googleSigninModule) return _googleSigninModule;
  try {
    _googleSigninModule = require('@react-native-google-signin/google-signin');
    return _googleSigninModule;
  } catch {
    return null;
  }
}

export function configureGoogleSignIn(): void {
  if (!isGoogleConfigured || _googleConfigured) return;
  const mod = _loadGoogleSigninModule();
  if (!mod?.GoogleSignin) return;
  try {
    mod.GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
    });
    _googleConfigured = true;
  } catch {}
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth) return _notConfigured();
  // Lazy load + lazy configure — Expo Go'da bile çağrılırsa crash olmaz
  configureGoogleSignIn();
  const mod = _loadGoogleSigninModule();
  if (!mod?.GoogleSignin) {
    return {
      ok: false,
      code: 'native-module-missing',
      message: 'Google girişi için development build gerekiyor (Expo Go\'da çalışmaz).',
    };
  }
  const { GoogleSignin } = mod;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signIn();
    const { idToken } = await GoogleSignin.getTokens();
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(firebaseAuth, credential);
    return { ok: true, user: cred.user };
  } catch (e: any) {
    const cancelled =
      e.code === 'SIGN_IN_CANCELLED' ||
      e.code === '12501' || // Android cancelled
      e.message?.includes('cancelled');
    if (cancelled) return { ok: false, code: 'cancelled', message: '' };
    // Hata kodunu ve gerçek mesajı geçir — debug için
    const code = String(e.code ?? 'unknown');
    const rawMsg = e.message ?? e.toString?.() ?? 'bilinmeyen';
    return {
      ok: false,
      code,
      message: `Google girişi başarısız.\n${rawMsg.slice(0, 120)}`,
    };
  }
}

// ─── Apple Sign-In ─────────────────────────────────────────────────

export const isAppleAvailable = Platform.OS === 'ios';

export async function signInWithApple(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth) return _notConfigured();
  if (!isAppleAvailable)
    return { ok: false, code: 'platform', message: 'Apple giriş sadece iOS\'ta çalışır.' };

  // expo-apple-authentication modülünü güvenli yükle — Expo Go'da yoksa graceful hata
  let AppleAuth: any;
  try {
    AppleAuth = require('expo-apple-authentication');
  } catch {
    return {
      ok: false,
      code: 'native-module-missing',
      message: 'Apple girişi için development build gerekiyor (Expo Go\'da çalışmaz).',
    };
  }

  try {
    const appleCredential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });
    const { identityToken } = appleCredential;
    if (!identityToken)
      return { ok: false, code: 'no-token', message: 'Apple kimlik doğrulama başarısız.' };

    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken });
    const cred = await signInWithCredential(firebaseAuth, credential);

    // 🔑 Apple Sign-In fullName SADECE ilk girişte gelir (Apple privacy policy).
    // Sonraki girişlerde appleCredential.fullName null olur — bu yüzden ilk
    // girişte updateProfile ile Firebase user record'una manuel yazıyoruz.
    // Aksi halde user.displayName boş kalır, RC $displayName attribute'u set
    // edilemez, Dashboard'da kullanıcı isimle aranabilir olmaz.
    if (appleCredential.fullName && !cred.user.displayName) {
      const fullName = appleCredential.fullName as {
        givenName?: string | null;
        familyName?: string | null;
      };
      const composed = [fullName.givenName, fullName.familyName]
        .filter((p): p is string => !!p && p.trim().length > 0)
        .join(' ')
        .trim();
      if (composed) {
        try {
          await updateProfile(cred.user, { displayName: composed });
          if (__DEV__) console.log('[Apple] displayName persisted:', composed);
        } catch (e) {
          if (__DEV__) console.warn('[Apple] displayName persist failed:', e);
        }
      }
    }

    return { ok: true, user: cred.user };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED')
      return { ok: false, code: 'cancelled', message: '' };
    return { ok: false, code: e.code ?? 'unknown', message: 'Apple girişi başarısız.' };
  }
}

// ─── Çıkış ────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured || !firebaseAuth) return;
  // Google session'ını sadece daha önce konfigüre edildiyse temizle —
  // Expo Go'da modül hiç yüklenmemiştir, dokunmuyoruz (require crash eder).
  if (_googleConfigured && _googleSigninModule?.GoogleSignin) {
    try { await _googleSigninModule.GoogleSignin.signOut(); } catch {}
  }
  try { await firebaseSignOut(firebaseAuth); } catch {}
}

// ─── Auth state listener ───────────────────────────────────────────

export function subscribeToAuthState(cb: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured || !firebaseAuth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, cb);
}

// ─── Helpers ──────────────────────────────────────────────────────

function _notConfigured(): AuthResult {
  return { ok: false, code: 'not-configured', message: 'Hesap sistemi henüz etkin değil.' };
}

function _mapError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':    return 'E-posta veya şifre hatalı.';
    case 'auth/wrong-password':        return 'Şifre hatalı.';
    case 'auth/email-already-in-use':  return 'Bu e-posta zaten kullanımda.';
    case 'auth/weak-password':         return 'Şifre en az 6 karakter olmalı.';
    case 'auth/invalid-email':         return 'Geçerli bir e-posta girin.';
    case 'auth/too-many-requests':     return 'Çok fazla deneme. Lütfen bekleyin.';
    case 'auth/network-request-failed':return 'İnternet bağlantısı yok.';
    default:                           return 'Bir hata oluştu. Tekrar deneyin.';
  }
}
