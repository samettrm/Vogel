// Owner paneli §9 — sorgular gerçek SQLite'ta koşar (node --test server/test/).
// D1'in prepare/bind/first/all/batch yüzeyi node:sqlite üzerine taklit edilir; göçler sırayla uygulanır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  apiSay, bugunBaslangici, filtreCoz, huniHesapla, panelHesapla, ucAdi,
} from '../src/panel-ek.js';

const KOK = new URL('../migrations/', import.meta.url);

function d1() {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync(KOK).filter((x) => x.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL(f, KOK), 'utf8'));
  }
  const hazirla = (sql) => ({
    bind: (...b) => ({
      first: async () => db.prepare(sql).get(...b) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...b) }),
      run: async () => db.prepare(sql).run(...b),
    }),
  });
  return { ham: db, DEVICE_DB: { prepare: hazirla, batch: async (l) => Promise.all(l.map((x) => x.run())) } };
}

const S = 1_800_000_000;
function tohumla(db) {
  const k = db.prepare('INSERT INTO kisiler (person_id, ilk_gorulme, son_gorulme, trafik_sinifi, ulke, platform, paying_user, aktive_oldu) VALUES (?,?,?,?,?,?,?,?)');
  k.run('p1', S - 40 * 86400, S - 100, 'organic', 'TR', 'ios', 1, 1);
  k.run('p2', S - 10 * 86400, S - 2 * 86400, 'unattributed_production', 'DE', 'android', 0, 1);
  k.run('p3', S - 3 * 86400, S - 3 * 86400, 'unattributed_production', 'TR', 'android', 0, 0);
  k.run('owner', S - 50 * 86400, S - 50, 'owner_test', 'TR', 'ios', 0, 1);
  const u = db.prepare('INSERT INTO kurulumlar (installation_id, person_id, platform, os_surumu, uygulama_surumu, cihaz_ailesi, calisma_ortami, ilk_gorulme, son_gorulme) VALUES (?,?,?,?,?,?,?,?,?)');
  u.run('i1', 'p1', 'ios', '26.1', '1.2.1', 'iPhone', 'production', S - 40 * 86400, S - 100);
  u.run('i2', 'p2', 'android', '16', '1.2.1', 'Pixel', 'production', S - 10 * 86400, S - 2 * 86400);
  u.run('i3', 'p3', 'android', '15', '1.2.0', 'Galaxy', 'production', S - 3 * 86400, S - 3 * 86400);
  const o = db.prepare('INSERT INTO olaylar (ts, ad, person_id, trafik_sinifi, platform, ulke, uygulama_surumu, ek) VALUES (?,?,?,?,?,?,?,?)');
  for (const [p, sinif, pl, ul, sr] of [['p1', 'organic', 'ios', 'TR', '1.2.1'], ['p2', 'unattributed_production', 'android', 'DE', '1.2.1'], ['p3', 'unattributed_production', 'android', 'TR', '1.2.0']]) {
    o.run(S - 2 * 86400, 'app.first_open', p, sinif, pl, ul, sr, null);
    o.run(S - 2 * 86400, 'onboarding.completed', p, sinif, pl, ul, sr, null);
  }
  o.run(S - 86400, 'value.activated', 'p1', 'organic', 'ios', 'TR', '1.2.1', null);
  o.run(S - 86400, 'paywall.viewed', 'p1', 'organic', 'ios', 'TR', '1.2.1', null);
  o.run(S - 86400, 'purchase.started', 'p1', 'organic', 'ios', 'TR', '1.2.1', null);
  o.run(S - 86400, 'feature.flashcards.used', 'p2', 'unattributed_production', 'android', 'DE', '1.2.1', null);
  o.run(S - 3600, 'app.crash', 'p2', 'unattributed_production', 'android', 'DE', '1.2.1', '{"kaynak":"sinir"}');
  o.run(S - 3600, 'review.request_attempted', 'p1', 'organic', 'ios', 'TR', '1.2.1', null);
  // D1 tutundurma: p1 ilk görülmeden 1 gün sonra geri geldi
  o.run(S - 39 * 86400 + 100, 'session.started', 'p1', 'organic', 'ios', 'TR', '1.2.1', null);
  // owner'ın olayı gerçek sayılara GİRMEZ
  o.run(S - 100, 'paywall.viewed', 'owner', 'owner_test', 'ios', 'TR', '1.2.1', null);
  const m = db.prepare('INSERT INTO magaza_islemleri (ts, saglayici, olay_kimligi, person_id, ortam, dogrulanmis, gelir_kurus) VALUES (?,?,?,?,?,?,?)');
  m.run(S - 5 * 86400, 'revenuecat', 'e1', 'p1', 'production', 1, 89999);
  db.prepare("INSERT INTO magaza_islemleri (ts, saglayici, olay_kimligi, person_id, urun_kimligi, ortam, dogrulanmis, gelir_kurus) VALUES (?, 'revenuecat', 'e4', 'p1', 'vogel_premium_monthly', 'production', 1, 12000)").run(S - 10 * 86400);
  m.run(S - 5 * 86400, 'revenuecat', 'e2', 'p1', 'sandbox', 1, 89999);
  db.prepare("INSERT INTO magaza_islemleri (ts, saglayici, olay_kimligi, person_id, ortam, dogrulanmis, gelir_kurus, ham) VALUES (?, 'revenuecat', 'e3', 'p1', 'production', 0, 0, '{\"type\":\"CANCELLATION\",\"cancel_reason\":\"CUSTOMER_SUPPORT\"}')").run(S - 86400);
  db.prepare("INSERT INTO guncelleme_gonderim (kurulum, anahtar, sonuc, zaman) VALUES ('a','ios:1.2.2','ok',1),('b','ios:1.2.2','hata',2)").run();
  db.prepare("INSERT INTO api_saglik (gun, uc, sinif, adet) VALUES (?, '/fx/rates', '2xx', 90), (?, '/fx/rates', '5xx', 10)").run(
    new Date(S * 1000).toISOString().slice(0, 10), new Date(S * 1000).toISOString().slice(0, 10));
}

test('filtre: bilinmeyen değer varsayılana düşer, ham değer geçmez', () => {
  const f = filtreCoz(new URLSearchParams("aralik=x&platform=web&ulke=tr'--&surum=1;drop&sinif=hepsi"), S);
  assert.deepEqual([f.aralik, f.platform, f.ulke, f.surum, f.sinif], ['tumu', null, null, null, 'gercek']);
  const g = filtreCoz(new URLSearchParams('aralik=7g&platform=ios&ulke=de&surum=1.2.1&sinif=organic'), S);
  assert.deepEqual([g.aralik, g.baslangic, g.platform, g.ulke, g.surum, g.sinif], ['7g', S - 7 * 86400, 'ios', 'DE', '1.2.1', 'organic']);
  assert.equal(filtreCoz(new URLSearchParams(''), S).baslangic, 0, 'parametresiz istek = tümü (eski istemci)');
  assert.equal((bugunBaslangici(S) + 3 * 3600) % 86400, 0);
});

test('huni: oranlar ve en büyük düşüş matematiksel; payda sıfırsa null', () => {
  const h = huniHesapla({ 'app.first_open': 10, 'onboarding.completed': 8, 'lesson.completed': 2, 'value.activated': 2, 'paywall.viewed': 2, 'purchase.started': 1, 'purchase.completed': 1 });
  assert.equal(h.en_buyuk_dusus.nereden, 'onboarding.completed');
  assert.equal(h.en_buyuk_dusus.oran, 75);
  assert.equal(h.adimlar[1].onceye_gore, 80);
  assert.equal(h.adimlar[5].onceye_gore, 50);
  assert.equal(huniHesapla({}).en_buyuk_dusus, null, 'veri yoksa düşüş uydurulmaz');
  assert.equal(huniHesapla({}).adimlar[1].onceye_gore, null);
});

test('panel: bütün sorgular koşar, owner/test gerçek sayılara girmez, sandbox gelire karışmaz', async () => {
  const env = d1();
  tohumla(env.ham);
  const p = await panelHesapla(env, filtreCoz(new URLSearchParams('aralik=30g'), S), S);
  assert.equal(p.ozet.gercek_kisi, 3);
  assert.equal(p.ozet.organik, 1);
  assert.equal(p.ozet.cevrimici, 1);
  assert.equal(p.ozet.dau, 1);
  assert.equal(p.para.paywall_kisi, 1, 'owner paywall olayı sayılmadı');
  assert.equal(p.gelir.gelir_kurus, 89999 + 12000, 'sandbox işlemi gelire girmedi');
  assert.equal(p.gelir.mrr_yaklasik_kurus, Math.round(12000 + 89999 / 12), 'aylık tam, yıllık /12');
  assert.equal(p.gelir.sandbox_islem, 1);
  assert.equal(p.gelir.iade, 1);
  assert.equal(p.ulkeler.find((u) => u.ulke === 'TR').iade, 1);
  assert.equal(p.ulkeler.find((u) => u.ulke === 'TR').satis, 2, 'iade satış sayılmaz');
  // D1 kohortu: ilk görülmesinden en az 2 gün geçmiş gerçek kişiler (p1, p2, p3); 1. gün dönen p1 ve p3.
  assert.equal(p.tutundurma.d1.kohort, 3);
  assert.equal(p.tutundurma.d1.donen, 2);
  assert.equal(p.tutundurma.d1.oran, 66.7);
  assert.equal(p.funnel.adimlar[0].tekil, 3);
  assert.deepEqual(p.ulkeler.map((u) => u.ulke).sort(), ['DE', 'TR']);
  assert.equal(p.ozellikler.find((x) => x.ad === 'feature.flashcards.used').tekil, 1);
  assert.equal(p.cokme.satirlar[0].kaynak, 'sinir');
  assert.equal(p.puan.istendi, 1);
  assert.equal(p.api[0].hata_orani, 10);
  assert.equal(p.guncelleme.gonderim.length, 2);
  assert.ok(p.secenekler.surumler.includes('1.2.0'));
  assert.ok(p.dislanan_trafik.some((d) => d.trafik_sinifi === 'owner_test'));
});

test('panel filtreleri: platform, ülke ve sürüm daraltır', async () => {
  const env = d1();
  tohumla(env.ham);
  const and = await panelHesapla(env, filtreCoz(new URLSearchParams('aralik=30g&platform=android'), S), S);
  assert.equal(and.ozet.gercek_kisi, 2);
  assert.equal(and.gelir.gelir_kurus, 0);
  const tr = await panelHesapla(env, filtreCoz(new URLSearchParams('aralik=tumu&ulke=TR&surum=1.2.0'), S), S);
  assert.equal(tr.ozet.gercek_kisi, 1);
  assert.equal(tr.surumler.length, 1);
  const dis = await panelHesapla(env, filtreCoz(new URLSearchParams('aralik=30g&sinif=dislanan'), S), S);
  assert.equal(dis.ozet.gercek_kisi, 1, 'yalnız owner_test');
});

test('uç sağlığı: dakikada bir toplu yazar, yazılamazsa sayacı geri koyar', async () => {
  const env = d1();
  const bekleyen = [];
  const ctx = { waitUntil: (p) => bekleyen.push(p) };
  apiSay(env, ctx, '/olay', 'POST', 200, false);
  await Promise.all(bekleyen);
  const r = env.ham.prepare("SELECT SUM(adet) n FROM api_saglik WHERE uc = '/olay'").get();
  assert.equal(r.n, 1);
  assert.equal(ucAdi('/olay', 'POST'), '/olay');
  assert.equal(ucAdi('/bilinmeyen', 'POST'), 'diger');
  assert.equal(ucAdi('/bilinmeyen', 'GET'), 'diger');
});
