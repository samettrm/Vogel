// ════════════════════════════════════════════════════════════════
// ADMIN — İSTEMCİ TARAFI KAPI (yalnızca görsel)
//
// ⚠️ Bu dosya GÜVENLİK SAĞLAMAZ. Tek işi Ayarlar'da "Yönetim" satırını
// gizlemek ve /yonetim ekranını erken kapatmaktır. Uygulama paketi
// açılabilir, bu liste okunabilir.
//
// Gerçek kapı sunucudadır: functions/src/admin/config.ts +
// getAdminStats içindeki assertAdmin(). Buradaki listeyi biri kandırsa
// bile callable 'permission-denied' döner, veri gelmez.
//
// İki listeyi BİRLİKTE güncelle — yoksa menü görünür ama ekran boş
// hata verir (ya da tersi).
// ════════════════════════════════════════════════════════════════

/**
 * Firebase UID allowlist — sunucudaki liste ile birebir aynı olmalı
 * (functions/src/admin/config.ts).
 *
 * CJOX6o9I1LhV65A8mP86WtmWyuO2 = sametterme0@gmail.com (Vogel'deki hesap).
 */
export const ADMIN_UIDS: readonly string[] = ['CJOX6o9I1LhV65A8mP86WtmWyuO2'];

/** E-posta allowlist — UID kapısı kurulduğu için BOŞ. */
export const ADMIN_EMAILS: readonly string[] = [];

/**
 * Kullanıcı yönetici mi? Sunucudaki kuralın aynısı: UID varsa o,
 * yoksa doğrulanmış e-posta.
 */
export function isAdminUser(
  user: { uid?: string | null; email?: string | null; emailVerified?: boolean } | null | undefined,
): boolean {
  if (!user?.uid) return false;
  if (ADMIN_UIDS.includes(user.uid)) return true;
  const email = user.email?.toLowerCase();
  return !!email && user.emailVerified === true && ADMIN_EMAILS.includes(email);
}
