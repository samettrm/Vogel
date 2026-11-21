-- ═══════════════════════════════════════════════════════════════════════════
-- OWNER CONTROL CENTER + PRODUCT ANALYTICS — Vogel
--
-- Kaynak: ~/.claude/standards/owner-analytics-core (Kalorimetre'den damıtıldı)
-- ⚠️ ÇEVİRİ NOTU: çekirdek PostgreSQL için yazılmış (jsonb, now(), bigserial,
--    RLS, security definer). Vogel Cloudflare D1 = SQLite kullanıyor:
--      jsonb        → TEXT (JSON dizesi)
--      now()        → unixepoch()
--      bigserial    → INTEGER PRIMARY KEY AUTOINCREMENT
--      RLS/definer  → YOK. SQLite'ta satır düzeyi güvenlik yoktur; yetki
--                     kapısı Worker'da her uç noktada AÇIKÇA uygulanır.
--                     Bu bir gevşetme değil, kapının yer değiştirmesidir —
--                     istemciye asla bırakılmaz.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. OWNER KİMLİKLERİ ────────────────────────────────────────────────────
-- Owner yetkisinin TEK kaynağı. İstemci paketine GÖMÜLMEZ; owner değiştirmek
-- sürüm yayınlamayı gerektirmez.
CREATE TABLE IF NOT EXISTS owner_kimlikleri (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  saglayici  TEXT NOT NULL CHECK (saglayici IN ('apple','google','email')),
  anahtar    TEXT NOT NULL,          -- apple: sub · google/email: normalize e-posta
  aciklama   TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (saglayici, anahtar)
);

-- TEK OWNER. Wildcard yok, "zaten admin olan herkes" yok.
-- Apple sub henüz bilinmiyor; owner Apple ile giriş yaptığında EKLENİR,
-- tahminle doldurulmaz.
INSERT OR IGNORE INTO owner_kimlikleri (saglayici, anahtar, aciklama)
VALUES ('google', 'sametterme0@gmail.com', 'Tek owner — doğrulanmış Google kimliği');

-- ── 2. OWNER ERİŞİM KÜTÜĞÜ ─────────────────────────────────────────────────
-- Panelin kime, ne zaman açıldığı. Reddedilen denemeler de yazılır.
CREATE TABLE IF NOT EXISTS owner_erisim_kutugu (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL DEFAULT (unixepoch()),
  uid       TEXT,
  saglayici TEXT,
  sonuc     TEXT NOT NULL CHECK (sonuc IN ('izin','ret','hata')),
  sebep     TEXT,
  yol       TEXT
);
CREATE INDEX IF NOT EXISTS ix_owner_kutuk_ts ON owner_erisim_kutugu(ts DESC);

-- ── 3. KİŞİ / CİHAZ / KURULUM ──────────────────────────────────────────────
-- Aynı kişi iPhone + Android kullanırsa → 1 kişi, 2 cihaz.
-- 100 açılış 100 kullanıcı DEĞİLDİR.
CREATE TABLE IF NOT EXISTS kisiler (
  person_id       TEXT PRIMARY KEY,
  account_id      TEXT,               -- Firebase uid (varsa)
  ilk_gorulme     INTEGER NOT NULL DEFAULT (unixepoch()),
  son_gorulme     INTEGER NOT NULL DEFAULT (unixepoch()),
  trafik_sinifi   TEXT,               -- 4. bölüm
  sinif_guveni    TEXT,
  dislama_sebebi  TEXT,
  ulke            TEXT,
  platform        TEXT,
  paying_user     INTEGER NOT NULL DEFAULT 0,
  premium         INTEGER NOT NULL DEFAULT 0,
  entitlement_origin TEXT,
  aktive_oldu     INTEGER NOT NULL DEFAULT 0,
  aktive_ts       INTEGER
);
CREATE INDEX IF NOT EXISTS ix_kisi_sinif ON kisiler(trafik_sinifi);
CREATE INDEX IF NOT EXISTS ix_kisi_ulke  ON kisiler(ulke);

CREATE TABLE IF NOT EXISTS kurulumlar (
  installation_id TEXT PRIMARY KEY,
  person_id       TEXT NOT NULL,
  device_id       TEXT,
  platform        TEXT,
  os_surumu       TEXT,
  uygulama_surumu TEXT,
  cihaz_ailesi    TEXT,
  calisma_ortami  TEXT,   -- production · testflight · sandbox · development · simulator
  ilk_gorulme     INTEGER NOT NULL DEFAULT (unixepoch()),
  son_gorulme     INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS ix_kurulum_kisi ON kurulumlar(person_id);

-- ── 4. OLAYLAR ─────────────────────────────────────────────────────────────
-- ⚠️ TRAFİK SINIFI SUNUCUDA DAMGALANIR. İstemcinin gönderdiği sınıfa
--    güvenilmez; olay yazılırken kişinin sunucudaki sınıfı kopyalanır.
CREATE TABLE IF NOT EXISTS olaylar (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ts              INTEGER NOT NULL DEFAULT (unixepoch()),
  ad              TEXT NOT NULL,
  person_id       TEXT,
  installation_id TEXT,
  session_id      TEXT,
  trafik_sinifi   TEXT,          -- sunucuda damgalanır
  calisma_ortami  TEXT,
  platform        TEXT,
  ulke            TEXT,
  uygulama_surumu TEXT,
  ozellik         TEXT,
  idempotency_key TEXT,          -- kritik olaylarda zorunlu
  ek              TEXT           -- JSON dizesi; PII YOK
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_olay_idem
  ON olaylar(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_olay_ad_ts ON olaylar(ad, ts DESC);
CREATE INDEX IF NOT EXISTS ix_olay_kisi  ON olaylar(person_id);

-- İZİN VERİLEN OLAYLAR. Bilinmeyen olay REDDEDİLİR — şema sessizce genişlemez.
CREATE TABLE IF NOT EXISTS izinli_olaylar (ad TEXT PRIMARY KEY);
INSERT OR IGNORE INTO izinli_olaylar (ad) VALUES
  ('app.first_open'),
  ('session.started'),
  ('auth.signup_completed'),
  ('auth.login_completed'),
  ('onboarding.completed'),
  ('lesson.started'),
  ('lesson.completed'),
  ('value.activated'),
  ('feature.review.used'),
  ('feature.flashcards.used'),
  ('feature.exam.started'),
  ('feature.speaking.used'),
  ('feature.leaderboard.viewed'),
  ('feature.family.opened'),
  ('paywall.viewed'),
  ('paywall.plan_selected'),
  ('purchase.started'),
  ('purchase.cancelled'),
  ('purchase.failed'),
  ('purchase.completed'),
  ('purchase.restored'),
  ('review.eligible'),
  ('review.request_attempted'),
  ('app.crash');

-- ── 5. MAĞAZA İŞLEMLERİ — GELİRİN TEK GERÇEĞİ ──────────────────────────────
-- ⚠️ İstemcinin "satın alma başarılı" demesi BURAYA YAZILMAZ.
--    Yalnız RevenueCat/mağaza sunucu olayı yazar. Sandbox gelire karışmaz.
CREATE TABLE IF NOT EXISTS magaza_islemleri (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ts                 INTEGER NOT NULL DEFAULT (unixepoch()),
  saglayici          TEXT NOT NULL,     -- revenuecat · apple · google
  olay_kimligi       TEXT NOT NULL,     -- idempotency
  person_id          TEXT,
  urun_kimligi       TEXT,
  entitlement_origin TEXT,
  ortam              TEXT NOT NULL,     -- production · sandbox
  dogrulanmis        INTEGER NOT NULL DEFAULT 0,
  gelir_kurus        INTEGER NOT NULL DEFAULT 0,
  para_birimi        TEXT,
  ham                TEXT,
  UNIQUE (saglayici, olay_kimligi)      -- webhook idempotent
);
CREATE INDEX IF NOT EXISTS ix_islem_ts ON magaza_islemleri(ts DESC);

-- ── 6. DENETİM ─────────────────────────────────────────────────────────────
-- Kim, neyi, hangi gerekçeyle dışladı. Veri SİLİNMEZ; dışlanan görünür kalır.
CREATE TABLE IF NOT EXISTS denetim_kutugu (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL DEFAULT (unixepoch()),
  aktor   TEXT,
  eylem   TEXT NOT NULL,
  hedef   TEXT,
  sebep   TEXT,
  guven   TEXT
);
