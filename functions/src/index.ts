// ════════════════════════════════════════════════════════════════
// Vogel — Cloud Functions entry point
//
// Region: europe-west3 (Frankfurt) — TR/DE pazarına yakın, RC
// webhook latency'si AB'de daha düşük.
//
// Tüm callable + HTTPS function'lar v2 SDK kullanır (v1 deprecated).
// ════════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

setGlobalOptions({
  region: 'europe-west3',
  maxInstances: 10,
});

// ─────────────────────────────────────────────────────────────
// Family-invite callable functions
// ─────────────────────────────────────────────────────────────
export { ensureFamilyOwner } from './family/ensureFamilyOwner';
export { generateInviteCode } from './family/generateInviteCode';
export { acceptInvite } from './family/acceptInvite';
export { leaveFamily } from './family/leaveFamily';
export { removeFamilyMember } from './family/removeFamilyMember';

// ─────────────────────────────────────────────────────────────
// RevenueCat webhook (HTTPS)
// ─────────────────────────────────────────────────────────────
export { rcWebhook } from './webhooks/rcWebhook';
