// ════════════════════════════════════════════════════════════════
// SENTRY YAPILANDIRMASI
// ════════════════════════════════════════════════════════════════
//
// DSN'yi almak için:
//   1. https://sentry.io → "Create Project" → React Native
//   2. Proje adı: vogel  (ya da istediğin bir şey)
//   3. Settings → Client Keys (DSN) → DSN değerini kopyala
//   4. .env dosyasına şunu ekle:
//      EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
//
// app.json'daki "organization" ve "project" alanları EAS build sırasında
// source map upload için gereklidir:
//   organization → Sentry URL'indeki org slug (sentry.io/organizations/BURASI/)
//   project      → Oluşturduğun projenin slug'ı (genellikle proje adıyla aynı)
//
// Bu bilgileri doldurmadan uygulama çalışır; sadece
// source map'ler yüklenmez ve crash stack trace'leri obfuscated gelir.
// ════════════════════════════════════════════════════════════════

export const SENTRY_DSN: string = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
