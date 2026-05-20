// ════════════════════════════════════════════════════════════════
// SPACING & RADIUS
// 4px taban grid (4, 8, 12, 16, 20, 24, 32, 48, 64).
// Varsayılan radius 12px ("md").
// ════════════════════════════════════════════════════════════════

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;
export type SpacingKey = keyof typeof spacing;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,     // varsayılan kart/buton radius'ı
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,  // tam yuvarlak (chip, avatar, dairesel buton)
} as const;
export type RadiusKey = keyof typeof radius;

// PathNode'daki 3D buton tekniği için sabit (legacy compat)
export const buttonShadowOffset = 4;
