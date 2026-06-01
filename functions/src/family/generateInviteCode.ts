import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import type { FamilyDoc, GenerateInviteCodeResult } from './types';
import {
  calcInviteExpiry,
  familyDocPath,
  generateCode,
  inviteDocPath,
  requireAuth,
} from './helpers';

// ════════════════════════════════════════════════════════════════
// generateInviteCode — owner yeni davet kodu üretir.
//
// Phase 1 strateji: tek bir "currentInviteCode" var, owner yeniden
// üretirse eski kod invalidate edilir (familyInvites doc'u silinmez
// ama family.currentInviteCode değişir; eski kod kabul akışında
// inviteDoc bulamayacağı için reddedilir).
//
// Phase 2'de multi-code support eklenebilir (her üyeye ayrı kod).
//
// Rate limit: yumuşak. Owner saatte 10'dan fazla regenerate ederse
// spam. Şimdilik rate limit yok, Phase 2'de eklenir.
// ════════════════════════════════════════════════════════════════

export const generateInviteCode = onCall<{}, Promise<GenerateInviteCodeResult>>(
  { region: 'europe-west3' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const db = getFirestore();
    const familyRef = db.doc(familyDocPath(uid));

    return db.runTransaction(async (txn) => {
      const familySnap = await txn.get(familyRef);
      if (!familySnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Önce aile planı satın almalısın.',
        );
      }

      const family = familySnap.data() as FamilyDoc;

      // Sadece owner kod üretebilir
      if (family.ownerUid !== uid) {
        throw new HttpsError('permission-denied', 'Sadece aile sahibi davet üretebilir.');
      }

      if (family.status !== 'active') {
        throw new HttpsError(
          'failed-precondition',
          'Aile aboneliği aktif değil.',
        );
      }

      // Yeni kod üret — çakışma kontrolü (pratik olarak 31^6'da çok düşük olasılık)
      // Yine de 3 deneme yap
      let code = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = generateCode();
        const existingDoc = await txn.get(db.doc(inviteDocPath(candidate)));
        if (!existingDoc.exists) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        throw new HttpsError('internal', 'Kod üretilemedi. Yeniden dene.');
      }

      const expiresAt = calcInviteExpiry();
      const now = Timestamp.now();

      // Yeni davet doc'u yaz
      txn.create(db.doc(inviteDocPath(code)), {
        code,
        ownerUid: uid,
        createdAt: now,
        expiresAt,
        consumed: false,
      });

      // Family doc'u güncelle (eski kod authoritatively invalidate olur)
      txn.update(familyRef, {
        currentInviteCode: code,
        currentInviteExpiresAt: expiresAt,
        updatedAt: now,
      });

      logger.info('[generateInviteCode] created', { uid, code });

      return {
        ok: true as const,
        code,
        link: `vogel://invite/${code}`,
        expiresAt: expiresAt.toMillis(),
      };
    });
  },
);
