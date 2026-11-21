/**
 * JS ÇÖKME ÖLÇÜMÜ — owner paneli §9 "crash & API sağlığı" (Emir Defteri A4 · A11, 21-11-2026 · Canlı Döviz lib/cokme-olcumu.ts uyarlaması).
 *
 * İki kaynak:
 *   · `sinir`   : hata sınırı (AppErrorBoundary) bir render hatası yakaladı; uygulama yedek ekranla açık
 *                 kaldığı için olay kuyruğu normal yoldan gönderilir.
 *   · `olumcul` : ölümcül JS hatası uygulamayı kapattı. O an ağ isteği bitmez; hata türü cihaza yazılır ve
 *                 bir sonraki açılışta gönderilir.
 * Gönderilen tek bilgi hatanın TÜRÜDÜR (ör. TypeError). Mesaj, yığın ve kullanıcı verisi gönderilmez.
 * Yerel (native) çökme bu yolla ölçülmez; panel bunu açıkça yazar.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { olay } from './olay';

const ISARET = 'cokme.son_olumcul';
let basladi = false;

function tur(hata: unknown): string {
  const ad = hata instanceof Error ? hata.name : typeof hata;
  return (ad || 'Error').replace(/[^A-Za-z0-9_]/g, '').slice(0, 40) || 'Error';
}

/** Hata sınırının yakaladığı render hatası. */
export function sinirHatasi(hata: unknown): void {
  olay('app.crash', { kaynak: 'sinir', tur: tur(hata) });
}

/** Kök düzenden BİR KEZ çağrılır. */
export function cokmeOlcumunuBaslat(): void {
  if (basladi) return;
  basladi = true;

  AsyncStorage.getItem(ISARET)
    .then(async (onceki) => {
      if (!onceki) return;
      olay('app.crash', { kaynak: 'olumcul', tur: onceki });
      await AsyncStorage.removeItem(ISARET);
    })
    .catch((e) => console.warn('[cokme] önceki çökme işareti okunamadı:', String(e).slice(0, 120)));

  const EU = (globalThis as { ErrorUtils?: { getGlobalHandler?: () => unknown; setGlobalHandler?: (f: unknown) => void } }).ErrorUtils;
  if (!EU?.getGlobalHandler || !EU.setGlobalHandler) return;
  const oncekiIsleyici = EU.getGlobalHandler() as ((h: unknown, o?: boolean) => void) | undefined;
  EU.setGlobalHandler((hata: unknown, olumcul?: boolean) => {
    if (olumcul) {
      AsyncStorage.setItem(ISARET, tur(hata)).catch((e) =>
        console.warn('[cokme] işaret yazılamadı:', String(e).slice(0, 120)),
      );
    }
    oncekiIsleyici?.(hata, olumcul);
  });
}
