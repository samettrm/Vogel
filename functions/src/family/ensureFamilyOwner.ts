import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import {
  FAMILY_PRODUCT_ID,
  MEMBER_LIMIT,
  type EnsureFamilyOwnerResult,
  type FamilyDoc,
} from './types';
import { buildMember, familyDocPath, requireAuth } from './helpers';

// ════════════════════════════════════════════════════════════════
// ensureFamilyOwner — owner ilk kez Aile ekranını açtığında çağrılır.
//
// Idempotent: zaten varsa yeniden oluşturmaz, sadece varlığı garanti
// eder. Family product RC tarafında doğrulanmış olmalı (client side
// purchasePlan sonrası tetikleniyor).
//
// İleride: RC server-side entitlement doğrulaması da yapılabilir
// (RC REST API ile subscriber state'i çekilip 'family' product'ı
// aktif mi kontrol). Phase 1'de client trust ediliyor, Phase 2'de
// strict mode.
// ════════════════════════════════════════════════════════════════

export const ensureFamilyOwner = onCall<{}, Promise<EnsureFamilyOwnerResult>>(
  { region: 'europe-west3' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const db = getFirestore();
    const ref = db.doc(familyDocPath(uid));

    const snap = await ref.get();
    if (snap.exists) {
      logger.info('[ensureFamilyOwner] already exists', { uid });
      return { ok: true, ownerUid: uid, alreadyExists: true };
    }

    const ownerMember = await buildMember(uid, 'owner');
    const now = Timestamp.now();

    const newDoc: FamilyDoc = {
      ownerUid: uid,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      productId: FAMILY_PRODUCT_ID,
      entitlementExpiresAt: null,
      memberLimit: MEMBER_LIMIT,
      members: [ownerMember],
      memberUids: [uid],
      currentInviteCode: null,
      currentInviteExpiresAt: null,
    };

    try {
      await ref.create(newDoc);
    } catch (err: unknown) {
      // Race condition: başka bir paralel çağrı az önce oluşturmuş olabilir
      const error = err as { code?: number; message?: string };
      if (error.code === 6 /* ALREADY_EXISTS */) {
        logger.warn('[ensureFamilyOwner] race detected', { uid });
        return { ok: true, ownerUid: uid, alreadyExists: true };
      }
      logger.error('[ensureFamilyOwner] create failed', { uid, err: error.message });
      throw new HttpsError('internal', 'Aile dokümanı oluşturulamadı.');
    }

    logger.info('[ensureFamilyOwner] created', { uid });
    return { ok: true, ownerUid: uid, alreadyExists: false };
  },
);
