// Uçtan uca: Worker'ın kendi fetch'i, gerçek SQLite (node:sqlite) üzerinde (node --test test/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/worker.js';

function ortam() {
  const db = new DatabaseSync(':memory:');
  const kok = new URL('../migrations/', import.meta.url);
  for (const f of readdirSync(kok).filter((x) => x.endsWith('.sql')).sort()) db.exec(readFileSync(new URL(f, kok), 'utf8'));
  const ifade = (sql, b = []) => ({
    bind: (...x) => ifade(sql, x),
    first: async () => db.prepare(sql).get(...b) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...b) }),
    run: async () => db.prepare(sql).run(...b),
  });
  const env = { DEVICE_DB: { prepare: (sql) => ifade(sql), batch: async (l) => { for (const x of l) await x.run(); } },
    REVENUECAT_WEBHOOK_SECRET: 'gizli-test', FIREBASE_PROJECT_ID: 'vogel-3e071' };
  return { db, env, ctx: { waitUntil: () => undefined } };
}
const istek = (yol, govde, basliklar = {}) => new Request(`https://x.test${yol}`, {
  method: 'POST', headers: { 'content-type': 'application/json', ...basliklar }, body: JSON.stringify(govde) });
const olay = (ad, ek = {}) => ({ ad, installation_id: 'kurulum-0123456789abcdef', session_id: 's1', calisma_ortami: 'production',
  platform: 'ios', ulke: 'DE', uygulama_surumu: '1.0.8', os_surumu: '26.1', cihaz_ailesi: 'iPhone', ...ek });

test('/olay: izinli olay yazılır, bilinmeyen reddedilir, değer anı aktivasyon yapar, sınıf sunucuda', async () => {
  const { db, env, ctx } = ortam();
  const r = await worker.fetch(istek('/olay', { olaylar: [olay('app.first_open'), olay('value.activated'), olay('hack.payi', { trafik_sinifi: 'organic' })] }), env, ctx);
  assert.deepEqual(await r.json(), { yazilan: 2, reddedilen: 1 });
  const k = db.prepare("SELECT trafik_sinifi, aktive_oldu, ulke FROM kisiler WHERE person_id = 'anon:kurulum-0123456789abcdef'").get();
  assert.deepEqual({ ...k }, { trafik_sinifi: 'unattributed_production', aktive_oldu: 1, ulke: 'DE' });
  const u = db.prepare('SELECT uygulama_surumu, os_surumu, cihaz_ailesi FROM kurulumlar').get();
  assert.deepEqual({ ...u }, { uygulama_surumu: '1.0.8', os_surumu: '26.1', cihaz_ailesi: 'iPhone' });
  // güncelleme: sürüm yenilenir
  await worker.fetch(istek('/olay', { olaylar: [olay('session.started', { uygulama_surumu: '1.0.9' })] }), env, ctx);
  assert.equal(db.prepare('SELECT uygulama_surumu v FROM kurulumlar').get().v, '1.0.9');
});

test('/olay: TestFlight kurulumu gerçek sayılmaz', async () => {
  const { db, env, ctx } = ortam();
  await worker.fetch(istek('/olay', { olaylar: [olay('app.first_open', { calisma_ortami: 'testflight' })] }), env, ctx);
  assert.equal(db.prepare('SELECT trafik_sinifi s FROM kisiler').get().s, 'testflight');
});

test('/webhook/revenuecat: yanlış anahtar 401; production gelir + ödeyen; sandbox gelire girmez; tekrar yazılmaz', async () => {
  const { db, env, ctx } = ortam();
  const ev = (id, ortamAdi, tip = 'INITIAL_PURCHASE') => ({ event: { id, type: tip, environment: ortamAdi, app_user_id: 'uid-1',
    product_id: 'vogel_premium_yearly', price_in_purchased_currency: 899.99, currency: 'TRY', store: 'APP_STORE' } });
  assert.equal((await worker.fetch(istek('/webhook/revenuecat', ev('a', 'PRODUCTION'), { authorization: 'Bearer yanlis' }), env, ctx)).status, 401);
  const ok = { authorization: 'Bearer gizli-test' };
  await worker.fetch(istek('/webhook/revenuecat', ev('a', 'PRODUCTION'), ok), env, ctx);
  await worker.fetch(istek('/webhook/revenuecat', ev('a', 'PRODUCTION'), ok), env, ctx);
  await worker.fetch(istek('/webhook/revenuecat', ev('b', 'SANDBOX'), ok), env, ctx);
  const g = db.prepare("SELECT COUNT(*) n, SUM(CASE WHEN ortam='production' AND dogrulanmis=1 THEN gelir_kurus END) gelir FROM magaza_islemleri").get();
  assert.deepEqual({ ...g }, { n: 2, gelir: 89999 });
  assert.equal(db.prepare("SELECT paying_user p FROM kisiler WHERE person_id = 'uid-1'").get().p, 1);
});

test('/panel ve /owner/durum: kimliksiz istek 404 (panelin varlığı sızmaz)', async () => {
  const { env, ctx } = ortam();
  for (const yol of ['/panel', '/owner/durum']) {
    const r = await worker.fetch(new Request(`https://x.test${yol}`), env, ctx);
    assert.equal(r.status, 404);
  }
});
