import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import {
  FAMILY_PRODUCT_ID,
  MEMBER_LIMIT,
  type EnsureFamilyOwnerResult,
  type FamilyDoc,
} from './types';
import { buildMember, familyDocPath, requireAuth, userFamilyRefPath } from './helpers';

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

    // ⚠️ EXPONENTIAL-PREMIUM GUARD: başka bir ailenin AKTİF üyesi (familyRef.removedAt == null)
    // kendi aile planını AÇAMAZ. Aksi halde her üye owner olup 5 kişi daha davet eder →
    // 1 abonelik katlanarak çoğalır. Client gate'in atlandığı durumlar için sunucu kilidi.
    const refSnap = await db.doc(userFamilyRefPath(uid)).get();
    const refData = refSnap.exists ? refSnap.data() : null;
    if (refData && refData.removedAt == null) {
      logger.warn('[ensureFamilyOwner] blocked: active member of another family', {
        uid,
        ownerUid: refData.ownerUid,
      });
      throw new HttpsError(
        'failed-precondition',
        'Başka bir aile planının aktif üyesisin; kendi aile planını açamazsın.',
      );
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
