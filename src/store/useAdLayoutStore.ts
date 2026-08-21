import { create } from 'zustand';

// ════════════════════════════════════════════════════════════════
// AD LAYOUT STORE — sabit banner'ın ölçülen yüksekliği
//
// Neden gerekli: PinnedAdBanner, <Tabs>'tan SONRA render edilen bir
// absolute overlay. Yani ekran içeriğinin üstüne biniyor ve sağ alttaki
// "yukarı çık" butonunun alt kısmını kapatıyordu.
//
// Yüksekliği sabit yazmak yanlış olur: ANCHORED_ADAPTIVE_BANNER cihaza
// göre değişir (telefonda ~50dp, geniş ekranda 90dp). Bu yüzden banner
// kendini onLayout ile ölçüp buraya yazar, floating butonlar da bu değeri
// okuyup kendilerini o kadar yukarı iter.
//
// Premium kullanıcıda AdBanner null döner → sarmalayıcı 0 yükseklik
// ölçer → değer 0 olur ve butonlar eski yerine döner. Ekstra koşul gerekmez.
//
// Persist EDİLMEZ: ölçüm her açılışta yeniden yapılır.
// ════════════════════════════════════════════════════════════════

interface AdLayoutState {
  /** Tab bar'ın üstündeki sabit banner'ın ölçülen yüksekliği (dp). Reklam yoksa 0. */
  pinnedAdHeight: number;
  setPinnedAdHeight: (h: number) => void;
}

export const useAdLayoutStore = create<AdLayoutState>((set) => ({
  pinnedAdHeight: 0,
  setPinnedAdHeight: (h) =>
    set((s) => {
      // Aynı değerde gereksiz re-render tetikleme (onLayout sık ateşlenebilir).
      const next = Math.max(0, Math.round(h));
      return next === s.pinnedAdHeight ? s : { pinnedAdHeight: next };
    }),
}));
