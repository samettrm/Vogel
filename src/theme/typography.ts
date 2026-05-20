// ════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// Nunito (mevcut yüklü font ailesi). Inter/Poppins geçişi için
// sadece bu dosyayı ve _layout.tsx'teki font yükleyiciyi değiştirmek
// yeterli — diğer hiçbir bileşene dokunmaya gerek yok.
// ════════════════════════════════════════════════════════════════

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;
export type FontWeight = keyof typeof fonts;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 40,
} as const;

// Hazır kullanım için text style preset'leri.
export const textStyles = {
  display: {
    fontFamily: 'Nunito_900Black',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  bodyBold: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  button: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    letterSpacing: 0.8,
  },
  label: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
