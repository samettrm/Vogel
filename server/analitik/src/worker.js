/**
 * VOGEL ANALİTİK SUNUCUSU — Owner Control Center + ürün analitiği + güncelleme bildirimi.
 * Emir Defteri A2 · A4 · A5 (BUILD AL 21-11-2026). Canlı Döviz `server/worker.js`'ten uyarlandı.
 *
 *   POST /olay                — istemci olayları (sınıf SUNUCUDA damgalanır; bilinmeyen olay reddedilir)
 *   GET  /owner/durum, /panel — yalnız owner; değilse 404 (panelin varlığı sızmaz)
 *   POST /webhook/revenuecat  — Firebase rcWebhook'unun ilettiği RevenueCat olayı (gelirin tek gerçeği)
 *   POST /guncelleme/kayit    — mağaza kurulumunun push jetonu + sürümü (A2)
 *   POST /guncelleme/tetik    — cron-job.org her 10 dk; sürüm başına tek bildirim (A2)
 *
 * Owner: YALNIZ sağlayıcının doğruladığı sametterme0@gmail.com (owner_kimlikleri). Apple `sub` owner değildir.
 */
import { cihazKaydet, guncellemeTaramasi, kayitCoz } from './guncelleme.js';
import { apiSay, filtreCoz, panelHesapla } from './panel-ek.js';

export default {
  async fetch(request, env, ctx) {
    const yanit = await yonlendir(request, env, ctx);
    const yol = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    apiSay(env, ctx, yol, request.method, yanit.status, yanit.headers.get('x-sunucu-hatasi') === '1');
    return yanit;
  },
};

async function yonlendir(request, env, ctx) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  try {
    if (request.method === 'POST' && path === '/olay') {
      if (rateLimited(`olay:${ip}`, 60, 60_000)) return json({ error: 'rate_limited' }, 429);
      return await handleOlay(request, env);
    }
    if (request.method === 'POST' && path === '/webhook/revenuecat') return await handleRevenueCatWebhook(request, env);
    if (request.method === 'POST' && path === '/guncelleme/kayit') {
      if (rateLimited(`gnc:${ip}`, 20, 60_000)) return json({ error: 'rate_limited' }, 429);
      let govde = null;
      try {
        govde = await request.json();
      } catch {
        return json({ error: 'bicim' }, 400);
      }
      const k = kayitCoz(govde);
      if (!k) return json({ error: 'bicim' }, 400);
      await cihazKaydet(env.DEVICE_DB, k, Date.now());
      return json({ ok: true });
    }
    if (request.method === 'POST' && path === '/guncelleme/tetik') {
      if (rateLimited('gnc-tetik', 6, 60_000)) return json({ error: 'rate_limited' }, 429);
      const r = await guncellemeTaramasi(env);
      return json(r.atlandi ? { atlandi: true } : { gonderim: r.sonuclar, hata_sayisi: r.hatalar.length });
    }
    if (request.method === 'GET' && path === '/owner/durum') {
      const o = await requireOwner(request, env, path);
      if (!o) return json({ error: 'not_found' }, 404);
      return json({ owner: true });
    }
    if (request.method === 'GET' && path === '/panel') {
      const o = await requireOwner(request, env, path);
      if (!o) return json({ error: 'not_found' }, 404);
      const simdi = Math.floor(Date.now() / 1000);
      return json(await panelHesapla(env, filtreCoz(url.searchParams, simdi), simdi));
    }
    return json({ error: 'not_found' }, 404);
  } catch (e) {
    console.error('[vogel-analitik] işlenmeyen hata:', String((e && e.stack) || e).slice(0, 400));
    const r = json({ error: 'server_error' }, 500);
    r.headers.set('x-sunucu-hatasi', '1');
    return r;
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-app-key',
};


// Basit per-IP rate limit (isolate-içi; cold start'ta sıfırlanır, per-colo).
// Yeni uygulama için scripted abuse'u kesmeye yeter. Kalıcı limit için KV gerekir.
const RL = new Map(); // ip -> [timestamps]
function rateLimited(ip, max, windowMs) {
  const now = Date.now();
  const arr = (RL.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    RL.set(ip, arr);
    return true;
  }
  arr.push(now);
  RL.set(ip, arr);
  if (RL.size > 5000) RL.clear(); // bellek koruması
  return false;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

const FIREBASE_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwkCache = { keys: null, expiresAt: 0 };

async function firebaseJwks() {
  const now = Date.now();
  if (jwkCache.keys && now < jwkCache.expiresAt) return jwkCache.keys;
  const res = await fetch(FIREBASE_JWK_URL);
  if (!res.ok) throw new Error('jwks_unavailable');
  const body = await res.json();
  const m = /max-age=(\d+)/.exec(res.headers.get('cache-control') || '');
  const ttlMs = (m ? Math.max(60, parseInt(m[1], 10)) : 3600) * 1000;
  const map = new Map();
  for (const k of body.keys || []) if (k && k.kid) map.set(k.kid, k);
  if (map.size === 0) throw new Error('jwks_empty');
  jwkCache = { keys: map, expiresAt: now + ttlMs };
  return map;
}

function b64urlBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

/**
 * Firebase ID token'ı doğrular ve payload'ı döner; geçersizse null.
 *
 * Kontroller: RS256 + bilinen kid · imza · aud === projectId ·
 * iss === https://securetoken.google.com/<projectId> · exp gelecekte ·
 * iat/auth_time gelecekte DEĞİL · sub dolu.
 *
 * Anonim oturumlar REDDEDİLİR: anonim kullanıcının satın alması olamaz, tabloyu
 * kalıcı çöp satırlarla doldurmasının bir faydası yok.
 */
async function verifyFirebaseIdToken(token, projectId) {
  if (typeof token !== 'string' || !projectId) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header, payload;
  try {
    header = b64urlJson(parts[0]);
    payload = b64urlJson(parts[1]);
  } catch {
    return null;
  }
  if (!header || header.alg !== 'RS256' || !header.kid) return null;

  const jwk = (await firebaseJwks()).get(header.kid);
  if (!jwk) return null;

  let ok = false;
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    return null;
  }
  if (!ok) return null;

  const now = Math.floor(Date.now() / 1000);
  const SKEW = 60; // saat kayması toleransı
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
  if (typeof payload.exp !== 'number' || payload.exp + SKEW <= now) return null;
  if (typeof payload.iat !== 'number' || payload.iat - SKEW > now) return null;
  if (typeof payload.auth_time === 'number' && payload.auth_time - SKEW > now) return null;
  if (payload.firebase && payload.firebase.sign_in_provider === 'anonymous') return null;
  return payload;
}

/** Bearer token'ı doğrular; geçerliyse payload, değilse null. */
async function ownerPayload(request, env) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return null;
  try {
    return await verifyFirebaseIdToken(m[1], env.FIREBASE_PROJECT_ID);
  } catch {
    return null;
  }
}

/**
 * Owner mu? Allowlist VERİTABANINDA — istemci paketine gömülü değil, yani
 * owner değiştirmek yeni sürüm yayınlamayı gerektirmez.
 * Her erişim denemesi (izin/ret/hata) kütüğe yazılır.
 */
async function isOwner(env, payload, yol) {
  if (!payload || !env.DEVICE_DB) return false;
  const provider = payload.firebase && payload.firebase.sign_in_provider;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : null;
  const sub = payload.sub;

  // Emir Defteri A4 (Samet, 08-11-2026): owner YALNIZ sağlayıcının doğruladığı `sametterme0@gmail.com`.
  // Apple `sub` owner DEĞİLDİR; relay e-posta (@privaterelay.appleid.com) allowlist'te olmadığı için eşleşmez.
  // Apple ile gerçek e-postasını paylaşarak giren owner, doğrulanmış e-postasıyla tanınır.
  const adaylar = [];
  if (email && payload.email_verified === true) {
    adaylar.push(['google', email], ['email', email]);
  }
  if (adaylar.length === 0) {
    await ownerLog(env, sub, provider, 'ret', 'uygun_kimlik_yok', yol);
    return false;
  }

  try {
    for (const [sag, anahtar] of adaylar) {
      const r = await env.DEVICE_DB
        .prepare('SELECT 1 FROM owner_kimlikleri WHERE saglayici = ? AND anahtar = ? LIMIT 1')
        .bind(sag, anahtar).first();
      if (r) {
        await ownerLog(env, sub, provider, 'izin', null, yol);
        return true;
      }
    }
    await ownerLog(env, sub, provider, 'ret', 'allowlist_disi', yol);
    return false;
  } catch (e) {
    // FAIL CLOSED — sorgu patlarsa panel kapalı.
    await ownerLog(env, sub, provider, 'hata', String(e && e.message).slice(0, 120), yol);
    return false;
  }
}

async function ownerLog(env, uid, saglayici, sonuc, sebep, yol) {
  try {
    await env.DEVICE_DB
      .prepare('INSERT INTO owner_erisim_kutugu (uid, saglayici, sonuc, sebep, yol) VALUES (?,?,?,?,?)')
      .bind(uid || null, saglayici || null, sonuc, sebep || null, yol || null).run();
  } catch {
    // Kütük yazılamazsa erişim kararı DEĞİŞMEZ; sessizce yutulmaz ama akış durmaz.
  }
}

/** Owner değilse 404 — panelin varlığı sızmasın (standart §1). */
async function requireOwner(request, env, yol) {
  const payload = await ownerPayload(request, env);
  const ok = await isOwner(env, payload, yol);
  return ok ? payload : null;
}

/** Doğrulanmış e-posta owner listesinde mi? Yalnız okur; kütüğe yazmaz. Apple `sub` owner değildir (A4). */
async function ownerEpostasiMi(env, payload) {
  if (!payload || payload.email_verified !== true || typeof payload.email !== 'string') return false;
  const email = payload.email.trim().toLowerCase();
  try {
    const r = await env.DEVICE_DB
      .prepare("SELECT 1 FROM owner_kimlikleri WHERE saglayici IN ('google','email') AND anahtar = ? LIMIT 1")
      .bind(email).first();
    return !!r;
  } catch (e) {
    console.warn('[olay] owner denetimi yapılamadı:', String(e).slice(0, 120));
    return false;
  }
}

/**
 * Owner'a ait kişileri (hesap + aynı kurulumun girişten önceki anonim kaydı) owner_test'e alır.
 * Yalnız sınıfı DEĞİŞEN kişide yazar: geçmiş olaylar bir kez yeniden damgalanır ve denetim kütüğüne
 * "kim, neden, hangi güvenle" satırı düşer. Veri SİLİNMEZ.
 */
async function ownerTrafiginiAyir(env, kisiler) {
  for (const pid of kisiler) {
    const k = await env.DEVICE_DB.prepare('SELECT trafik_sinifi FROM kisiler WHERE person_id = ?').bind(pid).first();
    if (!k || k.trafik_sinifi === 'owner_test') continue;
    await env.DEVICE_DB.batch([
      env.DEVICE_DB.prepare("UPDATE kisiler SET trafik_sinifi = 'owner_test', sinif_guveni = 'deterministic', dislama_sebebi = 'owner' WHERE person_id = ?").bind(pid),
      env.DEVICE_DB.prepare("UPDATE olaylar SET trafik_sinifi = 'owner_test' WHERE person_id = ?").bind(pid),
      env.DEVICE_DB.prepare("INSERT INTO denetim_kutugu (aktor, eylem, hedef, sebep, guven) VALUES ('sunucu', 'owner_test olarak ayrıldı', ?, ?, 'deterministic')")
        .bind(pid.startsWith('anon:') ? 'anonim kurulum' : 'hesap', `önceki sınıf: ${k.trafik_sinifi || 'yok'} · doğrulanmış owner e-postası`),
    ]);
  }
}

// ── OLAY YAZMA ─────────────────────────────────────────────────────────────
// 🔴 TRAFİK SINIFI SUNUCUDA DAMGALANIR (standart §2). İstemci "ben production
//    kullanıcısıyım" diyemez; sınıf kişinin sunucudaki kaydından kopyalanır.
// 🔴 BİLİNMEYEN OLAY REDDEDİLİR — şema sessizce genişlemez.
// 🔴 PII YAZILMAZ: isim, e-posta, kullanıcı metni (asistan soruları dahil),
//    portföy tutarı, kesin konum. `ek` alanı yalnız sayısal/kategorik olur.
async function handleOlay(request, env) {
  if (!env.DEVICE_DB) return json({ error: 'unconfigured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const olaylar = Array.isArray(body && body.olaylar) ? body.olaylar.slice(0, 50) : null;
  if (!olaylar || olaylar.length === 0) return json({ error: 'bos' }, 400);

  // Kimlik varsa person_id ona bağlanır; yoksa anonim kurulum kimliği kullanılır.
  const payload = await ownerPayload(request, env);
  const accountId = payload ? payload.sub : null;
  // Owner'ın kendi kullanımı gerçek sayılara GİRMEZ (standart §4 · §12). Karar sunucuda, doğrulanmış
  // e-postanın owner listesinde olmasıyla verilir; erişim kütüğüne yazılmaz (her olayda kütük şişmesin).
  const ownerOturumu = await ownerEpostasiMi(env, payload);
  const yenidenSiniflanan = new Set();

  let yazilan = 0, reddedilen = 0;
  for (const o of olaylar) {
    const ad = typeof o.ad === 'string' ? o.ad : null;
    const inst = typeof o.installation_id === 'string' ? o.installation_id.slice(0, 128) : null;
    if (!ad || !inst) { reddedilen++; continue; }

    try {
      const izinli = await env.DEVICE_DB
        .prepare('SELECT 1 FROM izinli_olaylar WHERE ad = ? LIMIT 1').bind(ad).first();
      if (!izinli) { reddedilen++; continue; }

      const personId = accountId || `anon:${inst}`;
      const ortam = typeof o.calisma_ortami === 'string' ? o.calisma_ortami : 'unknown';

      // Kişi kaydı — sınıf SUNUCUDA belirlenir.
      const sinif = ownerOturumu ? { sinif: 'owner_test', guven: 'deterministic' } : siniflandir(ortam, accountId, o);
      if (ownerOturumu && !yenidenSiniflanan.has(inst)) {
        yenidenSiniflanan.add(inst);
        await ownerTrafiginiAyir(env, [personId, `anon:${inst}`]);
      }
      await env.DEVICE_DB.prepare(
        `INSERT INTO kisiler (person_id, account_id, trafik_sinifi, sinif_guveni, ulke, platform)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(person_id) DO UPDATE SET
           son_gorulme = unixepoch(),
           account_id  = COALESCE(excluded.account_id, kisiler.account_id),
           ulke        = COALESCE(excluded.ulke, kisiler.ulke),
           platform    = COALESCE(excluded.platform, kisiler.platform)`
      ).bind(personId, accountId, sinif.sinif, sinif.guven,
             o.ulke || null, o.platform || null).run();

      await env.DEVICE_DB.prepare(
        `INSERT INTO kurulumlar (installation_id, person_id, platform, os_surumu,
                                 uygulama_surumu, cihaz_ailesi, calisma_ortami)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(installation_id) DO UPDATE SET
           son_gorulme     = unixepoch(),
           -- Güncelleyen kullanıcı panelde YENİ sürümüyle görünsün (eskiden ilk sürüm donuyordu).
           uygulama_surumu = COALESCE(excluded.uygulama_surumu, kurulumlar.uygulama_surumu),
           os_surumu       = COALESCE(excluded.os_surumu, kurulumlar.os_surumu),
           cihaz_ailesi    = COALESCE(excluded.cihaz_ailesi, kurulumlar.cihaz_ailesi),
           calisma_ortami  = COALESCE(NULLIF(excluded.calisma_ortami, 'unknown'), kurulumlar.calisma_ortami)`
      ).bind(inst, personId, o.platform || null,
             typeof o.os_surumu === 'string' ? o.os_surumu.slice(0, 16) : null,
             o.uygulama_surumu || null,
             typeof o.cihaz_ailesi === 'string' ? o.cihaz_ailesi.slice(0, 24) : null, ortam).run();

      // Kişinin GÜNCEL sınıfını olaya damgala (istemciden geleni değil).
      const k = await env.DEVICE_DB
        .prepare('SELECT trafik_sinifi FROM kisiler WHERE person_id = ?').bind(personId).first();

      await env.DEVICE_DB.prepare(
        `INSERT OR IGNORE INTO olaylar
           (ad, person_id, installation_id, session_id, trafik_sinifi, calisma_ortami,
            platform, ulke, uygulama_surumu, ozellik, idempotency_key, ek)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(ad, personId, inst, o.session_id || null,
             (k && k.trafik_sinifi) || sinif.sinif, ortam,
             o.platform || null, o.ulke || null, o.uygulama_surumu || null,
             o.ozellik || null, o.idempotency_key || null,
             o.ek ? JSON.stringify(o.ek).slice(0, 512) : null).run();

      // Aktivasyon: üç tetikleyiciden herhangi biri (product-analytics.json).
      // Vogel değer anı: value.activated (istemci ikinci dersi bitirince yollar — src/services/funnel.ts).
      if (ad === 'value.activated') {
        await env.DEVICE_DB.prepare(
          `UPDATE kisiler SET aktive_oldu = 1, aktive_ts = COALESCE(aktive_ts, unixepoch())
           WHERE person_id = ? AND aktive_oldu = 0`).bind(personId).run();
      }
      yazilan++;
    } catch {
      reddedilen++;
    }
  }
  return json({ yazilan, reddedilen });
}

/**
 * Trafik sınıflandırma (standart §2).
 * 🔴 EN ÖNEMLİ KURAL: belirsiz kullanıcıya `organic` DENMEZ.
 *    Kaynağı kanıtlanamayan production kullanıcı → `unattributed_production`.
 *    Sahte kesinlik, eksik veriden kötüdür.
 */
function siniflandir(ortam, accountId, o) {
  if (ortam === 'simulator' || ortam === 'emulator') return { sinif: 'development', guven: 'deterministic' };
  if (ortam === 'development') return { sinif: 'development', guven: 'deterministic' };
  if (ortam === 'testflight')  return { sinif: 'testflight',  guven: 'deterministic' };
  if (ortam === 'sandbox')     return { sinif: 'sandbox',     guven: 'deterministic' };
  // Denetçi hesabı — product-analytics.json'daki review_accounts.
  if (o && o.review_hesabi === true) return { sinif: 'store_review', guven: 'deterministic' };
  return { sinif: 'unattributed_production', guven: 'unknown' };
}

// ── PANEL ──────────────────────────────────────────────────────────────────
// Tek uç nokta. Owner değilse 404 — panelin varlığı sızmaz.
// ── REVENUECAT WEBHOOK — GELİRİN TEK GERÇEĞİ ───────────────────────────────
// Standart §5. Değişmezler:
//   🔴 İstemcinin "purchaseSuccess=true" demesi BURAYA YAZILMAZ. Gelir yalnız
//      bu uçtan, RevenueCat'in sunucu olayıyla girer.
//   🔴 IDEMPOTENT: aynı olay 5 kez gelirse 5 satış YAZILMAZ.
//      (saglayici, olay_kimligi) UNIQUE + INSERT OR IGNORE.
//   🔴 SANDBOX ASLA gelire karışmaz — ayrı ortam olarak yazılır, panelde
//      toplama girmez.
//   🔴 Elle verilen premium SATIŞ DEĞİLDİR: paying_user=0, gelir=0,
//      entitlement_origin='manual_admin'.
//
// Yapılandırılmamışsa 503 döner (sessizce kabul etmez); yanlış anahtarla 401.
async function handleRevenueCatWebhook(request, env) {
  if (!env.DEVICE_DB) return json({ error: 'unconfigured' }, 503);
  if (!env.REVENUECAT_WEBHOOK_SECRET) return json({ error: 'unconfigured' }, 503);

  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const e = body && body.event;
  if (!e || typeof e.id !== 'string') return json({ error: 'bad_event' }, 400);

  // RevenueCat ortamı: PRODUCTION | SANDBOX
  const ortam = e.environment === 'PRODUCTION' ? 'production' : 'sandbox';
  const tip = String(e.type || '').toUpperCase();

  // Gelir: yalnız gerçek satın alma/yenileme olaylarında ve YALNIZ production.
  const gelirliTipler = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE']);
  const gelirVar = ortam === 'production' && gelirliTipler.has(tip);
  const gelirKurus = gelirVar && typeof e.price_in_purchased_currency === 'number'
    ? Math.round(e.price_in_purchased_currency * 100)
    : 0;

  const personId = typeof e.app_user_id === 'string' ? e.app_user_id : null;
  const origin = ortam === 'sandbox' ? 'sandbox' : 'revenuecat_verified';

  try {
    await env.DEVICE_DB.prepare(
      `INSERT OR IGNORE INTO magaza_islemleri
         (saglayici, olay_kimligi, person_id, urun_kimligi, entitlement_origin,
          ortam, dogrulanmis, gelir_kurus, para_birimi, ham)
       VALUES ('revenuecat',?,?,?,?,?,?,?,?,?)`
    ).bind(e.id, personId, e.product_id || null, origin, ortam,
           gelirVar ? 1 : 0, gelirKurus, e.currency || null,
           // cancel_reason: RevenueCat iadeyi CANCELLATION + CUSTOMER_SUPPORT olarak bildirir (panel §9 "refunds").
           JSON.stringify({ type: tip, store: e.store, cancel_reason: e.cancel_reason || null }).slice(0, 512)).run();

    // paying_user YALNIZCA doğrulanmış production işlemle true olur.
    if (personId) {
      // Webhook, o kişinin ilk olayından ÖNCE gelebilir (satın alma açılışta
      // olursa). Satır yoksa UPDATE sessizce hiçbir şey yapar ve ÖDEYEN KİŞİ
      // kaybolur — ödeme kaydı durur ama kimse ödemiş görünmez. Bu yüzden
      // satırı burada garantiye alıyoruz.
      await env.DEVICE_DB.prepare(
        `INSERT OR IGNORE INTO kisiler (person_id) VALUES (?)`).bind(personId).run();
      if (gelirVar) {
        await env.DEVICE_DB.prepare(
          `UPDATE kisiler SET paying_user = 1, premium = 1, entitlement_origin = ?
           WHERE person_id = ?`).bind(origin, personId).run();
      } else if (tip === 'EXPIRATION' || tip === 'CANCELLATION') {
        // Abonelik bitti → premium kapanır ama paying_user GEÇMİŞİ silinmez;
        // "bir zamanlar ödedi" bilgisi gelir analizinde gereklidir.
        await env.DEVICE_DB.prepare(
          `UPDATE kisiler SET premium = 0 WHERE person_id = ?`).bind(personId).run();
      }
    }
  } catch {
    return json({ error: 'write_failed' }, 500);
  }
  return json({ ok: true });
}
