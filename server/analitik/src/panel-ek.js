/**
 * OWNER PANELİ — §9 tam içerik + filtreler + uç sağlığı (Emir Defteri A4 · BUILD AL 21-11-2026).
 *
 * Standart: ~/.claude/standards/owner-control-center.md §9 · Canlı Döviz server/panel-ek.js'ten uyarlandı (Vogel).
 *
 * Değişmezler (eski handlePanel'den aynen taşındı):
 *   · Gerçek production = analitiğe giren sınıf. Dışlananlar SİLİNMEZ, ayrı gösterilir.
 *   · Gelir yalnız doğrulanmış PRODUCTION işlemden. Sandbox ayrı satırdır, toplama karışmaz.
 *   · Huninin en büyük düşüşü MATEMATİKSEL hesaplanır; payda sıfırsa oran üretilmez (null).
 *   · Filtre değerleri SQL'e yalnız bağlı parametreyle girer; metin birleştirme yok.
 */

export const GERCEK_SINIFLAR = ['organic', 'paid', 'referral', 'direct', 'unattributed_production'];
/** RevenueCat iadeyi CANCELLATION + cancel_reason=CUSTOMER_SUPPORT olarak bildirir (webhook `ham` alanına yazar). */
const IADE = "json_extract(m.ham,'$.type') = 'CANCELLATION' AND json_extract(m.ham,'$.cancel_reason') = 'CUSTOMER_SUPPORT'";
const ARALIK_SN = { '24s': 86400, '7g': 7 * 86400, '30g': 30 * 86400, '90g': 90 * 86400 };
const SINIFLAR = ['gercek', 'organic', 'unattributed_production', 'dislanan', 'tumu'];

/** İstanbul gün başlangıcı (UTC+3, yaz saati yok) — "Bugün" filtresi için. */
export function bugunBaslangici(simdiSn) {
  const kaydir = 3 * 3600;
  return Math.floor((simdiSn + kaydir) / 86400) * 86400 - kaydir;
}

/** URL sorgusundan filtre. Bilinmeyen değer VARSAYILANA düşer; hiçbir değer SQL'e ham girmez. */
export function filtreCoz(params, simdiSn) {
  const a = params.get('aralik');
  // Parametresiz istek (1.2.1 ve öncesinin paneli) "tümü" görür: eski istemcide gelir ve ülke sayıları
  // sessizce 30 güne düşmesin. Yeni panel aralığı her zaman açıkça gönderir.
  const aralik = a === 'bugun' || a === 'tumu' || a in ARALIK_SN ? a : 'tumu';
  const p = params.get('platform');
  const u = (params.get('ulke') || '').toUpperCase();
  const s = params.get('surum') || '';
  const c = params.get('sinif');
  const baslangic = aralik === 'tumu' ? 0 : aralik === 'bugun' ? bugunBaslangici(simdiSn) : simdiSn - ARALIK_SN[aralik];
  return {
    aralik,
    baslangic,
    platform: p === 'ios' || p === 'android' ? p : null,
    ulke: /^[A-Z]{2}$/.test(u) ? u : null,
    surum: /^[0-9]{1,3}(\.[0-9]{1,4}){0,3}$/.test(s) ? s : null,
    sinif: SINIFLAR.includes(c) ? c : 'gercek',
  };
}

function sinifKosulu(sutun, sinif) {
  const liste = GERCEK_SINIFLAR.map((x) => `'${x}'`).join(',');
  if (sinif === 'tumu') return '1=1';
  if (sinif === 'dislanan') return `(${sutun} IS NULL OR ${sutun} NOT IN (${liste}))`;
  if (sinif === 'organic') return `${sutun} = 'organic'`;
  if (sinif === 'unattributed_production') return `${sutun} = 'unattributed_production'`;
  return `${sutun} IN (${liste})`;
}

/** Kişi tablosu (takma ad k) için WHERE parçası + bağlı değerler. Aralık BURADA uygulanmaz. */
export function kisiFiltresi(f) {
  const p = [sinifKosulu('k.trafik_sinifi', f.sinif)];
  const b = [];
  if (f.platform) { p.push('k.platform = ?'); b.push(f.platform); }
  if (f.ulke) { p.push('k.ulke = ?'); b.push(f.ulke); }
  if (f.surum) { p.push('EXISTS (SELECT 1 FROM kurulumlar u WHERE u.person_id = k.person_id AND u.uygulama_surumu = ?)'); b.push(f.surum); }
  return { sql: p.join(' AND '), b };
}

/** Olay tablosu (takma ad o) için WHERE parçası + bağlı değerler. Aralık dahil. */
export function olayFiltresi(f) {
  const p = [sinifKosulu('o.trafik_sinifi', f.sinif), 'o.ts >= ?'];
  const b = [f.baslangic];
  if (f.platform) { p.push('o.platform = ?'); b.push(f.platform); }
  if (f.ulke) { p.push('o.ulke = ?'); b.push(f.ulke); }
  if (f.surum) { p.push('o.uygulama_surumu = ?'); b.push(f.surum); }
  return { sql: p.join(' AND '), b };
}

/** Oran (yüzde, bir ondalık). Payda sıfırsa null — uydurma yüzde yok. */
export const oran = (pay, payda) => (payda > 0 ? +((pay / payda) * 100).toFixed(1) : null);

// Vogel'in değer anı: ilk dersi bitirmek (owner-analytics-core BENİOKU "Dil uygulaması → ilk dersi bitirme").
export const HUNI_SIRASI = ['app.first_open', 'onboarding.completed', 'lesson.completed', 'value.activated',
  'paywall.viewed', 'purchase.started', 'purchase.completed'];

/** Huni: her adımda tekil kişi, önceki adıma ve ilk adıma göre %, kayıp ve en büyük düşüş. */
export function huniHesapla(sayilar) {
  const adimlar = HUNI_SIRASI.map((ad) => ({ ad, tekil: sayilar[ad] || 0 }));
  const ilk = adimlar[0].tekil;
  let enBuyuk = null;
  const zengin = adimlar.map((a, i) => {
    const onceki = i === 0 ? null : adimlar[i - 1].tekil;
    const kayip = onceki === null ? 0 : Math.max(onceki - a.tekil, 0);
    if (onceki > 0) {
      const o = kayip / onceki;
      if (!enBuyuk || o > enBuyuk.oran / 100) {
        enBuyuk = { nereden: adimlar[i - 1].ad, nereye: a.ad, kayip, oran: +(o * 100).toFixed(1) };
      }
    }
    return { ...a, onceye_gore: onceki === null ? null : oran(a.tekil, onceki), ilke_gore: oran(a.tekil, ilk), kayip };
  });
  return { adimlar: zengin, en_buyuk_dusus: enBuyuk };
}

// ── UÇ SAĞLIĞI SAYACI ────────────────────────────────────────────────────────
// Her yanıt sayılır ama D1'e TEK TEK yazılmaz: bellekte toplanır, en çok dakikada bir toplu
// UPSERT edilir. D1 ücretsiz planın günlük yazma sınırı hesap geneline ortaktır (20-11-2026
// NEXGPS dersi); istek başına yazmak o sınırı başka uygulamaların elinden alırdı.
const BILINEN_UCLAR = new Set(['/olay', '/webhook/revenuecat', '/guncelleme/kayit', '/guncelleme/tetik',
  '/panel', '/owner/durum']);
const sayac = new Map();
let sonYazim = 0;

export function ucAdi(yol, method) {
  if (BILINEN_UCLAR.has(yol)) return yol;
  return 'diger';
}

export function durumSinifi(status, sunucuHatasi) {
  if (sunucuHatasi || status >= 500) return '5xx';
  if (status >= 400) return '4xx';
  return '2xx';
}

export function apiSay(env, ctx, yol, method, status, sunucuHatasi) {
  if (!env.DEVICE_DB || method === 'OPTIONS') return;
  const gun = new Date().toISOString().slice(0, 10);
  const k = `${gun}|${ucAdi(yol, method)}|${durumSinifi(status, sunucuHatasi)}`;
  sayac.set(k, (sayac.get(k) || 0) + 1);
  const simdi = Date.now();
  if (simdi - sonYazim < 60_000) return;
  sonYazim = simdi;
  const yazilacak = [...sayac.entries()];
  sayac.clear();
  const ifadeler = yazilacak.map(([anahtar, adet]) => {
    const [g, uc, sinif] = anahtar.split('|');
    return env.DEVICE_DB
      .prepare('INSERT INTO api_saglik (gun, uc, sinif, adet) VALUES (?, ?, ?, ?) '
        + 'ON CONFLICT (gun, uc, sinif) DO UPDATE SET adet = adet + excluded.adet')
      .bind(g, uc, sinif, adet);
  });
  ctx.waitUntil(env.DEVICE_DB.batch(ifadeler).catch((e) => {
    // Yazılamayan sayaç geri konur; bir sonraki yazımda denenir. Sessiz kayıp yok.
    for (const [anahtar, adet] of yazilacak) sayac.set(anahtar, (sayac.get(anahtar) || 0) + adet);
    console.warn('[api_saglik] yazılamadı:', String(e).slice(0, 160));
  }));
}

// ── PANEL ────────────────────────────────────────────────────────────────────
export async function panelHesapla(env, f, simdiSn) {
  const db = env.DEVICE_DB;
  const tek = (sql, b = []) => db.prepare(sql).bind(...b).first();
  const hep = async (sql, b = []) => (await db.prepare(sql).bind(...b).all()).results || [];
  const K = kisiFiltresi(f);
  const O = olayFiltresi(f);
  const s = simdiSn;
  const bugun = bugunBaslangici(s);

  // Gelir yalnız doğrulanmış production. Platform/ülke/sürüm filtresi kişi üzerinden uygulanır.
  const gelirKisi = `m.ortam = 'production' AND m.dogrulanmis = 1 AND EXISTS (SELECT 1 FROM kisiler k WHERE k.person_id = m.person_id AND ${K.sql})`;
  const tutundurma = (n) => tek(
    `SELECT COUNT(*) AS kohort,
            COALESCE(SUM(EXISTS (SELECT 1 FROM olaylar o WHERE o.person_id = k.person_id
              AND o.ts >= k.ilk_gorulme + ? AND o.ts < k.ilk_gorulme + ?)), 0) AS donen
       FROM kisiler k
      WHERE ${K.sql} AND k.ilk_gorulme <= ? AND k.ilk_gorulme > ?`,
    [n * 86400, (n + 1) * 86400, ...K.b, s - (n + 1) * 86400, s - (n + 91) * 86400],
  );

  const [ozet, para, gelir, gelirAralik, huniHam, ulkeler, ulkeSatis, dislanan, olayDagilim, reklamHunisi,
    surumler, cihazlar, isletim, ozellikler, denetim, erisimSay, erisimSon, guncelleme, guncellemeCihaz, api,
    cokme, puan, d1, d7, d30, secenekUlke, secenekSurum] = await Promise.all([
    tek(`SELECT COUNT(*) AS gercek_kisi,
                COALESCE(SUM(k.organik),0) AS organik,
                COALESCE(SUM(k.son_gorulme > ?),0) AS cevrimici,
                COALESCE(SUM(k.son_gorulme > ?),0) AS dau,
                COALESCE(SUM(k.son_gorulme > ?),0) AS wau,
                COALESCE(SUM(k.son_gorulme > ?),0) AS mau,
                COALESCE(SUM(k.son_gorulme >= ?),0) AS aralikta_gorulen,
                COALESCE(SUM(k.ilk_gorulme > ?),0) AS yeni_24s,
                COALESCE(SUM(k.ilk_gorulme > ?),0) AS yeni_7g,
                COALESCE(SUM(k.ilk_gorulme > ?),0) AS yeni_30g,
                COALESCE(SUM(k.ilk_gorulme >= ?),0) AS yeni_aralik,
                COALESCE(SUM(k.aktive_oldu),0) AS aktive,
                COALESCE(SUM(k.paying_user),0) AS odeyen,
                (SELECT COUNT(*) FROM kurulumlar) AS kurulum,
                (SELECT COUNT(*) FROM olaylar) AS olay
           FROM (SELECT *, (trafik_sinifi = 'organic') AS organik FROM kisiler) k WHERE ${K.sql}`,
      [s - 300, s - 86400, s - 7 * 86400, s - 30 * 86400, f.baslangic, s - 86400, s - 7 * 86400, s - 30 * 86400, f.baslangic, ...K.b]),
    tek(`SELECT COUNT(DISTINCT CASE WHEN o.ad = 'paywall.viewed' THEN o.person_id END) AS paywall_kisi,
                COUNT(DISTINCT CASE WHEN o.ad = 'purchase.started' THEN o.person_id END) AS satin_alma_deneyen,
                COALESCE(SUM(o.ad = 'purchase.started'),0) AS satin_alma_denemesi,
                COALESCE(SUM(o.ad = 'purchase.failed'),0) AS satin_alma_hatasi
           FROM olaylar o WHERE ${O.sql} AND o.ad IN ('paywall.viewed','purchase.started','purchase.failed')`, O.b),
    tek(`SELECT COALESCE(SUM(CASE WHEN m.ts >= ? THEN m.gelir_kurus END),0) AS bugun,
                COALESCE(SUM(CASE WHEN m.ts > ? THEN m.gelir_kurus END),0) AS g7,
                COALESCE(SUM(CASE WHEN m.ts > ? THEN m.gelir_kurus END),0) AS g30,
                COALESCE(SUM(CASE WHEN m.ts > ? AND COALESCE(m.urun_kimligi,'') NOT LIKE '%monthly%' THEN m.gelir_kurus END),0) AS g365_uzun,
                COALESCE(SUM(CASE WHEN m.ts > ? AND COALESCE(m.urun_kimligi,'') LIKE '%monthly%' THEN m.gelir_kurus END),0) AS g30_aylik,
                COALESCE(SUM(m.gelir_kurus),0) AS gelir_kurus,
                COUNT(*) AS islem
           FROM magaza_islemleri m WHERE ${gelirKisi}`,
      [bugun, s - 7 * 86400, s - 30 * 86400, s - 365 * 86400, s - 30 * 86400, ...K.b]),
    tek(`SELECT COALESCE(SUM(m.gelir_kurus),0) AS gelir_kurus, COUNT(*) AS islem,
                (SELECT COUNT(*) FROM magaza_islemleri WHERE ortam = 'sandbox') AS sandbox_islem,
                (SELECT COUNT(*) FROM magaza_islemleri m WHERE m.ortam = 'production' AND m.ts >= ? AND ${IADE}) AS iade
           FROM magaza_islemleri m WHERE ${gelirKisi} AND m.ts >= ?`, [f.baslangic, ...K.b, f.baslangic]),
    hep(`SELECT o.ad AS ad, COUNT(DISTINCT o.person_id) AS tekil FROM olaylar o
          WHERE ${O.sql} AND o.ad IN (${HUNI_SIRASI.map(() => '?').join(',')}) GROUP BY o.ad`, [...O.b, ...HUNI_SIRASI]),
    hep(`SELECT k.ulke AS ulke, COUNT(*) AS kisi, COALESCE(SUM(k.aktive_oldu),0) AS aktive,
                COALESCE(SUM(k.paying_user),0) AS odeyen, COALESCE(SUM(k.ilk_gorulme >= ?),0) AS yeni,
                COALESCE(SUM(k.son_gorulme > ?),0) AS dau
           FROM kisiler k WHERE ${K.sql} AND k.ulke IS NOT NULL AND k.son_gorulme >= ?
          GROUP BY k.ulke ORDER BY kisi DESC LIMIT 60`, [f.baslangic, s - 86400, ...K.b, f.baslangic]),
    hep(`SELECT k.ulke AS ulke,
                COALESCE(SUM(m.dogrulanmis = 1),0) AS satis,
                COALESCE(SUM(CASE WHEN m.dogrulanmis = 1 THEN m.gelir_kurus END),0) AS gelir_kurus,
                COALESCE(SUM(${IADE}),0) AS iade
           FROM magaza_islemleri m JOIN kisiler k ON k.person_id = m.person_id
          WHERE m.ortam = 'production' AND k.ulke IS NOT NULL AND m.ts >= ? AND ${K.sql}
          GROUP BY k.ulke`, [f.baslangic, ...K.b]),
    hep(`SELECT k.trafik_sinifi AS trafik_sinifi, k.dislama_sebebi AS sebep, COUNT(*) AS kisi FROM kisiler k
          WHERE ${sinifKosulu('k.trafik_sinifi', 'dislanan')}
          GROUP BY k.trafik_sinifi, k.dislama_sebebi ORDER BY kisi DESC LIMIT 20`),
    hep(`SELECT ad, COUNT(*) AS adet FROM olaylar GROUP BY ad ORDER BY adet DESC LIMIT 25`),
    hep(`SELECT COALESCE(o.platform,'?') AS platform, COALESCE(json_extract(o.ek,'$.bicim'),'-') AS bicim,
                COALESCE(o.uygulama_surumu,'?') AS surum,
                CASE WHEN ${sinifKosulu('o.trafik_sinifi', 'gercek')} THEN 'gercek' ELSE 'owner_test' END AS sinif,
                SUM(o.ad = 'session.started') AS oturum, SUM(o.ad = 'ad.request') AS istek,
                SUM(o.ad = 'ad.loaded') AS yuklendi, SUM(o.ad = 'ad.load_failed') AS yukleme_hatasi,
                SUM(o.ad = 'ad.show_attempt') AS gosterim_denemesi, SUM(o.ad = 'ad.impression_v2') AS gosterim,
                SUM(o.ad = 'ad.dismissed') AS kapatildi, SUM(o.ad = 'ad.skip_premium') AS atlandi_premium,
                SUM(o.ad = 'ad.skip_background') AS atlandi_arkaplan, SUM(o.ad = 'ad.skip_cooldown') AS atlandi_bekleme,
                SUM(o.ad = 'ad.skip_not_loaded') AS atlandi_hazir_degil
           FROM olaylar o
          WHERE o.ts >= ? AND (o.ad = 'session.started' OR o.ad LIKE 'ad.%')
          GROUP BY 1, 2, 3, 4 ORDER BY istek DESC, gosterim DESC LIMIT 60`,
      [f.aralik === 'tumu' ? s - 30 * 86400 : f.baslangic]),
    hep(`SELECT COALESCE(u.platform,'?') AS platform, COALESCE(u.uygulama_surumu,'?') AS surum,
                COUNT(DISTINCT u.person_id) AS kisi, COUNT(*) AS kurulum
           FROM kurulumlar u JOIN kisiler k ON k.person_id = u.person_id
          WHERE ${K.sql} AND u.son_gorulme >= ?
          GROUP BY 1, 2 ORDER BY kisi DESC LIMIT 30`, [...K.b, f.baslangic]),
    hep(`SELECT COALESCE(u.platform,'?') AS platform, COALESCE(u.cihaz_ailesi,'?') AS cihaz, COUNT(DISTINCT u.person_id) AS kisi
           FROM kurulumlar u JOIN kisiler k ON k.person_id = u.person_id
          WHERE ${K.sql} AND u.son_gorulme >= ?
          GROUP BY 1, 2 ORDER BY kisi DESC LIMIT 20`, [...K.b, f.baslangic]),
    hep(`SELECT COALESCE(u.platform,'?') AS platform, COALESCE(u.os_surumu,'?') AS os, COUNT(DISTINCT u.person_id) AS kisi
           FROM kurulumlar u JOIN kisiler k ON k.person_id = u.person_id
          WHERE ${K.sql} AND u.son_gorulme >= ?
          GROUP BY 1, 2 ORDER BY kisi DESC LIMIT 20`, [...K.b, f.baslangic]),
    hep(`SELECT o.ad AS ad, COUNT(DISTINCT o.person_id) AS tekil, COUNT(*) AS adet FROM olaylar o
          WHERE ${O.sql} AND o.ad LIKE 'feature.%' GROUP BY o.ad ORDER BY tekil DESC, adet DESC`, O.b),
    hep(`SELECT ts, aktor, eylem, hedef, sebep, guven FROM denetim_kutugu ORDER BY ts DESC LIMIT 30`),
    hep(`SELECT sonuc, COALESCE(saglayici,'?') AS saglayici, COUNT(*) AS adet FROM owner_erisim_kutugu
          WHERE ts > ? GROUP BY sonuc, saglayici ORDER BY adet DESC`, [s - 7 * 86400]),
    hep(`SELECT ts, COALESCE(saglayici,'?') AS saglayici, sonuc, sebep, yol FROM owner_erisim_kutugu
          WHERE ts > ? ORDER BY ts DESC LIMIT 25`, [s - 7 * 86400]),
    hep(`SELECT anahtar, sonuc, COUNT(*) AS adet, MAX(zaman) AS son FROM guncelleme_gonderim
          GROUP BY anahtar, sonuc ORDER BY son DESC LIMIT 40`),
    hep(`SELECT platform, COUNT(*) AS cihaz FROM guncelleme_cihaz GROUP BY platform`),
    hep(`SELECT uc, sinif, SUM(adet) AS adet FROM api_saglik WHERE gun >= ? GROUP BY uc, sinif`,
      [new Date((s - 7 * 86400) * 1000).toISOString().slice(0, 10)]),
    hep(`SELECT COALESCE(json_extract(o.ek,'$.kaynak'),'?') AS kaynak, COALESCE(o.uygulama_surumu,'?') AS surum,
                COALESCE(o.platform,'?') AS platform, COUNT(*) AS adet, COUNT(DISTINCT o.person_id) AS kisi
           FROM olaylar o WHERE ${O.sql} AND o.ad = 'app.crash'
          GROUP BY 1, 2, 3 ORDER BY adet DESC LIMIT 20`, O.b),
    tek(`SELECT COALESCE(SUM(o.ad = 'review.eligible'),0) AS uygun,
                COALESCE(SUM(o.ad = 'review.request_attempted'),0) AS istendi,
                COUNT(DISTINCT CASE WHEN o.ad = 'review.request_attempted' THEN o.person_id END) AS istenen_kisi
           FROM olaylar o WHERE ${O.sql} AND o.ad IN ('review.eligible','review.request_attempted')`, O.b),
    tutundurma(1), tutundurma(7), tutundurma(30),
    hep(`SELECT ulke, COUNT(*) AS kisi FROM kisiler WHERE ulke IS NOT NULL GROUP BY ulke ORDER BY kisi DESC LIMIT 40`),
    hep(`SELECT uygulama_surumu AS surum, COUNT(*) AS kurulum FROM kurulumlar WHERE uygulama_surumu IS NOT NULL
          GROUP BY uygulama_surumu ORDER BY kurulum DESC LIMIT 20`),
  ]);

  const huniSay = Object.fromEntries(huniHam.map((r) => [r.ad, r.tekil]));
  const satis = new Map(ulkeSatis.map((r) => [r.ulke, r]));
  const apiUclar = new Map();
  for (const r of api) {
    const x = apiUclar.get(r.uc) || { uc: r.uc, '2xx': 0, '4xx': 0, '5xx': 0, toplam: 0 };
    x[r.sinif] += r.adet;
    x.toplam += r.adet;
    apiUclar.set(r.uc, x);
  }
  const tut = (r) => ({ kohort: r?.kohort || 0, donen: r?.donen || 0, oran: oran(r?.donen || 0, r?.kohort || 0) });

  return {
    olcum_ts: s,
    filtre: f,
    ozet: { ...ozet, aktive_orani: oran(ozet?.aktive || 0, ozet?.gercek_kisi || 0) },
    para: {
      ...para,
      donusum: oran(ozet?.odeyen || 0, ozet?.gercek_kisi || 0),
    },
    gelir: {
      gelir_kurus: gelirAralik?.gelir_kurus || 0,
      islem: gelirAralik?.islem || 0,
      sandbox_islem: gelirAralik?.sandbox_islem || 0,
      iade: gelirAralik?.iade || 0,
      bugun_kurus: gelir?.bugun || 0,
      g7_kurus: gelir?.g7 || 0,
      g30_kurus: gelir?.g30 || 0,
      toplam_kurus: gelir?.gelir_kurus || 0,
      // Aylık plan: son 30 günün geliri; yıllık ve aile planı: son 365 günün geliri / 12.
      // İade ve iptal düşülmez; "yaklaşık" etiketiyle gösterilir.
      mrr_yaklasik_kurus: Math.round((gelir?.g30_aylik || 0) + (gelir?.g365_uzun || 0) / 12),
    },
    tutundurma: { d1: tut(d1), d7: tut(d7), d30: tut(d30) },
    funnel: huniHesapla(huniSay),
    ulkeler: ulkeler.map((u) => {
      const x = satis.get(u.ulke);
      const sat = x?.satis || 0;
      const gk = x?.gelir_kurus || 0;
      return { ...u, satis: sat, gelir_kurus: gk, iade: x?.iade || 0, donusum: oran(u.odeyen, u.kisi),
        arpu_kurus: u.kisi > 0 ? Math.round(gk / u.kisi) : null, arppu_kurus: u.odeyen > 0 ? Math.round(gk / u.odeyen) : null };
    }),
    reklam_hunisi: reklamHunisi.map((r) => ({
      ...r,
      gosterim_orani: oran(r.gosterim, r.yuklendi),
      yukleme_orani: oran(r.yuklendi, r.istek),
      oturum_basina_gosterim: r.oturum > 0 ? +(r.gosterim / r.oturum).toFixed(2) : null,
    })),
    dislanan_trafik: dislanan,
    olay_dagilimi: olayDagilim,
    surumler,
    cihazlar,
    isletim_sistemleri: isletim,
    ozellikler,
    denetim_kutugu: denetim,
    owner_erisim: { ozet: erisimSay, son: erisimSon },
    guncelleme: { gonderim: guncelleme, kayitli_cihaz: guncellemeCihaz },
    api: [...apiUclar.values()].map((x) => ({ ...x, hata_orani: oran(x['5xx'], x.toplam) })).sort((a, b) => b.toplam - a.toplam),
    cokme: { satirlar: cokme, kapsam: 'JavaScript hataları (hata sınırı + ölümcül hata işareti). Yerel (native) çökme bu yolla ölçülmez.' },
    puan,
    secenekler: { ulkeler: secenekUlke.map((r) => r.ulke), surumler: secenekSurum.map((r) => r.surum) },
    veri_sagligi: {
      _not: 'Gelir yalnız doğrulanmış production işlemden sayılır. Sandbox ayrı gösterilir, toplama karışmaz.',
      sandbox_islem: gelirAralik?.sandbox_islem || 0,
    },
  };
}
