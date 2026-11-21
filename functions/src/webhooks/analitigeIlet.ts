// ════════════════════════════════════════════════════════════════
// RevenueCat olayını Vogel analitik sunucusuna İLET (Owner Control Center §5 · BUILD AL 21-11-2026)
//
// Panelin "doğrulanmış gelir"i yalnız sunucu tarafı mağaza olayından gelir. RevenueCat'te ikinci
// webhook tanımlamak yerine bu fonksiyon, doğruladığı olayı Cloudflare'deki analitik sunucusuna
// paylaşılan anahtarla iletir (server/analitik → POST /webhook/revenuecat, idempotent).
//
// 🔴 İletim başarısız olursa RevenueCat'e verilen yanıt DEĞİŞMEZ (aile planı akışı etkilenmez);
//    hata günlüğe yazılır, yutulmaz. Sunucu olay kimliğiyle tekrarı reddettiği için yeniden deneme güvenlidir.
// ════════════════════════════════════════════════════════════════
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

export const VOGEL_ANALITIK_SECRET = defineSecret('VOGEL_ANALITIK_SECRET');
const ADRES = 'https://vogel-analitik.eczapharm-busater.workers.dev/webhook/revenuecat';

export async function analitigeIlet(govde: unknown): Promise<void> {
  const denetleyici = new AbortController();
  const zamanlayici = setTimeout(() => denetleyici.abort(), 5000);
  try {
    const r = await fetch(ADRES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${VOGEL_ANALITIK_SECRET.value().trim()}` },
      body: JSON.stringify(govde),
      signal: denetleyici.signal,
    });
    if (!r.ok) logger.error('[analitigeIlet] sunucu reddetti', { status: r.status });
  } catch (e) {
    logger.error('[analitigeIlet] iletilemedi', { hata: String(e).slice(0, 200) });
  } finally {
    clearTimeout(zamanlayici);
  }
}
