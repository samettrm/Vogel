import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import type { FamilyDoc, LeaveFamilyResult } from './types';
import {
  familyDocPath,
  isMemberOf,
  requireAuth,
  userFamilyRefPath,
} from './helpers';

// ════════════════════════════════════════════════════════════════
// leaveFamily — member kendi rızasıyla aileden ayrılır.
//
// Owner ayrılamaz (kendi family planı, sub iptal etmesi gerek).
// Member: family.members'tan çıkar + user/familyRef.removedAt = now.
//
// Premium düşmesi: client tarafında FamilySyncer familyRef.removedAt
// değişikliğini görür, PremiumSyncer'ı tetikler → RC entitlement yoksa
// setPremium(false).
// ════════════════════════════════════════════════════════════════

export const leaveFamily = onCall<{}, Promise<LeaveFamilyResult>>(
  { region: 'europe-west3' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const db = getFirestore();

    // Önce hangi aileye ait olduğunu öğren
    const userRefDoc = await db.doc(userFamilyRefPath(uid)).get();
    if (!userRefDoc.exists) {
      throw new HttpsError('failed-precondition', 'Hiçbir aileye üye değilsin.');
    }
    const userRef = userRefDoc.data();
    if (!userRef || userRef.removedAt !== null) {
      throw new HttpsError('failed-precondition', 'Zaten aileden ayrılmışsın.');
    }
    const ownerUid: string = userRef.ownerUid;

    if (ownerUid === uid) {
      throw new HttpsError(
        'failed-precondition',
        'Aile sahibi planı iptal etmeden ayrılamaz.',
      );
    }

    return db.runTransaction(async (txn) => {
      const familyRef = db.doc(familyDocPath(ownerUid));
      const familySnap = await txn.get(familyRef);

      if (!familySnap.exists) {
        throw new HttpsError('not-found', 'Aile planı bulunamadı.');
      }

      const family = familySnap.data() as FamilyDoc;
      if (!isMemberOf(family, uid)) {
        // State drift: familyRef vardı ama family.members'ta yoktu
        logger.warn('[leaveFamily] state drift detected, cleaning ref', {
          uid,
          ownerUid,
        });
      }

      const now = Timestamp.now();
      const filtered = family.members.filter((m) => m.uid !== uid);

      txn.update(familyRef, {
        members: filtered,
        updatedAt: now,
      });

      txn.update(db.doc(userFamilyRefPath(uid)), {
        removedAt: now,
      });

      logger.info('[leaveFamily] member left', { uid, ownerUid });

      return { ok: true as const, ownerUid };
    });
  },
);
