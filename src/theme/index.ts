// ════════════════════════════════════════════════════════════════
// VOGEL TEMA SİSTEMİ
// Tek giriş noktası — tüm bileşenler `from '../theme'` üzerinden
// buraya erişir.
// ════════════════════════════════════════════════════════════════

// Renkler — eski palet (colors) + dark + light + getPalette
export { colors, dark, light, getPalette } from './colors';
export type {
  ColorName,
  DarkColorName,
  LightColorName,
  ThemePalette,
} from './colors';

// Aktif tema hook
export { useThemeColors, getThemeColors } from './useThemeColors';

// Spacing & Radius
export { spacing, radius, buttonShadowOffset } from './spacing';
export type { SpacingKey, RadiusKey } from './spacing';

// Tipografi
export { fonts, fontSize, textStyles } from './typography';
export type { FontWeight, TextStyleKey } from './typography';

// Gölge & Glow
export { shadows } from './shadows';
export type { ShadowKey } from './shadows';

// Gradient'lar
export { gradients } from './gradients';
export type { GradientKey } from './gradients';

// Seviye renkleri (A1/A2/B1/B2/C1)
export { getLevelColor } from './levels';
export type { LevelColorSet } from './levels';
