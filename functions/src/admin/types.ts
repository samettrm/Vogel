// ════════════════════════════════════════════════════════════════
// Admin panel — paylaşılan tipler
//
// ⚠️ Kopyası istemcide src/services/admin.ts içinde. İkisini birlikte güncelle.
//
// Tasarım ilkesi: HAM OPERASYONEL VERİ. Uygulama içi ilerleme (XP, seri,
// ders) bilinçli olarak YOKTUR — panel "kim, nereden, hangi cihazla,
// kaç kişi ödedi" sorusuna cevap verir.
// ════════════════════════════════════════════════════════════════

export interface AdminCountEntry {
  key: string;
  count: number;
}

/** Ülke satırı — kişi sayısı ana rakam, alt satırda kırılım. */
export interface AdminCountryEntry {
  code: string;
  people: number;
  devices: number;
  onlineNow: number;
  today: number;
}

export interface AdminLiveStats {
  /** Son 5 dakikada uygulamayı açan kişi. */
  onlineNow: number;
  lastHour: number;
  active24h: number;
  active7d: number;
  active30d: number;
}

export interface AdminReachStats {
  /** Uygulamayı en az bir kez açmış BENZERSİZ kişi (cihaz kaydı olan). */
  people: number;
  /** Kurulum sayısı — aynı kişi iki cihazda ise 2 sayılır. */
  installs: number;
  /** Firebase Auth'taki toplam kayıtlı hesap. */
  accounts: number;
  newAccounts7d: number;
  newAccounts30d: number;
  /** Sayfalama tavanına takıldıysa true. */
  capped: boolean;
}

export interface AdminPremiumStats {
  /** Uygulamanın gördüğü premium hesap sayısı (cihaz kaydından). */
  premiumPeople: number;
  /** Aile planı üyesi toplamı. */
  familyMembers: number;
  families: number;
  /** Ömür boyu / tek seferlik plan sayısı. */
  lifetime: number;
}

export interface AdminPurchaseStats {
  events: number;
  buyers: number;
  initialPurchases: number;
  renewals: number;
  churn: number;
  last30d: number;
  byCountry: AdminCountEntry[];
  byProduct: AdminCountEntry[];
  sandboxEvents: number;
  empty: boolean;
}

export interface AdminStats {
  generatedAt: number;
  live: AdminLiveStats;
  reach: AdminReachStats;
  premium: AdminPremiumStats;
  purchases: AdminPurchaseStats;
  /** Ülkeler — kişi sayısına göre çoktan aza. */
  countries: AdminCountryEntry[];
  /** "ios·phone" → sayı gibi cihaz türü kırılımı. */
  deviceTypes: AdminCountEntry[];
  /** "iPhone · iOS 26.6" → sayı. */
  models: AdminCountEntry[];
  /** Giriş yöntemi dağılımı. */
  providers: AdminCountEntry[];
  caller: { uid: string; email: string | null };
}
