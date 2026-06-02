import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import type {
  AcceptInviteResult,
  FamilyDoc,
  FamilyInviteDoc,
  UserFamilyRef,
} from './types';
import {
  buildMember,
  familyDocPath,
  inviteDocPath,
  isFamilyFull,
  isInAnotherFamily,
  isMemberOf,
  requireAuth,
  userFamilyRefPath,
} from './helpers';

// ════════════════════════════════════════════════════════════════
// acceptInvite — davet edilen kullanıcı kodu girer.
//
// Tek transaction içinde:
//   1. Kullanıcı auth check
//   2. inviteDoc lookup + expiry kontrolü
//   3. Family doc okuma + status/capacity kontrolü
//   4. Çakışma kontrolü: kullanıcı zaten member mi, başka aile mi
//   5. Atomic ekleme: family.members + user/familyRef
//
// İmportant: aktif kendi RC sub'u olan kullanıcının kabul etmesini
// engelleme Phase 1'de SERVER-SIDE değil — bunu client tarafında
// PremiumSyncer üzerinden engelleyeceğiz (RC entitlement aktifse
// "alreadyPremium" hata mesajı göster). Server-side enforcement
// için RC REST API'ye ek çağrı gerek; Phase 2'ye ertelendi.
// ════════════════════════════════════════════════════════════════

interface AcceptInviteData {
  code: string;
}

export const acceptInvite = onCall<AcceptInviteData, Promise<AcceptInviteResult>>(
  { region: 'europe-west3' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const rawCode = (request.data?.code || '').toUpperCase().trim();
    if (!rawCode || rawCode.length < 4 || rawCode.length > 12) {
      throw new HttpsError('invalid-argument', 'Geçersiz davet kodu formatı.');
    }

    // Önce kullanıcının başka aileye üye olup olmadığını kontrol et (txn dışı)
    const other = await isInAnotherFamily(uid);
    if (other.inFamily) {
      throw new HttpsError(
        'already-exists',
        'Zaten başka bir aile planındasın. Önce mevcut aileden ayrıl.',
      );
    }

    const db = getFirestore();

    return db.runTransaction(async (txn) => {
      const inviteRef = db.doc(inviteDocPath(rawCode));
      const inviteSnap = await txn.get(inviteRef);

      if (!inviteSnap.exists) {
        throw new HttpsError('not-found', 'Davet kodu bulunamadı.');
      }

      const invite = inviteSnap.data() as FamilyInviteDoc;

      // Expiry kontrolü
      const now = Timestamp.now();
      if (invite.expiresAt.toMillis() < now.toMillis()) {
        throw new HttpsError('failed-precondition', 'Bu davet kodunun süresi dolmuş.');
      }

      // ⭐ TEK KULLANIMLIK: kullanılmış kod reddedilir. Çıkan/atılan üye AYNI kodla
      // geri giremez; aile sahibinin YENİ kod göndermesi gerekir.
      if (invite.consumed === true) {
        throw new HttpsError(
          'failed-precondition',
          'Bu davet kodu zaten kullanılmış. Aile sahibinden yeni bir kod iste.',
        );
      }

      const ownerUid = invite.ownerUid;
      if (ownerUid === uid) {
        throw new HttpsError(
          'failed-precondition',
          'Kendi davet kodunu kabul edemezsin.',
        );
      }

      // Family doc'u oku
      const familyRef = db.doc(familyDocPath(ownerUid));
      const familySnap = await txn.get(familyRef);
      if (!familySnap.exists) {
        throw new HttpsError('not-found', 'Aile planı bulunamadı.');
      }

      const family = familySnap.data() as FamilyDoc;

      if (family.status !== 'active') {
        throw new HttpsError('failed-precondition', 'Aile planı aktif değil.');
      }

      // Daha önce eklenmiş mi (idempotency)
      if (isMemberOf(family, uid)) {
        logger.info('[acceptInvite] already member, no-op', { uid, ownerUid });
        return {
          ok: true as const,
          ownerUid,
          ownerName: family.members[0]?.displayName || 'Üye',
          membersCount: family.members.length,
        };
      }

      if (isFamilyFull(family)) {
        throw new HttpsError(
          'resource-exhausted',
          'Bu aile planı dolu (5/5 üye).',
        );
      }

      // Yeni üye nesnesi oluştur
      const newMember = await buildMember(uid, 'member');

      // Atomic write: members + memberUids ekle, KODU TÜKET (tek kullanımlık),
      // aktif kodu temizle (bir sonraki davet için owner yeni kod üretmeli).
      const clearCurrentCode =
        family.currentInviteCode === rawCode
          ? { currentInviteCode: null, currentInviteExpiresAt: null }
          : {};
      txn.update(familyRef, {
        members: FieldValue.arrayUnion(newMember),
        memberUids: FieldValue.arrayUnion(uid),
        ...clearCurrentCode,
        updatedAt: now,
      });
      // ⭐ Kodu tek kullanımlık olarak işaretle — bir daha kullanılamaz.
      txn.update(inviteRef, { consumed: true });

      const userRef: UserFamilyRef = {
        ownerUid,
        joinedAt: now,
        removedAt: null,
      };
      txn.set(db.doc(userFamilyRefPath(uid)), userRef, { merge: false });

      const ownerName =
        family.members.find((m) => m.role === 'owner')?.displayName ||
        'Aile sahibi';

      logger.info('[acceptInvite] joined', {
        uid,
        ownerUid,
        membersCount: family.members.length + 1,
      });

      return {
        ok: true as const,
        ownerUid,
        ownerName,
        membersCount: family.members.length + 1,
      };
    });
  },
);
