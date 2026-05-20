// Vogel 'Candy Squircles' Teması - Tam Optimize Edilmiş
import { colors } from './colors';
import { spacing } from './spacing';

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  full: 999, // 🔥 HATA ÇÖZÜCÜ: Orijinal kodunun 'full' değerini bulabilmesi için bu satırı ekliyoruz.
} as const;

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  candy: {
    // 🔥 Görseldeki hacim hissini veren derin ve renkli gölge (GÜNCELLENDİ)
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, // Renkli gölgenin yoğunluğu artırıldı
    shadowRadius: 20,
    elevation: 8,
  },
  candyCard: {
    // 🔥 Görseldeki kartların altındaki geniş ve yumuşak gölge
    shadowColor: colors.accent, // Renkli aksan gölgesi (görselle uyumlu)
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 10,
  }
} as const;

export const theme = {
  colors,
  radius,
  spacing,
  shadows,
} as const;

export default theme;