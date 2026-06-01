import type { Timestamp } from 'firebase-admin/firestore';

// ════════════════════════════════════════════════════════════════
// Aile sistemi — paylaşılan tipler ve sabitler
// ════════════════════════════════════════════════════════════════

export const FAMILY_PRODUCT_ID = 'vogel_premium_family' as const;

export const MEMBER_LIMIT = 5; // owner + 5 üye = 6 hesap toplam
export const INVITE_CODE_LENGTH = 6;
export const INVITE_EXPIRY_HOURS = 7 * 24; // 7 gün
export const GRACE_PERIOD_DAYS = 3; // owner iptal sonrası member temizliği

// Davet kodunda karışıklığa yol açan karakterler çıkarıldı (O/0, I/1, L)
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export type FamilyStatus = 'active' | 'expired' | 'paused';
export type FamilyMemberRole = 'owner' | 'member';

export interface FamilyMember {
  uid: string;
  displayName: string;
  email: string | null;
  joinedAt: Timestamp;
  role: FamilyMemberRole;
}

export interface FamilyDoc {
  ownerUid: string;
  status: FamilyStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  productId: typeof FAMILY_PRODUCT_ID;
  entitlementExpiresAt: Timestamp | null;
  memberLimit: number;
  members: FamilyMember[];
  /**
   * Sadece UID'leri içeren flat list — security rules'ta hızlı lookup için
   * (Firestore rules dilinde .map(m => m.uid) gibi lambda desteklenmiyor).
   * members ile birlikte tutulmalı (Cloud Functions ikisini de güncelle).
   */
  memberUids: string[];
  currentInviteCode: string | null;
  currentInviteExpiresAt: Timestamp | null;
}

export interface FamilyInviteDoc {
  code: string;
  ownerUid: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  consumed: boolean; // Phase 1: false kalır (reusable, kapasiteyle sınırlı)
}

export interface UserFamilyRef {
  ownerUid: string;
  joinedAt: Timestamp;
  removedAt: Timestamp | null;
}

// ─────────────────────────────────────────────────────────────
// Callable return tipleri (client-side type inference için
// src/services/family.ts ile birebir aynı tutulmalı)
// ─────────────────────────────────────────────────────────────

export interface EnsureFamilyOwnerResult {
  ok: true;
  ownerUid: string;
  alreadyExists: boolean;
}

export interface GenerateInviteCodeResult {
  ok: true;
  code: string;
  link: string; // vogel://invite/<code>
  expiresAt: number; // ms
}

export interface AcceptInviteResult {
  ok: true;
  ownerUid: string;
  ownerName: string;
  membersCount: number;
}

export interface LeaveFamilyResult {
  ok: true;
  ownerUid: string;
}

export interface RemoveMemberResult {
  ok: true;
  removedUid: string;
  membersCount: number;
}
