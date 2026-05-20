import type { ViewStyle } from 'react-native';
import { dark } from './colors';

// ════════════════════════════════════════════════════════════════
// SHADOWS & GLOW
// Her gölge bir ViewStyle. iOS shadow* + Android elevation aynı stilde.
// Glow için shadowColor neon renge boyanıyor (iOS'ta renkli görünür,
// Android'de elevation ile yaklaşır).
// ════════════════════════════════════════════════════════════════

export const shadows = {
  // ── Düz Gölgeler ──
  none: {} as ViewStyle,

  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  topmost: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 16,
  } as ViewStyle,

  // ── Renkli Glow ──
  glowPrimary: {
    shadowColor: dark.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,

  glowPrimarySoft: {
    shadowColor: dark.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  } as ViewStyle,

  glowPurple: {
    shadowColor: dark.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,

  glowGold: {
    shadowColor: dark.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,

  glowRed: {
    shadowColor: dark.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,

  glowCyan: {
    shadowColor: dark.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
};

export type ShadowKey = keyof typeof shadows;
