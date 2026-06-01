import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import type { FamilyDoc, RemoveMemberResult } from './types';
import {
  familyDocPath,
  isMemberOf,
  requireAuth,
  userFamilyRefPath,
} from './helpers';

// ════════════════════════════════════════════════════════════════
// removeFamilyMember — owner bir üyeyi aileden çıkarır.
//
// Sadece owner tetikleyebilir. Kendisini çıkaramaz.
// ════════════════════════════════════════════════════════════════

interface RemoveMemberData {
  memberUid: string;
}

export const removeFamilyMember = onCall<RemoveMemberData, Promise<RemoveMemberResult>>(
  { region: 'europe-west3' },
  async (request) => {
    const ownerUid = requireAuth(request.auth?.uid);
    const memberUid = (request.data?.memberUid || '').trim();

    if (!memberUid) {
      throw new HttpsError('invalid-argument', 'Geçersiz üye id.');
    }
    if (memberUid === ownerUid) {
      throw new HttpsError(
        'failed-precondition',
        'Kendini aileden çıkaramazsın.',
      );
    }

    const db = getFirestore();

    return db.runTransaction(async (txn) => {
      const familyRef = db.doc(familyDocPath(ownerUid));
      const familySnap = await txn.get(familyRef);

      if (!familySnap.exists) {
        throw new HttpsError('not-found', 'Aile planı bulunamadı.');
      }

      const family = familySnap.data() as FamilyDoc;
      if (family.ownerUid !== ownerUid) {
        throw new HttpsError('permission-denied', 'Sadece aile sahibi üye çıkarabilir.');
      }

      if (!isMemberOf(family, memberUid)) {
        throw new HttpsError('not-found', 'Bu üye ailede yok.');
      }

      const now = Timestamp.now();
      const filtered = family.members.filter((m) => m.uid !== memberUid);

      txn.update(familyRef, {
        members: filtered,
        updatedAt: now,
      });

      txn.update(db.doc(userFamilyRefPath(memberUid)), {
        removedAt: now,
      });

      logger.info('[removeFamilyMember] removed', {
        ownerUid,
        removedUid: memberUid,
        membersCount: filtered.length,
      });

      return {
        ok: true as const,
        removedUid: memberUid,
        membersCount: filtered.length,
      };
    });
  },
);
