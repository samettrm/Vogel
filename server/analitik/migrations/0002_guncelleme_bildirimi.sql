-- 0002 · Güncelleme bildirimi (Emir Defteri A2 · BUILD AL 21-11-2026).
-- Yalnız EKLER; eski kod bu tabloları görmez.
--
-- guncelleme_cihaz : App Store / Google Play kurulumunun Expo jetonu + sürümü (istemci her açılışta yazar).
-- guncelleme_gonderim : sürüm başına TEK bildirim kaydı (aynı sürüm için tekrar gönderilmez).
-- guncelleme_durum : tetik ucu 5 dakikadan sık çalışmasın diye son çalışma zamanı.
CREATE TABLE IF NOT EXISTS guncelleme_cihaz (
  kurulum TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  token TEXT NOT NULL,
  surum TEXT,
  derleme TEXT,
  dil TEXT,
  guncellendi INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS guncelleme_gonderim (
  kurulum TEXT NOT NULL,
  anahtar TEXT NOT NULL,
  sonuc TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (kurulum, anahtar)
);
CREATE TABLE IF NOT EXISTS guncelleme_durum (
  ad TEXT PRIMARY KEY,
  deger INTEGER NOT NULL
);
