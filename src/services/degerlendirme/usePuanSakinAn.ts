import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { sakinAndaPuanIste } from './magazaPuani';

/** Sekme odağa geldikten sonra beklenen süre: geçiş canlandırması bitsin. */
const SAKIN_AN_GECIKMESI_MS = 1500;

/**
 * Ana sekme ekranı odaktayken bekleyen puan isteği 1,5 sn sonra yapılır (sakin an).
 * Ekrandan çıkılırsa zamanlayıcı iptal edilir: geçiş sırasında pencere açılmaz.
 */
export function usePuanSakinAn(): void {
  useFocusEffect(
    useCallback(() => {
      const zamanlayici = setTimeout(sakinAndaPuanIste, SAKIN_AN_GECIKMESI_MS);
      return () => clearTimeout(zamanlayici);
    }, []),
  );
}
