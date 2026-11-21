/**
 * MAĞAZA YILDIZ PENCERESİ — saf karar modülü. React Native içe aktarımı YOK;
 * saat, kurulum, açılış sayısı, pencere ve olay ENJEKTE edilir (test edilebilir).
 *
 * Standart: `~/.claude/standards/magaza-degerlendirme.md` (Samet, 03-11-2026:
 * "tevkil merkezi uygulamamızdaki gibi bundan sonra yaptığımız tüm uygulamalar
 * için geçerli olacak"). Referans: Tevkil Merkezi Görev, commit 1e4e3bce,
 * `src/utils/puanDenetleyici.ts`. Karar mantığı birebir aynıdır; farklar:
 *   · OLUMLU_ANLAR bu ürünün değer anlarıdır.
 *   · Hukuki Sözlük hesap istemez (Apple 5.1.1(v)) → "hesap" yerine KURULUM
 *     verilir (standart §2, BUSATER uyarlaması). Giriş yapılsa da yapılmasa da
 *     aynı kurulum aynı kişidir.
 *   · Olay adları Owner standardı §7 biçiminde (`review.eligible`).
 *
 * KURAL
 *  · Yalnız mağazanın KENDİ penceresi (simge, beş yıldız, "Şimdi Değil").
 *    Kendi yıldız kutumuz ve "Memnun musunuz?" ön sorusu YOK — review gating,
 *    Apple 5.6.1 ("we will disallow custom review prompts") ve Google Play.
 *  · Tetik A: alt menüde her GEZINME_ESIGI'nci sekme DEĞİŞİMİ (4., 8., 12. …).
 *  · Tetik B: OLUMLU_ANLAR'dan biri, yalnız işlem başarıyla bittikten sonra.
 *  · Bizim tarafımızda bekleme süresi YOK. Sıklığı mağaza belirler: Apple aynı
 *    kişiye 365 günde en çok 3 kez gösterir, yıldız verene göstermez.
 *  · İlk açılışta istenmez. Olumsuz an bekleyeni siler. Rastgelelik yok.
 *
 * AKIŞ: tetik → istek BEKLEYEN olur → kullanıcı bir ana sekme ekranına dönünce
 * (sakin an, 1,5 sn sonra) pencere istenir. Mağaza pencereyi gösterip
 * göstermediğini ve verilen yıldızı bildirmez: burada yalnız "istendi" vardır.
 */

export const OLUMLU_ANLAR = [
  'pro_basladi', // RevenueCat'in doğruladığı Pro hakkı başladı
  'ders_bitti', // ders başarıyla bitti (sonuç ekranı)
  'unite_bitti', // ünite tamamlandı
] as const;
export type OlumluAn = (typeof OLUMLU_ANLAR)[number];

/** Kaç sekme değişiminde bir istensin (4., 8., 12. …). */
export const GEZINME_ESIGI = 4;
/** Bekleyen istek bu süre içinde sakin ana ulaşmazsa düşer. */
export const BEKLEYEN_OMRU_MS = 10 * 60 * 1000;

export type PuanOlayi = 'review.eligible' | 'review.request_attempted';

export type AnKarari = 'kurulum_yok' | 'bilinmeyen_an' | 'yinelenen' | 'ilk_acilis' | 'bekliyor';
export type GezinmeKarari = 'kurulum_yok' | 'esik_degil' | 'ilk_acilis' | 'bekliyor';
export type SakinAnSonucu = 'bekleyen_yok' | 'suresi_gecti' | 'kurulum_yok' | 'pencere_yok' | 'istendi';

export interface PuanBagimliliklari {
  simdi: () => number;
  /** Bu kurulumun kimliği. Henüz bilinmiyorsa null → hiçbir şey yapılmaz. */
  kurulum: () => string | null;
  /** Bu cihazda uygulamanın kaçıncı açılışı (1 = ilk açılış → istenmez). */
  acilisSayisi: () => number;
  /** Mağazanın penceresi bu kurulumda kullanılabilir mi (TestFlight / mağaza dışı → false). */
  pencereVar: () => Promise<boolean>;
  /** Mağazanın penceresini iste (gösterip göstermemek mağazanın kararıdır). */
  pencereIste: () => Promise<void>;
  olay: (tip: PuanOlayi) => void;
}

export function olumluAnMi(v: unknown): v is OlumluAn {
  return typeof v === 'string' && (OLUMLU_ANLAR as readonly string[]).includes(v);
}

export function puanDenetleyici(b: PuanBagimliliklari) {
  /** Bu oturumda değerlendirilmiş anlar (`an:anahtar`): yeniden çizim ikinci kez saymasın. */
  const gorulenler: Set<string> = new Set();
  let bekleyen: { ms: number; kurulum: string } | null = null;
  let suren: Promise<SakinAnSonucu> | null = null;
  let gezinme = 0;

  function bekleyenYap(kurulum: string): 'bekliyor' {
    b.olay('review.eligible');
    bekleyen = { ms: b.simdi(), kurulum };
    return 'bekliyor';
  }

  /**
   * Olumlu bir an gerçekleşti. YALNIZ işlem başarıyla bittikten sonra çağrılır.
   * `anahtar` anı ayırır (ör. terim kimliği): aynı an + aynı anahtar bu
   * oturumda bir kez değerlendirilir.
   */
  async function olumluAn(an: unknown, anahtar: string): Promise<AnKarari> {
    const kurulum = b.kurulum();
    if (!kurulum) return 'kurulum_yok';
    if (!olumluAnMi(an)) return 'bilinmeyen_an';
    const kimlik = `${an}:${anahtar}`;
    if (gorulenler.has(kimlik)) return 'yinelenen';
    gorulenler.add(kimlik);
    if (b.acilisSayisi() < 2) return 'ilk_acilis';
    return bekleyenYap(kurulum);
  }

  /** Alt menüde sekme DEĞİŞTİ (aynı sekmeye yeniden basmak sayılmaz). */
  function gezinmeAni(): GezinmeKarari {
    const kurulum = b.kurulum();
    if (!kurulum) return 'kurulum_yok';
    gezinme++;
    if (gezinme % GEZINME_ESIGI !== 0) return 'esik_degil';
    if (b.acilisSayisi() < 2) return 'ilk_acilis';
    return bekleyenYap(kurulum);
  }

  /** Olumsuz bir şey oldu (satın alma hatası, paywall'dan vazgeçme, yapay zekâ hatası): bekleyen silinir. */
  function olumsuzAn(): void {
    bekleyen = null;
  }

  async function sakinAnIci(): Promise<SakinAnSonucu> {
    const bek = bekleyen;
    if (!bek) return 'bekleyen_yok';
    bekleyen = null; // tek kullanımlık: sonucu ne olursa olsun aynı tetik yeniden denenmez
    if (b.simdi() - bek.ms > BEKLEYEN_OMRU_MS) return 'suresi_gecti';
    const kurulum = b.kurulum();
    if (!kurulum || kurulum !== bek.kurulum) return 'kurulum_yok';
    if (!(await b.pencereVar())) return 'pencere_yok';
    b.olay('review.request_attempted');
    await b.pencereIste();
    return 'istendi';
  }

  /** Sakin an: kullanıcı bir ana sekmeye döndü. Aynı anda iki kez çağrılırsa TEK deneme yapılır. */
  function sakinAn(): Promise<SakinAnSonucu> {
    if (!suren) {
      suren = sakinAnIci().finally(() => {
        suren = null;
      });
    }
    return suren;
  }

  return { olumluAn, gezinmeAni, olumsuzAn, sakinAn, bekleyenVar: () => bekleyen !== null };
}
