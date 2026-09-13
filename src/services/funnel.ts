import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseDb, isFirebaseConfigured } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';

// ════════════════════════════════════════════════════════════════
// FUNNEL ANALİTİĞİ — install → ilk ders → paywall → satış hunisi
//
// BUSATER Owner Control Center standardı (§7 Zorunlu Olaylar) uyumlu.
// Amaç: dönüşüm hunisinde EN BÜYÜK KAYBIN nerede olduğunu ölçmek —
// "kaç kişi paywall gördü · kaçı satın almaya bastı · kaçı ödedi" (§14).
//
// 🔒 TASARIM KARARLARI (bilerek):
//   • fail-safe · async · uygulama akışını ASLA bloklamaz/bozmaz.
//   • Yeni Firestore koleksiyonu / rules değişikliği YOK. Milestone'lar
//     kullanıcının kendi cihaz dokümanına (/users/{uid}/devices/{id})
//     merge edilir — bu yol firestore.rules'ta ZATEN yazılabilir ve
//     yönetim paneli (getAdminStats) bu dokümanı zaten okuyor.
//   • Idempotency: her olay OTURUM başına bir kez yazılır (in-memory
//     guard). `firstAt` yalnızca ilk kez, `lastAt` her seferinde.
//   • KİMLİK: kaynağı kanıtlanamayan production kullanıcı için varsayılan
//     'unattributed_production' — ASLA 'organic' değil (standard §2/§79).
//
// ⚠️ Panel AGGREGATION + gösterim server tarafıdır (getAdminStats) →
//    o kısım ayrı bir BUILD/deploy işidir. Bu dosya yalnızca ham
//    milestone'ları TOPLAR; veri deploy'dan önce de birikmeye başlar.
// ════════════════════════════════════════════════════════════════

// Standard §7 ile hizalı kanonik olay adları.
export type FunnelEvent =
  | 'app.first_open'
  | 'lesson.completed'      // core value / activation sinyali
  | 'value.activated'       // ilk anlamlı öğrenme anı
  | 'paywall.viewed'
  | 'paywall.plan_selected' // CTA'ya basıldı (satın alma denendi)
  | 'purchase.completed';

const INSTALL_ID_KEY = 'vogel.installationId'; // presence.ts ile AYNI anahtar

// Oturum başına idempotency — aynı olayı bir kez yaz.
const _sentThisSession = new Set<string>();

function currentUid(): string | null {
  try {
    return useAuthStore.getState().user?.uid ?? null;
  } catch {
    return null;
  }
}

async function getInstallId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(INSTALL_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Bir funnel olayını kaydet. Fail-safe: hiçbir koşulda throw etmez,
 * uygulama akışını bloklamaz (await edilmesi ZORUNLU değildir).
 *
 * @param event  Kanonik olay adı (standard §7).
 * @param extra  İsteğe bağlı, kişisel olmayan bağlam (örn { plan: 'yearly' }).
 *               Gizlilik (§11): isim/e-posta/metin/konum GÖNDERİLMEZ.
 */
export async function trackFunnel(
  event: FunnelEvent | string,
  extra?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    if (!isFirebaseConfigured || !firebaseDb) return;

    const uid = currentUid();
    if (!uid) return; // anonim/misafir → kaydedecek hesap yok

    const sessionKey = `${uid}:${event}`;
    if (_sentThisSession.has(sessionKey)) return;
    _sentThisSession.add(sessionKey);

    const installId = await getInstallId();
    if (!installId) return; // presence henüz kurulum id'si yazmamış

    const now = Date.now();
    const ref = doc(firebaseDb, 'users', uid, 'devices', installId);

    // Cihaz dokümanına merge — milestone alt-nesnesi altında.
    // NOT: merge nested alanı üzerine yazar, bu yüzden `at` "son görülme"dir.
    // Funnel için önemli olan milestone'a ULAŞILMIŞ OLMASI (alanın varlığı);
    // sunucu tekil-kullanıcı funnel'ını bu alanların varlığından çıkarır.
    await setDoc(
      ref,
      {
        funnel: {
          [event]: {
            at: now,
            ...(extra ?? {}),
          },
        },
        // Kaynak henüz kanıtlanamıyorsa sahte kesinlik yazma (§2).
        trafficClass: 'unattributed_production',
      },
      { merge: true },
    );
  } catch (e) {
    if (__DEV__) console.warn('[funnel] yazılamadı:', event, e);
  }
}
