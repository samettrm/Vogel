import { dark } from './colors';

// ════════════════════════════════════════════════════════════════
// GRADIENTS
// expo-linear-gradient ile kullanılacak renk dizileri.
// (Kurulu değilse: `npx expo install expo-linear-gradient`)
//
// Şu an doğrudan kullanılmıyor — sonraki aşamalarda LinearGradient
// bileşeni ile arka plan, buton, kart süslemelerinde kullanacağız.
// ════════════════════════════════════════════════════════════════

type Stops = readonly [string, string, ...string[]];

export const gradients = {
  primary: [dark.neonLight, dark.neon, dark.neonDark] as Stops,
  purple: [dark.purpleLight, dark.purple, dark.purpleDark] as Stops,
  cyan: [dark.cyan, dark.cyanDark] as Stops,
  gold: ['#FBBF24', dark.gold, dark.goldDark] as Stops,
  red: [dark.red, dark.redDark] as Stops,
  background: [dark.bg, '#0B1220'] as Stops,
  backgroundRadial: [dark.surface, dark.bg] as Stops,
  card: [dark.surfaceElevated, dark.surface] as Stops,
  glassHighlight: [
    'rgba(255, 255, 255, 0.08)',
    'rgba(255, 255, 255, 0.00)',
  ] as Stops,
} as const;

export type GradientKey = keyof typeof gradients;
