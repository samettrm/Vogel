import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ════════════════════════════════════════════════════════════════
// FIREBASE YAPILANDIRMASI
//
// .env dosyasına şu değerleri ekle (Firebase Console > Proje Ayarları):
//   EXPO_PUBLIC_FIREBASE_API_KEY=
//   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
//   EXPO_PUBLIC_FIREBASE_PROJECT_ID=
//   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
//   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
//   EXPO_PUBLIC_FIREBASE_APP_ID=
//
// Değerler yoksa Firebase devre dışı kalır — uygulama sorunsuz çalışmaya devam eder.
// ════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    _app = !getApps().length
      ? initializeApp(firebaseConfig as Parameters<typeof initializeApp>[0])
      : getApps()[0];

    try {
      _auth = initializeAuth(_app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Zaten init edilmiş (hot reload)
      _auth = getAuth(_app);
    }

    _db = getFirestore(_app);
  } catch (e) {
    if (__DEV__) console.warn('[Firebase] Init hatası:', e);
  }
}

export const firebaseAuth = _auth;
export const firebaseDb   = _db;
