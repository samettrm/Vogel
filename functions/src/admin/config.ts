// ════════════════════════════════════════════════════════════════
// ADMIN ALLOWLIST — GERÇEK KAPI BURASI
//
// İstemcideki kontrol (src/config/admin.ts) yalnızca menüyü gizler;
// veriyi koruyan tek şey bu dosyadaki liste + getAdminStats içindeki
// assertAdmin() kontrolüdür. Adresi bilen biri /yonetim yazsa bile
// callable 'permission-denied' döner.
//
// UID kapısı e-posta kapısından DAHA GÜVENLİDİR: e-posta değişebilir,
// UID değişmez. Samet'in UID'sini öğrenince ADMIN_UIDS'e ekle ve
// ADMIN_EMAILS'i boşalt.
//
// UID nasıl bulunur: uygulamada giriş yaptıktan sonra /yonetim ekranı
// kimliğini en altta gösterir; ya da Firebase Console → Authentication
// → Users → ilgili satırın "User UID" kolonu.
// ════════════════════════════════════════════════════════════════

/**
 * Firebase UID allowlist — kullanılan yöntem bu.
 *
 * CJOX6o9I1LhV65A8mP86WtmWyuO2 = sametterme0@gmail.com (Google ile giriş,
 * doğrulanmış). Samet'in açık talimatı (21 Ağu 2026): panel YALNIZCA bu
 * hesaba açık olsun, başka hiçbir hesap o kısmı görmesin.
 *
 * Not: eski kapı trsamet71@gmail.com idi, kaldırıldı.
 */
export const ADMIN_UIDS: readonly string[] = ['CJOX6o9I1LhV65A8mP86WtmWyuO2'];

/**
 * E-posta allowlist — UID kapısı kurulduğu için BOŞ.
 * Boş bırakmak bilinçli: tek kapı = tek risk yüzeyi. UID değişmez,
 * e-posta değişebilir. Buraya adres eklemek kapıyı zayıflatır.
 */
export const ADMIN_EMAILS: readonly string[] = [];
