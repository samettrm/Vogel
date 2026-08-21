import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import type { FamilyDoc } from '../family/types';
import { FAMILY_PRODUCT_ID, GRACE_PERIOD_DAYS } from '../family/types';
import { familyDocPath } from '../family/helpers';

// ════════════════════════════════════════════════════════════════
// rcWebhook — RevenueCat → Firestore family status senkronu
//
// RC Project Settings → Integrations → Webhook URL:
//   https://europe-west3-vogel-3e071.cloudfunctions.net/rcWebhook
//
// Authorization header şart:
//   Bearer ${RC_WEBHOOK_SECRET}
//
// Tetikleyici event'ler:
//   - INITIAL_PURCHASE / RENEWAL → status='active' + entitlementExpiresAt güncelle
//   - CANCELLATION / EXPIRATION  → status='expired' (members listesi 3 gün
//                                  korunur, scheduled function temizler — Phase 2)
//   - BILLING_ISSUE              → status='paused'
//   - PRODUCT_CHANGE             → loglanır, state güncellenmez
//
// Sadece vogel_premium_family product'ı işlenir, diğer product'lar atlanır
// (monthly + yearly RC entitlement'la zaten resolve oluyor, family DB'sini
// etkilemez).
// ════════════════════════════════════════════════════════════════

const RC_WEBHOOK_SECRET = defineSecret('RC_WEBHOOK_SECRET');

interface RCEvent {
  app_user_id?: string;
  product_id?: string;
  type?: string;
  expiration_at_ms?: number | null;
  environment?: 'PRODUCTION' | 'SANDBOX';
  // ─── Satın alma kaydı için (yönetim paneli) ───
  id?: string;
  event_timestamp_ms?: number;
  store?: string;              // APP_STORE | PLAY_STORE | ...
  country_code?: string;       // mağazanın bildirdiği ülke
  price_in_purchased_currency?: number;
  currency?: string;
  period_type?: string;        // NORMAL | TRIAL | INTRO
  // Diğer field'lar göz ardı edilir
}

interface RCWebhookPayload {
  api_version?: string;
  event?: RCEvent;
}

export const rcWebhook = onRequest(
  {
    region: 'europe-west3',
    secrets: [RC_WEBHOOK_SECRET],
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    // ─── Authorization ───
    const authHeader = req.get('authorization') || '';
    const expected = `Bearer ${RC_WEBHOOK_SECRET.value()}`;
    if (authHeader !== expected) {
      logger.warn('[rcWebhook] unauthorized request', {
        hasAuth: !!authHeader,
      });
      res.status(401).send('Unauthorized');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const body = req.body as RCWebhookPayload;
    const event = body?.event;

    if (!event || !event.app_user_id || !event.product_id || !event.type) {
      logger.error('[rcWebhook] malformed event', { body });
      res.status(400).send('Bad Request');
      return;
    }

    // ─── Satın alma kaydı (TÜM ürünler) ────────────────────────────
    // Yönetim paneli "kaç kişi satın almış" sayısını buradan okur.
    // Family kısayolundan ÖNCE çalışır, yoksa aylık/yıllık satın almalar
    // hiç kaydedilmezdi (eski davranış buydu).
    // Idempotent: RC event id'si doküman kimliği olarak kullanılır, aynı
    // webhook iki kez gelirse tek kayıt kalır.
    await recordPurchaseEvent(event);

    // Sadece family product'ı işle
    if (event.product_id !== FAMILY_PRODUCT_ID) {
      logger.info('[rcWebhook] non-family product, skip', {
        productId: event.product_id,
        type: event.type,
      });
      res.status(200).send('OK (non-family, skipped)');
      return;
    }

    const ownerUid = event.app_user_id;
    const eventType = event.type;
    const db = getFirestore();
    const familyRef = db.doc(familyDocPath(ownerUid));

    try {
      const familySnap = await familyRef.get();
      if (!familySnap.exists) {
        // Owner henüz family doc oluşturmamış (ensureFamilyOwner çağrılmamış)
        // İlk RC purchase webhook'u client-side setup'tan önce gelirse normal
        logger.info('[rcWebhook] family doc not found, skipping', {
          ownerUid,
          eventType,
        });
        res.status(200).send('OK (no family doc)');
        return;
      }

      const now = Timestamp.now();
      const updates: Partial<FamilyDoc> & { updatedAt: Timestamp } = {
        updatedAt: now,
      };

      switch (eventType) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'UNCANCELLATION':
          updates.status = 'active';
          if (event.expiration_at_ms) {
            updates.entitlementExpiresAt = Timestamp.fromMillis(
              event.expiration_at_ms,
            );
          }
          break;

        case 'CANCELLATION':
        case 'EXPIRATION':
        case 'SUBSCRIPTION_PAUSED':
          updates.status = 'expired';
          if (event.expiration_at_ms) {
            updates.entitlementExpiresAt = Timestamp.fromMillis(
              event.expiration_at_ms,
            );
          }
          // Member purge: grace period sonrası scheduled function temizler
          // (cleanupExpiredFamilies — Phase 2). Bu webhook'ta status sadece
          // 'expired'a çekilir, members listesi korunur.
          break;

        case 'BILLING_ISSUE':
          updates.status = 'paused';
          break;

        case 'PRODUCT_CHANGE':
        case 'NON_RENEWING_PURCHASE':
        case 'TRANSFER':
        default:
          // Sadece logla, state değiştirme
          logger.info('[rcWebhook] event ignored', { ownerUid, eventType });
          res.status(200).send('OK (ignored)');
          return;
      }

      await familyRef.update(updates);

      logger.info('[rcWebhook] family updated', {
        ownerUid,
        eventType,
        newStatus: updates.status,
      });

      res.status(200).send('OK');
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[rcWebhook] processing failed', {
        ownerUid,
        eventType,
        message: error.message,
      });
      res.status(500).send('Internal Error');
    }
  },
);

// Future: cleanupExpiredFamilies scheduled function (Phase 2)
// 6 saatte bir tarar, entitlementExpiresAt + GRACE_PERIOD_DAYS geçmiş
// olan family'leri full delete + member purge.
export { GRACE_PERIOD_DAYS };

// ════════════════════════════════════════════════════════════════
// recordPurchaseEvent — /purchases/{eventId}
//
// Panelin satın alma sayıları ve ülke kırılımı için. Yalnızca gelir
// doğuran event tipleri kaydedilir; iptal/yenileme-hatası gibi durumlar
// ayrı tip olarak yazılır ki "aktif abone" ile "toplam satın alma"
// birbirine karışmasın.
//
// SANDBOX event'leri işaretlenir ama silinmez — test satın almaları
// gerçek rakamları şişirmesin diye panel bunları ayıklar.
//
// Hata durumunda webhook'u DÜŞÜRMEZ: aile planı senkronu bu kayıttan
// daha kritik, onu bloke etmemeli.
// ════════════════════════════════════════════════════════════════
async function recordPurchaseEvent(event: RCEvent): Promise<void> {
  const REVENUE_TYPES = new Set([
    'INITIAL_PURCHASE',
    'RENEWAL',
    'NON_RENEWING_PURCHASE',
    'UNCANCELLATION',
    'PRODUCT_CHANGE',
  ]);
  const CHURN_TYPES = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE']);

  const type = event.type ?? 'UNKNOWN';
  if (!REVENUE_TYPES.has(type) && !CHURN_TYPES.has(type)) return;

  try {
    const db = getFirestore();
    // RC event id yoksa deterministik bir anahtar üret (idempotency korunur)
    const id =
      event.id ??
      `${event.app_user_id ?? 'anon'}_${type}_${event.event_timestamp_ms ?? Date.now()}`;

    await db
      .collection('purchases')
      .doc(id)
      .set(
        {
          uid: event.app_user_id ?? null,
          productId: event.product_id ?? null,
          type,
          kind: REVENUE_TYPES.has(type) ? 'revenue' : 'churn',
          store: event.store ?? null,
          country: event.country_code ? String(event.country_code).toUpperCase() : null,
          price: typeof event.price_in_purchased_currency === 'number'
            ? event.price_in_purchased_currency
            : null,
          currency: event.currency ?? null,
          periodType: event.period_type ?? null,
          isSandbox: event.environment === 'SANDBOX',
          at: event.event_timestamp_ms ?? Date.now(),
        },
        { merge: true },
      );
  } catch (err: unknown) {
    const e = err as { message?: string };
    logger.error('[rcWebhook] satın alma kaydedilemedi', { err: e.message });
  }
}
