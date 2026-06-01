import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  FAMILY_PRODUCT_ID,
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  INVITE_EXPIRY_HOURS,
  type FamilyDoc,
  type FamilyMember,
} from './types';
import { randomBytes } from 'crypto';

// ════════════════════════════════════════════════════════════════
// Yardımcı fonksiyonlar
// ════════════════════════════════════════════════════════════════

/**
 * Crypto-secure random davet kodu üret.
 * Format: 6 karakter, karışmaya açık harfler hariç (O, 0, I, 1, L).
 * Çakışma olasılığı: 31^6 ≈ 887M kombinasyon, pratik olarak yok.
 */
export function generateCode(length = INVITE_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += INVITE_CODE_ALPHABET[bytes[i] % INVITE_CODE_ALPHABET.length];
  }
  return code;
}

/**
 * Davet kodunun expire olduğu Timestamp'i hesapla.
 */
export function calcInviteExpiry(hours = INVITE_EXPIRY_HOURS): Timestamp {
  const now = Date.now();
  const expiresMs = now + hours * 60 * 60 * 1000;
  return Timestamp.fromMillis(expiresMs);
}

/**
 * Kullanıcının request.auth.uid'i alır, yoksa unauthenticated atar.
 */
export function requireAuth(authUid: string | undefined): string {
  if (!authUid) {
    throw new HttpsError(
      'unauthenticated',
      'Bu işlem için giriş yapmalısın.',
    );
  }
  return authUid;
}

/**
 * Bir family doc'unda kullanıcı var mı kontrol et.
 */
export function isMemberOf(family: FamilyDoc, uid: string): boolean {
  return family.members.some((m) => m.uid === uid);
}

/**
 * Bir family doc'unda kapasitenin dolu olup olmadığını kontrol et.
 */
export function isFamilyFull(family: FamilyDoc): boolean {
  return family.members.length >= family.memberLimit;
}

/**
 * Kullanıcının zaten başka bir family'de üye olup olmadığını kontrol et.
 * /users/{uid}/familyRef/current var ve removedAt == null ise true döner.
 */
export async function isInAnotherFamily(uid: string): Promise<{
  inFamily: boolean;
  ownerUid?: string;
}> {
  const db = getFirestore();
  const refDoc = await db.doc(`users/${uid}/familyRef/current`).get();
  if (!refDoc.exists) return { inFamily: false };
  const data = refDoc.data();
  if (!data || data.removedAt !== null) return { inFamily: false };
  return { inFamily: true, ownerUid: data.ownerUid };
}

/**
 * Bir kullanıcının displayName'ini Firebase Auth'tan al, yoksa email'den türet.
 */
export async function getUserDisplayName(uid: string): Promise<string> {
  const { getAuth } = await import('firebase-admin/auth');
  try {
    const user = await getAuth().getUser(uid);
    return user.displayName || user.email?.split('@')[0] || 'Üye';
  } catch {
    return 'Üye';
  }
}

/**
 * Bir kullanıcının email'ini Firebase Auth'tan al.
 */
export async function getUserEmail(uid: string): Promise<string | null> {
  const { getAuth } = await import('firebase-admin/auth');
  try {
    const user = await getAuth().getUser(uid);
    return user.email || null;
  } catch {
    return null;
  }
}

/**
 * Yeni member nesnesi inşa et (joinedAt sunucudan).
 */
export async function buildMember(
  uid: string,
  role: 'owner' | 'member',
): Promise<FamilyMember> {
  const [displayName, email] = await Promise.all([
    getUserDisplayName(uid),
    getUserEmail(uid),
  ]);
  return {
    uid,
    displayName,
    email,
    joinedAt: Timestamp.now(),
    role,
  };
}

/**
 * Atomic incrementi destekleyen Firestore'da family doc path.
 */
export const familyDocPath = (ownerUid: string) => `families/${ownerUid}`;
export const inviteDocPath = (code: string) => `familyInvites/${code}`;
export const userFamilyRefPath = (uid: string) => `users/${uid}/familyRef/current`;

/**
 * Family product ID doğrulayıcı.
 */
export function assertFamilyProduct(productId: string): void {
  if (productId !== FAMILY_PRODUCT_ID) {
    throw new HttpsError(
      'invalid-argument',
      `Beklenmedik ürün: ${productId}. Aile planı bekleniyor.`,
    );
  }
}
