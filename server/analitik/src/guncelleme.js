/**
 * GÜNCELLEME BİLDİRİMİ — sunucu (Emir Defteri A2 · ~/.claude/standards/guncelleme-bildirimi.md).
 * NEXGPS `workers/hesap/src/guncellemeBildirimi.ts` deseninin düz JS uyarlaması (21-11-2026).
 *
 * Yeni sürüm mağazada KULLANICIYA GÖRÜNDÜĞÜ an, eski sürümdeki her cihaza TEK bildirim:
 *   başlık "Vogel", gövde "Yeni bir güncelleme var. Güncellemek için tıklayınız." (cihazın diliyle),
 *   dokununca mağaza sayfası (`data.type = "app_update"`, `data.url`).
 *  · iOS: App Store katalog ucu yeni sürümü döndürdüğünde. `itunes.apple.com/lookup` KULLANILMAZ:
 *    Cloudflare Worker çıkışına 403 döner (ANTI-SİSTEM FAZ 4.207 · KAPI 157).
 *  · Android: Play üretim kanalında sürüm `completed` (%100) olduğunda; `PLAY_HIZMET_HESABI` gizlisi yoksa
 *    Android denetimi atlanır (hata olarak raporlanır, yutulmaz).
 *  · Tetik: cron-job.org her 10 dakikada `POST /guncelleme/tetik` çağırır (Cloudflare cron kotası dolu).
 *    Uç herkese açıktır ama 5 dakikadan sık ÇALIŞMAZ; gönderim kaydı aynı sürümü ikinci kez göndermez.
 * 🔴 Apple 4.5.4: hizmet bildirimidir; kampanya, sürüm numarası ya da yenilik listesi YAZILMAZ.
 */

export const PUSH_JETONU = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,200}\]$/;
const KURULUM = /^[A-Za-z0-9_-]{16,128}$/;
const SURUM = /^[0-9]{1,4}(\.[0-9]{1,4}){1,3}$/;

const APPLE_ID = '6771534635';
const BUNDLE = 'com.yenipc002.Vogel';
const PAKET = 'com.busater.vogel';
const BASLIK = 'Vogel';
export const MAGAZA = {
  ios: `itms-apps://apps.apple.com/app/id${APPLE_ID}`,
  android: `market://details?id=${PAKET}`,
};
const TETIK_ARALIGI_MS = 5 * 60_000;
export const CALISMA_SINIRI = 2000;
const PARTI = 100;
const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

/** Gövde — standart metnin birebir çevirileri; başka hiçbir şey yazılmaz. Uygulamanın 14 dili. */
export const GOVDE = {
  tr: 'Yeni bir güncelleme var. Güncellemek için tıklayınız.',
  en: 'A new update is available. Tap to update.',
  de: 'Ein neues Update ist verfügbar. Zum Aktualisieren tippen.',
  fr: 'Une nouvelle mise à jour est disponible. Touchez pour mettre à jour.',
  es: 'Hay una nueva actualización. Toque para actualizar.',
  it: 'È disponibile un nuovo aggiornamento. Tocca per aggiornare.',
  pt: 'Está disponível uma nova atualização. Toque para atualizar.',
  nl: 'Er is een nieuwe update beschikbaar. Tik om bij te werken.',
  ru: 'Доступно новое обновление. Нажмите, чтобы обновить.',
  ar: 'يتوفر تحديث جديد. اضغط للتحديث.',
  hi: 'नया अपडेट उपलब्ध है। अपडेट करने के लिए टैप करें।',
  ja: '新しいアップデートがあります。タップしてアップデートしてください。',
  ko: '새 업데이트가 있습니다. 업데이트하려면 탭하세요.',
  zh: '有新的更新。轻点即可更新。',
};

export function govdeSec(dil) {
  if (typeof dil === 'string' && dil) {
    if (GOVDE[dil]) return GOVDE[dil];
    const kok = dil.split(/[-_]/)[0].toLowerCase();
    if (GOVDE[kok]) return GOVDE[kok];
  }
  return GOVDE.en;
}

/** İstemcinin kayıt gövdesi; geçersizse null. */
export function kayitCoz(g) {
  if (!g || typeof g !== 'object') return null;
  if (typeof g.kurulum !== 'string' || !KURULUM.test(g.kurulum)) return null;
  if (typeof g.token !== 'string' || !PUSH_JETONU.test(g.token)) return null;
  if (g.platform !== 'ios' && g.platform !== 'android') return null;
  const metin = (v, n) => (typeof v === 'string' && v.length > 0 && v.length <= n ? v : null);
  return {
    kurulum: g.kurulum,
    token: g.token,
    platform: g.platform,
    surum: metin(g.surum, 20),
    derleme: metin(g.derleme, 20),
    dil: metin(g.dil, 35),
  };
}

export function hedefAnahtari(h) {
  return h.platform === 'ios' ? `ios:${h.surum}` : `android:vc${h.surumKodu}`;
}

export function surumKarsilastir(a, b) {
  if (!a || !b || !SURUM.test(a) || !SURUM.test(b)) return null;
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** Saf karar: hedefin platformundaki, sürümü kesin ESKİ olan ve bu sürüm için bildirim almamış cihazlar. */
export function gonderilecekler(adaylar, h, gonderilmis) {
  return adaylar.filter((a) => {
    if (a.platform !== h.platform || gonderilmis.has(a.kurulum)) return false;
    if (h.platform === 'ios') return surumKarsilastir(a.surum, h.surum) === -1;
    const kod = Number(a.derleme);
    return Number.isInteger(kod) && kod > 0 && kod < h.surumKodu;
  });
}

export function mesaj(a) {
  return {
    to: a.token,
    title: BASLIK,
    body: govdeSec(a.dil),
    data: { type: 'app_update', url: MAGAZA[a.platform] },
    priority: 'default',
    channelId: 'guncelleme',
  };
}

const APPLE_KATALOG = 'https://uclient-api.itunes.apple.com/WebObjects/MZStorePlatform.woa/wa/lookup';

/** App Store'un kullanıcıya gösterdiği sürüm; yayında değilse null; bilinemiyorsa HATA (tahmin yürütülmez). */
export async function appStoreSurumu(getir) {
  for (const ulke of ['tr', 'us']) {
    const y = await getir(
      `${APPLE_KATALOG}?version=2&id=${APPLE_ID}&p=mdm-lockup&caller=MDM&platform=enterprisestore&cc=${ulke}&l=en`,
      { signal: AbortSignal.timeout(15_000) },
    );
    if (!y.ok) throw new Error(`App Store katalog ${y.status}`);
    const govde = await y.json();
    const kayit = govde?.results?.[APPLE_ID];
    if (!kayit) continue;
    if (kayit.bundleId !== BUNDLE) throw new Error(`App Store kimliği başka pakete ait (${String(kayit.bundleId)})`);
    const surum = String(kayit.offers?.[0]?.version?.display ?? '').trim();
    if (!SURUM.test(surum)) throw new Error('App Store sürüm biçimi tanınmadı');
    return surum;
  }
  return null;
}

// ── Google hizmet hesabı (Play Developer API, salt okuma) ─────────────────────
const BELIRTEC_URL = 'https://oauth2.googleapis.com/token';
const KAPSAM = 'https://www.googleapis.com/auth/androidpublisher';
let belirtec = null;

function b64u(bayt) {
  let s = '';
  for (const b of bayt) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemdenPkcs8(pem) {
  const ham = atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const b = new Uint8Array(ham.length);
  for (let i = 0; i < ham.length; i++) b[i] = ham.charCodeAt(i);
  return b;
}

async function erisimBelirteci(hesap, getir) {
  if (belirtec && belirtec.bitis - 60_000 > Date.now()) return belirtec.deger;
  const simdi = Math.floor(Date.now() / 1000);
  const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const ust = enc({ alg: 'RS256', typ: 'JWT' });
  const gov = enc({ iss: hesap.client_email, scope: KAPSAM, aud: BELIRTEC_URL, iat: simdi, exp: simdi + 3600 });
  const anahtar = await crypto.subtle.importKey(
    'pkcs8',
    pemdenPkcs8(hesap.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const imza = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', anahtar, new TextEncoder().encode(`${ust}.${gov}`)));
  const c = await getir(BELIRTEC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${ust}.${gov}.${b64u(imza)}`,
    signal: AbortSignal.timeout(15_000),
  });
  if (!c.ok) throw new Error(`Google belirteç ${c.status}`);
  const j = await c.json();
  if (typeof j.access_token !== 'string') throw new Error('Google belirteci boş');
  belirtec = { deger: j.access_token, bitis: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return belirtec.deger;
}

/** Play üretim kanalında %100 (completed) dağıtılmış en yüksek sürüm kodu; yoksa null. Düzenleme silinir. */
export async function playUretimSurumKodu(hesap, getir) {
  const kok = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}`;
  const yetki = { Authorization: `Bearer ${await erisimBelirteci(hesap, getir)}` };
  const e = await getir(`${kok}/edits`, { method: 'POST', headers: yetki, signal: AbortSignal.timeout(15_000) });
  if (!e.ok) throw new Error(`Play düzenleme ${e.status}`);
  const id = (await e.json())?.id;
  if (!id) throw new Error('Play düzenleme kimliği yok');
  try {
    const t = await getir(`${kok}/edits/${id}/tracks/production`, { headers: yetki, signal: AbortSignal.timeout(15_000) });
    if (!t.ok) throw new Error(`Play üretim kanalı ${t.status}`);
    const kodlar = ((await t.json())?.releases ?? [])
      .filter((r) => r.status === 'completed')
      .flatMap((r) => (r.versionCodes ?? []).map(Number))
      .filter((n) => Number.isInteger(n) && n > 0);
    return kodlar.length > 0 ? Math.max(...kodlar) : null;
  } finally {
    const s = await getir(`${kok}/edits/${id}`, { method: 'DELETE', headers: yetki, signal: AbortSignal.timeout(15_000) });
    if (!s.ok && s.status !== 404) console.warn('[guncelleme] Play düzenlemesi silinemedi', s.status);
  }
}

// ── D1 ────────────────────────────────────────────────────────────────────────
export async function cihazKaydet(db, k, simdi) {
  await db
    .prepare(
      'INSERT INTO guncelleme_cihaz (kurulum, platform, token, surum, derleme, dil, guncellendi) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ' +
        'ON CONFLICT(kurulum) DO UPDATE SET platform = excluded.platform, token = excluded.token, surum = excluded.surum, ' +
        'derleme = excluded.derleme, dil = excluded.dil, guncellendi = excluded.guncellendi ' +
        'WHERE guncelleme_cihaz.token IS NOT excluded.token OR guncelleme_cihaz.surum IS NOT excluded.surum ' +
        'OR guncelleme_cihaz.derleme IS NOT excluded.derleme OR guncelleme_cihaz.dil IS NOT excluded.dil',
    )
    .bind(k.kurulum, k.platform, k.token, k.surum, k.derleme, k.dil, simdi)
    .run();
}

async function adaylar(db) {
  const r = await db.prepare('SELECT kurulum, platform, token, surum, derleme, dil FROM guncelleme_cihaz').all();
  return r.results ?? [];
}
async function gonderilmisler(db, anahtar) {
  const r = await db.prepare('SELECT kurulum FROM guncelleme_gonderim WHERE anahtar = ?1').bind(anahtar).all();
  return new Set((r.results ?? []).map((s) => s.kurulum));
}

async function gonder(db, getir, h, liste, simdi) {
  const anahtar = hedefAnahtari(h);
  let ok = 0;
  let hata = 0;
  for (let i = 0; i < liste.length; i += PARTI) {
    const parti = liste.slice(i, i + PARTI);
    const y = await getir(EXPO_PUSH, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(parti.map(mesaj)),
      signal: AbortSignal.timeout(20_000),
    });
    if (!y.ok) throw new Error(`Expo Push ${y.status}`); // kayıt yazılmaz → sonraki çalışmada yeniden denenir
    const biletler = (await y.json())?.data ?? [];
    for (const [j, a] of parti.entries()) {
      const b = biletler[j];
      const basarili = b?.status === 'ok';
      if (basarili) ok += 1;
      else hata += 1;
      if (b?.details?.error === 'DeviceNotRegistered') {
        await db.prepare('DELETE FROM guncelleme_cihaz WHERE kurulum = ?1').bind(a.kurulum).run();
      }
      await db
        .prepare('INSERT OR IGNORE INTO guncelleme_gonderim (kurulum, anahtar, sonuc, zaman) VALUES (?1, ?2, ?3, ?4)')
        .bind(a.kurulum, anahtar, basarili ? 'ok' : 'hata', simdi)
        .run();
    }
  }
  return { anahtar, ok, hata };
}

/** Tetik: 5 dakikadan sık çalışmaz; iki platformu BAĞIMSIZ denetler; hata yutulmaz (döner ve günlüğe yazılır). */
export async function guncellemeTaramasi(env, getir = fetch) {
  const db = env.DEVICE_DB;
  const simdi = Date.now();
  const son = await db.prepare("SELECT deger FROM guncelleme_durum WHERE ad = 'son_tarama'").first();
  if (son && simdi - Number(son.deger) < TETIK_ARALIGI_MS) return { atlandi: true };
  await db
    .prepare("INSERT INTO guncelleme_durum (ad, deger) VALUES ('son_tarama', ?1) ON CONFLICT(ad) DO UPDATE SET deger = excluded.deger")
    .bind(simdi)
    .run();

  const sonuclar = [];
  const hatalar = [];
  const hedefler = [];
  const liste = await adaylar(db);
  const platformlar = new Set(liste.map((a) => a.platform));
  if (platformlar.has('ios')) {
    try {
      const s = await appStoreSurumu(getir);
      if (s !== null) hedefler.push({ platform: 'ios', surum: s });
    } catch (e) {
      hatalar.push(`ios: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (platformlar.has('android')) {
    if (!env.PLAY_HIZMET_HESABI) {
      hatalar.push('android: PLAY_HIZMET_HESABI tanımlı değil');
    } else {
      try {
        const k = await playUretimSurumKodu(JSON.parse(env.PLAY_HIZMET_HESABI), getir);
        if (k !== null) hedefler.push({ platform: 'android', surumKodu: k });
      } catch (e) {
        hatalar.push(`android: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  for (const h of hedefler) {
    try {
      const secilen = gonderilecekler(liste, h, await gonderilmisler(db, hedefAnahtari(h))).slice(0, CALISMA_SINIRI);
      if (secilen.length > 0) sonuclar.push(await gonder(db, getir, h, secilen, simdi));
    } catch (e) {
      hatalar.push(`${hedefAnahtari(h)}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (hatalar.length > 0) console.warn('[guncelleme] tarama hataları:', hatalar.join(' | '));
  return { sonuclar, hatalar };
}
