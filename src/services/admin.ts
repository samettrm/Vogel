import { getFunctions, httpsCallable } from 'firebase/functions';
import type { FirebaseApp } from 'firebase/app';
import { firebaseAuth, isFirebaseConfigured } from '../config/firebase';

// ════════════════════════════════════════════════════════════════
// ADMIN SERVİSİ — getAdminStats callable wrapper'ı.
//
// Backend: functions/src/admin/getAdminStats.ts
// Region: europe-west3 — backend ile birebir aynı olmalı.
//
// Salt okunur: hiçbir şey yazmaz.
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
// Tipler — functions/src/admin/types.ts ile birebir
// ─────────────────────────────────────────────────────────────

export interface AdminCountEntry {
  key: string;
  count: number;
}

export interface AdminCountryEntry {
  code: string;
  people: number;
  devices: number;
  onlineNow: number;
  today: number;
}

export interface AdminLiveStats {
  onlineNow: number;
  lastHour: number;
  active24h: number;
  active7d: number;
  active30d: number;
}

export interface AdminReachStats {
  /** Uygulamayı açmış benzersiz kişi. */
  people: number;
  /** Kurulum sayısı — aynı kişi iki cihazda ise 2. */
  installs: number;
  accounts: number;
  newAccounts7d: number;
  newAccounts30d: number;
  capped: boolean;
}

export interface AdminPremiumStats {
  premiumPeople: number;
  familyMembers: number;
  families: number;
  lifetime: number;
}

export interface AdminPurchaseStats {
  events: number;
  buyers: number;
  initialPurchases: number;
  renewals: number;
  churn: number;
  last30d: number;
  byCountry: AdminCountEntry[];
  byProduct: AdminCountEntry[];
  sandboxEvents: number;
  empty: boolean;
}

export interface AdminStats {
  generatedAt: number;
  live: AdminLiveStats;
  reach: AdminReachStats;
  premium: AdminPremiumStats;
  purchases: AdminPurchaseStats;
  countries: AdminCountryEntry[];
  deviceTypes: AdminCountEntry[];
  models: AdminCountEntry[];
  providers: AdminCountEntry[];
  caller: { uid: string; email: string | null };
}

export type AdminStatsResult =
  | { ok: true; stats: AdminStats }
  | { ok: false; error: string; denied: boolean };

/**
 * Yönetim istatistiklerini çeker.
 *
 * denied=true → sunucu yetkiyi reddetti (allowlist'te değil). Panel bu
 * durumda "yetkiniz yok" der; genel ağ hatasından ayırmak önemli, yoksa
 * yetki sorunu "bağlantı hatası" gibi görünüp saatler kaybettirir.
 */
export async function fetchAdminStats(): Promise<AdminStatsResult> {
  const fns = getFns();
  if (!fns) {
    return { ok: false, error: 'Firebase yapılandırılmamış.', denied: false };
  }
  try {
    const call = httpsCallable<{}, AdminStats>(fns, 'getAdminStats');
    const res = await call({});
    return { ok: true, stats: res.data };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    const denied =
      err.code === 'functions/permission-denied' || err.code === 'functions/unauthenticated';
    return {
      ok: false,
      error: err.message || 'İstatistikler alınamadı.',
      denied,
    };
  }
}
