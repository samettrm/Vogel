import type { CEFRLevel } from '../types';
import type { ThemePalette } from './colors';

// ════════════════════════════════════════════════════════════════
// SEVİYE RENKLERİ — Her CEFR seviyesi kendi rengiyle ayırt edilir.
//
// Renk şeması (başlangıçtan ileriye, soğuktan-sıcağa):
//   A1 → 🟢 Neon yeşil  — başlangıç, doğal
//   A2 → 🔵 Cyan       — bir adım ileri
//   B1 → 🟣 Mor         — orta seviye
//   B2 → 🟡 Altın       — yükselmiş
//   C1 → 🔴 Kırmızı     — ileri, alev
//
// Kullanım:
//   const c = useThemeColors();
//   const { main, bg, light, glow } = getLevelColor('B1', c);
//   <View style={{ borderColor: main, backgroundColor: bg }} />
// ════════════════════════════════════════════════════════════════

export interface LevelColorSet {
  main: string;   // Ana renk (border, icon, accent)
  bg: string;     // Soft background (örnek: c.purpleBg)
  light: string;  // Açık ton (text vurgu)
  glow: string;   // Shadow/glow için
}

/**
 * Verilen CEFR seviyesi için renk setini döndürür.
 * Tema (dark/light) palette üzerinden çalışır.
 */
export function getLevelColor(level: CEFRLevel, c: ThemePalette): LevelColorSet {
  switch (level) {
    case 'A1':
      return {
        main: c.neon,
        bg: c.neonBg,
        light: c.neonLight,
        glow: c.neonGlow,
      };
    case 'A2':
      return {
        main: c.cyan,
        bg: c.cyanBg,
        light: c.cyan, // cyan'ın "light" varyantı yok, ana renkle aynı kullan
        glow: c.cyanGlow,
      };
    case 'B1':
      return {
        main: c.purple,
        bg: c.purpleBg,
        light: c.purpleLight,
        glow: c.purpleGlow,
      };
    case 'B2':
      return {
        main: c.gold,
        bg: c.goldBg,
        light: c.gold,
        glow: c.goldGlow,
      };
    case 'C1':
      return {
        main: c.red,
        bg: c.redBg,
        light: c.red,
        glow: c.redGlow,
      };
    default:
      return {
        main: c.neon,
        bg: c.neonBg,
        light: c.neonLight,
        glow: c.neonGlow,
      };
  }
}
