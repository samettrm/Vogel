-- 0003 · Owner paneli §9 tamamlama (Emir Defteri A4 · BUILD AL 21-11-2026). Yalnız EKLER.
--
-- api_saglik    : uç başına günlük 2xx/4xx/5xx sayacı ("crash & API sağlığı"). Worker bellekte toplar,
--                 en çok dakikada bir toplu UPSERT eder (istek başına yazmaz: D1 günlük yazma sınırı).
CREATE TABLE IF NOT EXISTS api_saglik (
  gun   TEXT NOT NULL,
  uc    TEXT NOT NULL,
  sinif TEXT NOT NULL CHECK (sinif IN ('2xx', '4xx', '5xx')),
  adet  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gun, uc, sinif)
);
