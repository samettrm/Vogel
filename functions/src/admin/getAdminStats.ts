import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions/v2';

import { ADMIN_EMAILS, ADMIN_UIDS } from './config';
import type {
  AdminCountEntry,
  AdminCountryEntry,
  AdminLiveStats,
  AdminPremiumStats,
  AdminPurchaseStats,
  AdminReachStats,
  AdminStats,
} from './types';

// ════════════════════════════════════════════════════════════════
// getAdminStats — SALT OKUNUR yönetim göstergesi.
//
// Uygulama içi ilerleme (XP, seri, ders) BİLİNÇLİ olarak toplanmıyor.
// Panel ham operasyonel soruya cevap verir: kaç kişi, nereden, hangi
// cihazla, kaçı ödüyor.
//
// Veri kaynakları:
//   Firebase Auth            → kayıtlı hesap, yeni kayıt, giriş yöntemi
//   /users/*/devices/{id}    → kurulum, kişi, ülke, cihaz, presence, premium
//   /purchases/*             → satın alma (rcWebhook yazar)
//   /families/*              → aile planı
//
// ⚠️ İNDİRME SAYISI YOK — o veri yalnızca App Store / Play sunucularında.
//
// Toplama sunucuda yapılır; dışarıya yalnızca toplu sayılar çıkar, hiçbir
// kullanıcının ham kaydı istemciye inmez.
// ════════════════════════════════════════════════════════════════

const AUTH_PAGE_SIZE = 1000;
const MAX_AUTH_PAGES = 10;
const PAGE_SIZE = 500;
const MAX_DOCS = 50000;

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;
const ONLINE_MS = 5 * MIN_MS;

function assertAdmin(auth: CallableRequest['auth']): { uid: string; email: string | null } {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Giriş yapmalısın.');
  const uid = auth.uid;
  const email = (auth.token?.email as string | undefined) ?? null;
  const emailVerified = auth.token?.email_verified === true;
  if (ADMIN_UIDS.includes(uid)) return { uid, email };
  if (email && emailVerified && ADMIN_EMAILS.includes(email.toLowerCase())) return { uid, email };
  logger.warn('[getAdminStats] yetkisiz erişim denemesi', { uid, email });
  throw new HttpsError('permission-denied', 'Bu ekran yalnızca yöneticiye açıktır.');
}

function toEntries(m: Record<string, number>, limit = 40): AdminCountEntry[] {
  return Object.entries(m)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Firebase Auth — kayıtlı hesap sayıları ve giriş yöntemi. */
async function collectAuth(now: number) {
  let accounts = 0;
  let newAccounts7d = 0;
  let newAccounts30d = 0;
  const providers: Record<string, number> = {};
  let capped = false;

  let pageToken: string | undefined;
  let pages = 0;
  do {
    const res = await getAuth().listUsers(AUTH_PAGE_SIZE, pageToken);
    pages += 1;
    for (const u of res.users) {
      accounts += 1;
      const created = Date.parse(u.metadata.creationTime);
      if (!Number.isNaN(created)) {
        const age = now - created;
        if (age <= 7 * DAY_MS) newAccounts7d += 1;
        if (age <= 30 * DAY_MS) newAccounts30d += 1;
      }
      const seen = new Set<string>();
      for (const p of u.providerData) {
        if (seen.has(p.providerId)) continue;
        seen.add(p.providerId);
        providers[p.providerId] = (providers[p.providerId] ?? 0) + 1;
      }
    }
    pageToken = res.pageToken;
    if (pageToken && pages >= MAX_AUTH_PAGES) {
      capped = true;
      logger.warn('[getAdminStats] Auth sayfa tavanı', { accounts });
      break;
    }
  } while (pageToken);

  return { accounts, newAccounts7d, newAccounts30d, providers, capped };
}

/**
 * /users/{uid}/devices/{installId} — panelin ana kaynağı.
 *
 * Her KURULUM bir doküman. Bu yüzden:
 *   installs = doküman sayısı, people = benzersiz uid sayısı.
 * Aktiflik sayıları KİŞİ bazındadır (aynı kişinin iki cihazı tek sayılır),
 * yoksa çok cihazlı kullanıcı rakamları şişirirdi.
 */
async function collectDevices(now: number) {
  const db = getFirestore();

  const people = new Set<string>();
  const online = new Set<string>();
  const hour = new Set<string>();
  const d1 = new Set<string>();
  const d7 = new Set<string>();
  const d30 = new Set<string>();
  const premiumPeople = new Set<string>();
  const lifetimePeople = new Set<string>();

  const deviceTypes: Record<string, number> = {};
  const models: Record<string, number> = {};
  const countries: Record<
    string,
    { people: Set<string>; devices: number; onlineNow: number; today: number }
  > = {};

  let installs = 0;
  let capped = false;
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  for (;;) {
    let q = db.collectionGroup('devices').orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const v = doc.data() as Record<string, unknown>;
      const uid = doc.ref.parent.parent?.id;
      if (!uid) continue;

      installs += 1;
      people.add(uid);

      const seenAt = typeof v.lastSeenAt === 'number' ? v.lastSeenAt : 0;
      const age = seenAt > 0 ? now - seenAt : Number.POSITIVE_INFINITY;
      const isOnline = age <= ONLINE_MS;
      const isToday = age <= DAY_MS;
      if (isOnline) online.add(uid);
      if (age <= HOUR_MS) hour.add(uid);
      if (isToday) d1.add(uid);
      if (age <= 7 * DAY_MS) d7.add(uid);
      if (age <= 30 * DAY_MS) d30.add(uid);

      if (v.isPremium === true) premiumPeople.add(uid);
      if (typeof v.activePlanId === 'string' && /life|lifetime|omur|ömür/i.test(v.activePlanId)) {
        lifetimePeople.add(uid);
      }

      // Cihaz türü: "ios · phone"
      const os = typeof v.platform === 'string' ? v.platform : 'bilinmiyor';
      const dt = typeof v.deviceType === 'string' ? v.deviceType : 'unknown';
      const typeKey = `${os}·${dt}`;
      deviceTypes[typeKey] = (deviceTypes[typeKey] ?? 0) + 1;

      // Model: iOS → "iPhone · iOS 26.6" | Android → "OnePlus OnePlus8Pro"
      const model = typeof v.deviceModel === 'string' && v.deviceModel ? v.deviceModel : null;
      const brand = typeof v.brand === 'string' && v.brand ? v.brand : null;
      const osv = typeof v.osVersion === 'string' && v.osVersion ? v.osVersion : null;
      let modelKey: string;
      if (os === 'ios') {
        modelKey = `${model ?? 'iPhone'}${osv ? ` · iOS ${osv}` : ''}`;
      } else if (model || brand) {
        modelKey = [brand, model].filter(Boolean).join(' ');
      } else {
        modelKey = 'bilinmiyor';
      }
      models[modelKey] = (models[modelKey] ?? 0) + 1;

      // Ülke
      const cc = typeof v.country === 'string' && v.country ? v.country : '??';
      const bucket = (countries[cc] ??= {
        people: new Set<string>(),
        devices: 0,
        onlineNow: 0,
        today: 0,
      });
      bucket.people.add(uid);
      bucket.devices += 1;
      if (isOnline) bucket.onlineNow += 1;
      if (isToday) bucket.today += 1;
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
    if (installs >= MAX_DOCS) {
      capped = true;
      logger.warn('[getAdminStats] cihaz doküman tavanı', { installs });
      break;
    }
  }

  const countryList: AdminCountryEntry[] = Object.entries(countries)
    .map(([code, b]) => ({
      code,
      people: b.people.size,
      devices: b.devices,
      onlineNow: b.onlineNow,
      today: b.today,
    }))
    .sort((a, b) => b.people - a.people);

  const live: AdminLiveStats = {
    onlineNow: online.size,
    lastHour: hour.size,
    active24h: d1.size,
    active7d: d7.size,
    active30d: d30.size,
  };

  return {
    live,
    installs,
    people: people.size,
    capped,
    premiumPeople: premiumPeople.size,
    lifetime: lifetimePeople.size,
    countries: countryList,
    deviceTypes: toEntries(deviceTypes, 12),
    models: toEntries(models, 30),
  };
}

async function collectFamily() {
  const db = getFirestore();
  const snap = await db.collection('families').get();
  let members = 0;
  for (const d of snap.docs) {
    const uids = d.get('memberUids');
    if (Array.isArray(uids)) members += uids.length;
  }
  return { families: snap.size, members };
}

/**
 * /purchases — rcWebhook'un yazdığı satın alma olayları.
 * Koleksiyon webhook genişletildiği andan itibaren dolar; geçmiş satışlar
 * burada yoktur. Boşsa panel sıfır göstermek yerine bunu açıkça söyler.
 */
async function collectPurchases(now: number): Promise<AdminPurchaseStats> {
  const db = getFirestore();
  const s: AdminPurchaseStats = {
    events: 0, buyers: 0, initialPurchases: 0, renewals: 0, churn: 0,
    last30d: 0, byCountry: [], byProduct: [], sandboxEvents: 0, empty: true,
  };
  const buyers = new Set<string>();
  const byCountry: Record<string, Set<string>> = {};
  const byProduct: Record<string, number> = {};

  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let scanned = 0;

  for (;;) {
    let q = db.collection('purchases').orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;
    s.empty = false;

    for (const d of snap.docs) {
      scanned += 1;
      const v = d.data() as Record<string, unknown>;
      if (v.isSandbox === true) { s.sandboxEvents += 1; continue; }
      if (v.kind === 'churn') { s.churn += 1; continue; }

      s.events += 1;
      const type = typeof v.type === 'string' ? v.type : '';
      if (type === 'INITIAL_PURCHASE') s.initialPurchases += 1;
      if (type === 'RENEWAL') s.renewals += 1;
      const at = typeof v.at === 'number' ? v.at : 0;
      if (at > 0 && now - at <= 30 * DAY_MS) s.last30d += 1;

      const prod = typeof v.productId === 'string' && v.productId ? v.productId : 'bilinmiyor';
      byProduct[prod] = (byProduct[prod] ?? 0) + 1;

      const uid = typeof v.uid === 'string' ? v.uid : null;
      if (uid) {
        buyers.add(uid);
        const cc = typeof v.country === 'string' && v.country ? v.country : '??';
        (byCountry[cc] ??= new Set<string>()).add(uid);
      }
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
    if (scanned >= MAX_DOCS) break;
  }

  s.buyers = buyers.size;
  s.byProduct = toEntries(byProduct, 10);
  s.byCountry = toEntries(
    Object.fromEntries(Object.entries(byCountry).map(([k, v]) => [k, v.size])),
    30,
  );
  return s;
}

export const getAdminStats = onCall<{}, Promise<AdminStats>>(
  { region: 'europe-west3' },
  async (request) => {
    const caller = assertAdmin(request.auth);
    const now = Date.now();

    try {
      const [auth, dev, fam, purchases] = await Promise.all([
        collectAuth(now),
        collectDevices(now),
        collectFamily(),
        collectPurchases(now),
      ]);

      const reach: AdminReachStats = {
        people: dev.people,
        installs: dev.installs,
        accounts: auth.accounts,
        newAccounts7d: auth.newAccounts7d,
        newAccounts30d: auth.newAccounts30d,
        capped: auth.capped || dev.capped,
      };

      const premium: AdminPremiumStats = {
        premiumPeople: dev.premiumPeople,
        familyMembers: fam.members,
        families: fam.families,
        lifetime: dev.lifetime,
      };

      logger.info('[getAdminStats] ok', {
        uid: caller.uid,
        people: dev.people,
        installs: dev.installs,
        accounts: auth.accounts,
      });

      return {
        generatedAt: now,
        live: dev.live,
        reach,
        premium,
        purchases,
        countries: dev.countries,
        deviceTypes: dev.deviceTypes,
        models: dev.models,
        providers: toEntries(auth.providers, 8),
        caller,
      };
    } catch (err: unknown) {
      const e = err as { message?: string };
      logger.error('[getAdminStats] hata', { uid: caller.uid, err: e.message });
      throw new HttpsError('internal', 'İstatistikler alınamadı.');
    }
  },
);
