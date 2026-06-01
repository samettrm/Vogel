import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '../config/firebase';
import type { FirebaseApp } from 'firebase/app';

// ════════════════════════════════════════════════════════════════
// FAMILY SERVİSİ — Cloud Functions callable wrapper'ları + Firestore
// listener'ları.
//
// Backend: D:\Vogel\functions\src\family\* ve webhooks/rcWebhook.ts
//
// Region: europe-west3 (Frankfurt) — backend ile birebir aynı olmalı.
//
// Tüm fonksiyonlar Firebase yapılandırılmamışsa graceful no-op döner.
// ════════════════════════════════════════════════════════════════

const FUNCTIONS_REGION = 'europe-west3';

function getFns() {
  if (!isFirebaseConfigured || !firebaseAuth) return null;
  try {
    const app = (firebaseAuth as unknown as { app: FirebaseApp }).app;
    return getFunctions(app, FUNCTIONS_REGION);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Tipler — backend types.ts ile birebir
// ─────────────────────────────────────────────────────────────

export interface FamilyMember {
  uid: string;
  displayName: string;
  email: string | null;
  joinedAt: number; // ms (Firestore Timestamp client tarafında number'a çevrilir)
  role: 'owner' | 'member';
}

export interface FamilyDocClient {
  ownerUid: string;
  status: 'active' | 'expired' | 'paused';
  createdAt: number;
  updatedAt: number;
  productId: string;
  entitlementExpiresAt: number | null;
  memberLimit: number;
  members: FamilyMember[];
  currentInviteCode: string | null;
  currentInviteExpiresAt: number | null;
}

export interface UserFamilyRefClient {
  ownerUid: string;
  joinedAt: number;
  removedAt: number | null;
}

// ─────────────────────────────────────────────────────────────
// Callable wrapper'lar
// ─────────────────────────────────────────────────────────────

export async function ensureFamilyOwner(): Promise<
  { ok: true; ownerUid: string; alreadyExists: boolean } | { ok: false; error: string }
> {
  const fns = getFns();
  if (!fns) return { ok: false, error: 'Firebase yapılandırılmamış.' };
  try {
    const call = httpsCallable<{}, { ok: true; ownerUid: string; alreadyExists: boolean }>(
      fns,
      'ensureFamilyOwner',
    );
    const result = await call({});
    return result.data;
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: err.message || 'Aile dokümanı oluşturulamadı.' };
  }
}

export async function generateInviteCode(): Promise<
  | { ok: true; code: string; link: string; expiresAt: number }
  | { ok: false; error: string }
> {
  const fns = getFns();
  if (!fns) return { ok: false, error: 'Firebase yapılandırılmamış.' };
  try {
    const call = httpsCallable<
      {},
      { ok: true; code: string; link: string; expiresAt: number }
    >(fns, 'generateInviteCode');
    const result = await call({});
    return result.data;
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: err.message || 'Kod üretilemedi.' };
  }
}

export async function acceptInvite(
  code: string,
): Promise<
  | { ok: true; ownerUid: string; ownerName: string; membersCount: number }
  | { ok: false; error: string; reason?: 'expired' | 'full' | 'already-in' | 'unknown' }
> {
  const fns = getFns();
  if (!fns) return { ok: false, error: 'Firebase yapılandırılmamış.' };
  try {
    const call = httpsCallable<
      { code: string },
      { ok: true; ownerUid: string; ownerName: string; membersCount: number }
    >(fns, 'acceptInvite');
    const result = await call({ code });
    return result.data;
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    let reason: 'expired' | 'full' | 'already-in' | 'unknown' = 'unknown';
    if (err.code?.includes('failed-precondition')) reason = 'expired';
    else if (err.code?.includes('resource-exhausted')) reason = 'full';
    else if (err.code?.includes('already-exists')) reason = 'already-in';
    return { ok: false, error: err.message || 'Davet kabul edilemedi.', reason };
  }
}

export async function leaveFamily(): Promise<
  { ok: true; ownerUid: string } | { ok: false; error: string }
> {
  const fns = getFns();
  if (!fns) return { ok: false, error: 'Firebase yapılandırılmamış.' };
  try {
    const call = httpsCallable<{}, { ok: true; ownerUid: string }>(fns, 'leaveFamily');
    const result = await call({});
    return result.data;
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: err.message || 'Aileden ayrılınamadı.' };
  }
}

export async function removeFamilyMember(
  memberUid: string,
): Promise<
  | { ok: true; removedUid: string; membersCount: number }
  | { ok: false; error: string }
> {
  const fns = getFns();
  if (!fns) return { ok: false, error: 'Firebase yapılandırılmamış.' };
  try {
    const call = httpsCallable<
      { memberUid: string },
      { ok: true; removedUid: string; membersCount: number }
    >(fns, 'removeFamilyMember');
    const result = await call({ memberUid });
    return result.data;
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: err.message || 'Üye çıkarılamadı.' };
  }
}

// ─────────────────────────────────────────────────────────────
// Firestore listener'lar (client-side canlı sync)
// ─────────────────────────────────────────────────────────────

/**
 * Owner kendi family doc'unu izler (member listesi + status + invite code değişiklikleri).
 */
export function subscribeToFamilyDoc(
  ownerUid: string,
  onUpdate: (data: FamilyDocClient | null) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !firebaseDb) {
    onUpdate(null);
    return () => {};
  }
  try {
    return onSnapshot(
      doc(firebaseDb, 'families', ownerUid),
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
          return;
        }
        const raw = snap.data() as Record<string, unknown>;
        onUpdate(normalizeFamilyDoc(raw));
      },
      () => onUpdate(null),
    );
  } catch {
    return () => {};
  }
}

/**
 * Member kendi familyRef'ini izler (premium grant doğrulama için).
 */
export function subscribeToFamilyRef(
  uid: string,
  onUpdate: (data: UserFamilyRefClient | null) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !firebaseDb) {
    onUpdate(null);
    return () => {};
  }
  try {
    return onSnapshot(
      doc(firebaseDb, 'users', uid, 'familyRef', 'current'),
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
          return;
        }
        const raw = snap.data() as Record<string, unknown>;
        onUpdate(normalizeFamilyRef(raw));
      },
      () => onUpdate(null),
    );
  } catch {
    return () => {};
  }
}

// ─────────────────────────────────────────────────────────────
// Helper'lar — Firestore Timestamp → number dönüşümü
// ─────────────────────────────────────────────────────────────

function tsToMs(ts: unknown): number {
  if (!ts) return 0;
  const t = ts as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  return 0;
}

function tsToMsOrNull(ts: unknown): number | null {
  if (ts == null) return null;
  return tsToMs(ts);
}

function normalizeFamilyDoc(raw: Record<string, unknown>): FamilyDocClient {
  return {
    ownerUid: raw.ownerUid as string,
    status: raw.status as 'active' | 'expired' | 'paused',
    createdAt: tsToMs(raw.createdAt),
    updatedAt: tsToMs(raw.updatedAt),
    productId: raw.productId as string,
    entitlementExpiresAt: tsToMsOrNull(raw.entitlementExpiresAt),
    memberLimit: (raw.memberLimit as number) || 5,
    members: ((raw.members as Array<Record<string, unknown>>) || []).map((m) => ({
      uid: m.uid as string,
      displayName: m.displayName as string,
      email: (m.email as string | null) ?? null,
      joinedAt: tsToMs(m.joinedAt),
      role: m.role as 'owner' | 'member',
    })),
    currentInviteCode: (raw.currentInviteCode as string | null) ?? null,
    currentInviteExpiresAt: tsToMsOrNull(raw.currentInviteExpiresAt),
  };
}

function normalizeFamilyRef(raw: Record<string, unknown>): UserFamilyRefClient {
  return {
    ownerUid: raw.ownerUid as string,
    joinedAt: tsToMs(raw.joinedAt),
    removedAt: tsToMsOrNull(raw.removedAt),
  };
}
