// ════════════════════════════════════════════════════════════════
// RENK PALETİ
//
// İKİ KATMANLI YAPI:
// 1) `colors` — ESKİ PALET (mevcut Duolingo benzeri ekranlar için).
//    Hiçbir mevcut ekran bozulmasın diye olduğu gibi korunuyor.
//    Önceki Claude'un eklediği takma adlar (red, accent, warning,
//    error, disabled, incorrectBg, redDark) burada korunuyor.
// 2) `dark`  — YENİ NEON DARK PALET (yeni UI bileşenleri ve
//    sonraki aşamalarda yeniden kurulacak ekranlar için).
// ════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// ESKİ PALET — Mevcut ekranlar (legacy + alias'lar)
// ─────────────────────────────────────────────────────────────────
export const colors = {
  // Ana renkler
  primary: '#58CC02', primaryDark: '#46A302', primaryLight: '#89E219',
  blue: '#1CB0F6', blueDark: '#1899D6',
  purple: '#CE82FF', purpleDark: '#A560E8',

  // Kalp / Kırmızı — birden çok ad altında (kod tabanı farklı yerlerde
  // heart/red/error/wrong kullanıyor; hepsi aynı kırmızıya işaret ediyor)
  heart: '#FF4B4B', heartDark: '#D33131',
  red: '#FF4B4B', redDark: '#D33131',
  error: '#FF4B4B',

  // Altın / Vurgu — accent ve warning de gold tonlarına bağlı
  gold: '#FFC800', goldDark: '#E0A800',
  accent: '#FFC800',     // gold ile eş
  warning: '#E0A800',    // goldDark ile eş

  // Streak
  streak: '#FF9600', streakDark: '#E08600',

  // Yüzeyler
  white: '#FFFFFF', background: '#FFFFFF', card: '#FFFFFF',
  borderLight: '#E5E5E5', borderMedium: '#D0D0D0',
  disabled: '#E5E5E5',   // borderLight ile eş (pasif yüzey)

  // Metin
  textPrimary: '#3C3C3C', textSecondary: '#777777',
  textMuted: '#AFAFAF', textOnPrimary: '#FFFFFF',

  // Kilit durumu
  locked: '#E5E5E5', lockedDark: '#BFBFBF', lockedIcon: '#AFAFAF',

  // Doğru/yanlış arka planları
  wrong: '#FF4B4B', wrongBg: '#FFDFE0',
  incorrectBg: '#FFDFE0', // wrongBg ile eş
  correct: '#58CC02', correctBg: '#D7FFB8',
  success: '#10B981',     // ✓ tonlu başarı yeşili (DailyQuestPanel)

  // Nötr gri tonları (DailyQuestPanel ve diğer kartlarda)
  neutral100: '#F5F5F5',
  neutral200: '#E5E5E5',  // borderLight ile eş
  neutral300: '#D0D0D0',  // borderMedium ile eş
  neutral400: '#AFAFAF',  // textMuted ile eş
} as const;
export type ColorName = keyof typeof colors;

// ─────────────────────────────────────────────────────────────────
// YENİ NEON DARK PALET — Premium tasarım sistemi
// Görsel referans: Vogel tasarım dokümanı (dark + neon green + mor)
// ─────────────────────────────────────────────────────────────────
export const dark = {
  // ── Zemin & Yüzeyler ──
  bg: '#0F172A',
  surface: '#1E2938',
  surfaceElevated: '#293548',
  surfaceHigh: '#334155',
  overlay: 'rgba(15, 23, 42, 0.7)',

  // ── Cam Efekti (Glassmorphism) ──
  glassBg: 'rgba(30, 41, 56, 0.55)',
  glassBgStrong: 'rgba(30, 41, 56, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.16)',
  glassHighlight: 'rgba(255, 255, 255, 0.05)',

  // ── Ana Renk: Neon Yeşil ──
  neon: '#00FF88',
  neonDark: '#00CC6A',
  neonLight: '#33FFA3',
  neonGlow: 'rgba(0, 255, 136, 0.35)',
  neonGlowSoft: 'rgba(0, 255, 136, 0.18)',
  neonBg: 'rgba(0, 255, 136, 0.12)',

  // ── Yardımcı Renk: Mor ──
  purple: '#7C3AED',
  purpleDark: '#6D28D9',
  purpleLight: '#A78BFA',
  purpleGlow: 'rgba(124, 58, 237, 0.35)',
  purpleBg: 'rgba(124, 58, 237, 0.14)',

  // ── Aksan: Cyan/Mavi ──
  cyan: '#22D3EE',
  cyanDark: '#0891B2',
  cyanGlow: 'rgba(34, 211, 238, 0.30)',
  cyanBg: 'rgba(34, 211, 238, 0.12)',

  // ── Streak / XP / Altın ──
  gold: '#F59E0B',
  goldDark: '#D97706',
  goldGlow: 'rgba(245, 158, 11, 0.30)',
  goldBg: 'rgba(245, 158, 11, 0.12)',

  // ── Kalp / Yanlış / Tehlike ──
  red: '#EF4444',
  redDark: '#DC2626',
  redGlow: 'rgba(239, 68, 68, 0.30)',
  redBg: 'rgba(239, 68, 68, 0.14)',

  // ── Metin Hiyerarşisi ──
  textHigh: '#F1F5F9',
  textMed: '#CBD5E1',
  textLow: '#94A3B8',
  textMuted: '#64748B',
  textOnNeon: '#0F172A',
  textOnPurple: '#FFFFFF',

  // ── Kenarlık / Çizgi ──
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  divider: 'rgba(255, 255, 255, 0.06)',

  // ── Durum ──
  correct: '#00FF88',
  correctBg: 'rgba(0, 255, 136, 0.15)',
  wrong: '#EF4444',
  wrongBg: 'rgba(239, 68, 68, 0.15)',
  locked: '#1E2938',
  lockedBorder: 'rgba(255, 255, 255, 0.06)',
  lockedIcon: '#475569',

  // ── Saf ──
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type DarkColorName = keyof typeof dark;

// ─────────────────────────────────────────────────────────────────
// YENI LIGHT PALET — Vogel'in dark dengindeki light versiyon
// Anahtar isimler `dark` ile birebir esit (drop-in swap icin)
// ─────────────────────────────────────────────────────────────────
export const light = {
  // Zemin & Yuzeyler
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceHigh: '#E2E8F0',
  overlay: 'rgba(255, 255, 255, 0.7)',

  // Cam efekti (light versiyon)
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBgStrong: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(15, 23, 42, 0.08)',
  glassBorderStrong: 'rgba(15, 23, 42, 0.14)',
  glassHighlight: 'rgba(255, 255, 255, 0.9)',

  // Neon yesil (light icin biraz daha koyu, kontrast icin)
  neon: '#10B981',
  neonDark: '#059669',
  neonLight: '#34D399',
  neonGlow: 'rgba(16, 185, 129, 0.30)',
  neonGlowSoft: 'rgba(16, 185, 129, 0.15)',
  neonBg: 'rgba(16, 185, 129, 0.10)',

  // Mor
  purple: '#7C3AED',
  purpleDark: '#6D28D9',
  purpleLight: '#8B5CF6',
  purpleGlow: 'rgba(124, 58, 237, 0.25)',
  purpleBg: 'rgba(124, 58, 237, 0.10)',

  // Cyan
  cyan: '#0891B2',
  cyanDark: '#0E7490',
  cyanGlow: 'rgba(8, 145, 178, 0.25)',
  cyanBg: 'rgba(8, 145, 178, 0.10)',

  // Altin
  gold: '#D97706',
  goldDark: '#B45309',
  goldGlow: 'rgba(217, 119, 6, 0.25)',
  goldBg: 'rgba(217, 119, 6, 0.10)',

  // Kirmizi
  red: '#DC2626',
  redDark: '#B91C1C',
  redGlow: 'rgba(220, 38, 38, 0.25)',
  redBg: 'rgba(220, 38, 38, 0.10)',

  // Metin (light'ta tersine cevriliyor — koyu metinler)
  textHigh: '#0F172A',
  textMed: '#334155',
  textLow: '#64748B',
  textMuted: '#94A3B8',
  textOnNeon: '#FFFFFF',
  textOnPurple: '#FFFFFF',

  // Kenarlik
  border: 'rgba(15, 23, 42, 0.08)',
  borderStrong: 'rgba(15, 23, 42, 0.16)',
  divider: 'rgba(15, 23, 42, 0.06)',

  // Durum
  correct: '#10B981',
  correctBg: 'rgba(16, 185, 129, 0.12)',
  wrong: '#DC2626',
  wrongBg: 'rgba(220, 38, 38, 0.12)',
  locked: '#E2E8F0',
  lockedBorder: 'rgba(15, 23, 42, 0.10)',
  lockedIcon: '#94A3B8',

  // Saf
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type LightColorName = keyof typeof light;

// Tema palette tipi (dark + light icin ortak interface)
// Mapped type kullanılıyor — literal string yerine string kabul eder,
// böylece light paleti de ThemePalette'e atanabilir.
export type ThemePalette = { [K in keyof typeof dark]: string };

/**
 * Aktif palete erisim — store'daki themeMode'a gore secer.
 * Component'lerde `useThemeColors()` ile cagrilir (bkz. theme/useThemeColors.ts)
 */
export function getPalette(mode: 'dark' | 'light'): ThemePalette {
  return (mode === 'light' ? light : dark) as unknown as ThemePalette;
}
