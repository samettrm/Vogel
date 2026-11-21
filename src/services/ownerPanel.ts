/**
 * Owner Control Center — istemci veri erişimi (Canlı Döviz lib/owner-panel.ts uyarlaması · 21-11-2026).
 * 🔴 YETKİ BURADA VERİLMEZ. Karar sunucuda (server/analitik): Firebase belirtecindeki, sağlayıcının
 * DOĞRULADIĞI e-posta owner listesinde olmalı (yalnız sametterme0@gmail.com). Owner değilse sunucu 404 döner.
 */
import { firebaseAuth } from '../config/firebase';
import { ANALITIK_SUNUCU } from './olay';

async function idToken(): Promise<string | null> {
  const u = firebaseAuth?.currentUser;
  if (!u || u.isAnonymous) return null;
  try {
    return await u.getIdToken();
  } catch (e) {
    console.warn('[owner-panel] belirteç alınamadı:', String(e).slice(0, 120));
    return null;
  }
}

export type Aralik = 'bugun' | '24s' | '7g' | '30g' | '90g' | 'tumu';
export type Sinif = 'gercek' | 'organic' | 'unattributed_production' | 'dislanan' | 'tumu';
export interface PanelFiltre {
  aralik: Aralik;
  platform: 'ios' | 'android' | null;
  ulke: string | null;
  surum: string | null;
  sinif: Sinif;
}
export const VARSAYILAN_FILTRE: PanelFiltre = { aralik: '30g', platform: null, ulke: null, surum: null, sinif: 'gercek' };

export interface PanelOzet {
  gercek_kisi: number; organik: number; cevrimici: number; dau: number; wau: number; mau: number;
  aralikta_gorulen: number; yeni_24s: number; yeni_7g: number; yeni_30g: number; yeni_aralik: number;
  aktive: number; aktive_orani: number | null; odeyen: number; kurulum: number; olay: number;
}
interface Tutundurma { kohort: number; donen: number; oran: number | null }
export interface PanelVerisi {
  olcum_ts: number;
  filtre: PanelFiltre & { baslangic: number };
  ozet: PanelOzet;
  para: { paywall_kisi: number; satin_alma_deneyen: number; satin_alma_denemesi: number; satin_alma_hatasi: number; donusum: number | null };
  gelir: {
    gelir_kurus: number; islem: number; sandbox_islem: number; iade: number;
    bugun_kurus: number; g7_kurus: number; g30_kurus: number; toplam_kurus: number; mrr_yaklasik_kurus: number;
  };
  tutundurma: { d1: Tutundurma; d7: Tutundurma; d30: Tutundurma };
  ulkeler: {
    ulke: string; kisi: number; aktive: number; odeyen: number; yeni: number; dau: number;
    satis: number; gelir_kurus: number; iade: number; donusum: number | null;
    arpu_kurus: number | null; arppu_kurus: number | null;
  }[];
  funnel: {
    adimlar: { ad: string; tekil: number; onceye_gore: number | null; ilke_gore: number | null; kayip: number }[];
    en_buyuk_dusus: { nereden: string; nereye: string; kayip: number; oran: number } | null;
  };
  /**
   * REKLAM HUNİSİ — platform × biçim × sürüm × sınıf kırılımı.
   * Oranlar SUNUCUDA hesaplanır; payda sıfırsa `null` gelir (uydurma yüzde yok).
   */
  reklam_hunisi: {
    platform: string; bicim: string; surum: string; sinif: 'gercek' | 'owner_test';
    oturum: number; istek: number; yuklendi: number; yukleme_hatasi: number;
    gosterim_denemesi: number; gosterim: number; kapatildi: number;
    atlandi_premium: number; atlandi_arkaplan: number; atlandi_bekleme: number;
    atlandi_hazir_degil: number;
    gosterim_orani: number | null; yukleme_orani: number | null;
    oturum_basina_gosterim: number | null;
  }[];
  dislanan_trafik: { trafik_sinifi: string | null; sebep: string | null; kisi: number }[];
  olay_dagilimi: { ad: string; adet: number }[];
  surumler: { platform: string; surum: string; kisi: number; kurulum: number }[];
  cihazlar: { platform: string; cihaz: string; kisi: number }[];
  isletim_sistemleri: { platform: string; os: string; kisi: number }[];
  ozellikler: { ad: string; tekil: number; adet: number }[];
  denetim_kutugu: { ts: number; aktor: string | null; eylem: string; hedef: string | null; sebep: string | null; guven: string | null }[];
  owner_erisim: {
    ozet: { sonuc: string; saglayici: string; adet: number }[];
    son: { ts: number; saglayici: string; sonuc: string; sebep: string | null; yol: string | null }[];
  };
  guncelleme: {
    gonderim: { anahtar: string; sonuc: string; adet: number; son: number }[];
    kayitli_cihaz: { platform: string; cihaz: number }[];
  };
  api: { uc: string; '2xx': number; '4xx': number; '5xx': number; toplam: number; hata_orani: number | null }[];
  cokme: { satirlar: { kaynak: string; surum: string; platform: string; adet: number; kisi: number }[]; kapsam: string };
  puan: { uygun: number; istendi: number; istenen_kisi: number };
  secenekler: { ulkeler: string[]; surumler: string[] };
  veri_sagligi: { sandbox_islem: number };
}

/** Panel verisi. Owner değilse sunucu 404 verir ve burada hata fırlatılır. */
export async function panelVerisi(f: PanelFiltre = VARSAYILAN_FILTRE): Promise<PanelVerisi> {
  const t = await idToken();
  if (!t) throw new Error('Giriş gerekli');
  const q = new URLSearchParams({ aralik: f.aralik, sinif: f.sinif });
  if (f.platform) q.set('platform', f.platform);
  if (f.ulke) q.set('ulke', f.ulke);
  if (f.surum) q.set('surum', f.surum);
  const r = await fetch(`${ANALITIK_SUNUCU}/panel?${q.toString()}`, { headers: { Authorization: `Bearer ${t}` } });
  if (r.status === 404) throw new Error('Bu hesapta panel yok');
  if (!r.ok) throw new Error(`Sunucu hatası (${r.status})`);
  return (await r.json()) as PanelVerisi;
}
