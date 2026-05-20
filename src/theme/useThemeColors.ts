import { useUserStore } from '../store/useUserStore';
import { getPalette, type ThemePalette } from './colors';

// ════════════════════════════════════════════════════════════════
// useThemeColors() — Aktif tema paletini doner
//
// Kullanim:
//   const t = useThemeColors();
//   <View style={{ backgroundColor: t.bg }} />
//
// Store'daki themeMode degisince component yeniden render olur,
// dolayisi ile yeni renkler uygulanir. Component icinde StyleSheet
// kullanmak yerine inline style veya useMemo ile rebuild gerekir.
// ════════════════════════════════════════════════════════════════

export function useThemeColors(): ThemePalette {
  const mode = useUserStore((s) => s.themeMode);
  return getPalette(mode);
}

/**
 * Store'a abone olmadan mevcut palette'i alir (event handler vb. icin).
 * Re-render tetiklemez.
 */
export function getThemeColors(): ThemePalette {
  const mode = useUserStore.getState().themeMode;
  return getPalette(mode);
}
