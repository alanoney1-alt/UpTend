/**
 * UpTend Design Tokens — Web (Vite/React)
 * Auto-generated from DESIGN-SYSTEM.md v1.0
 */

export const colors = {
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  gray: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  semantic: {
    success: '#16A34A',
    successBg: '#F0FDF4',
    warning: '#CA8A04',
    warningBg: '#FEFCE8',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    info: '#2563EB',
    infoBg: '#EFF6FF',
  },
  dark: {
    bg: '#1C1917',
    card: '#292524',
    border: '#44403C',
    text: '#FAFAF9',
    textSecondary: '#A8A29E',
    primary: '#FB923C',
    primaryHover: '#F97316',
    success: '#4ADE80',
    warning: '#FACC15',
    error: '#F87171',
    info: '#60A5FA',
  },
  george: {
    bubble: '#FFF7ED',
    accent: '#F97316',
    darkBubble: '#431407',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  },
  scale: {
    displayXl: { fontSize: '2.5rem', lineHeight: '3rem', fontWeight: 700, letterSpacing: '-0.02em' },
    displayLg: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    headingXl: { fontSize: '1.75rem', lineHeight: '2.25rem', fontWeight: 600, letterSpacing: '-0.01em' },
    headingLg: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600, letterSpacing: '-0.01em' },
    headingMd: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600, letterSpacing: '0' },
    headingSm: { fontSize: '1.125rem', lineHeight: '1.5rem', fontWeight: 600, letterSpacing: '0' },
    bodyLg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 400, letterSpacing: '0' },
    bodyMd: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400, letterSpacing: '0' },
    bodySm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400, letterSpacing: '0.01em' },
    bodyXs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400, letterSpacing: '0.02em' },
    labelLg: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500, letterSpacing: '0.01em' },
    labelMd: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500, letterSpacing: '0.01em' },
    labelSm: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 500, letterSpacing: '0.02em' },
    caption: { fontSize: '0.6875rem', lineHeight: '1rem', fontWeight: 400, letterSpacing: '0.03em' },
  },
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(28, 25, 23, 0.05)',
  sm: '0 2px 4px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
  md: '0 4px 12px rgba(28, 25, 23, 0.08), 0 2px 4px rgba(28, 25, 23, 0.04)',
  lg: '0 8px 24px rgba(28, 25, 23, 0.12), 0 4px 8px rgba(28, 25, 23, 0.04)',
  xl: '0 16px 48px rgba(28, 25, 23, 0.16), 0 8px 16px rgba(28, 25, 23, 0.04)',
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const animation = {
  duration: {
    fast: '100ms',
    normal: '150ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

/** Semantic color aliases for light/dark mode */
export const semanticAliases = {
  light: {
    background: colors.gray[50],
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: colors.gray[200],
    borderSubtle: colors.gray[100],
    textPrimary: colors.gray[800],
    textSecondary: colors.gray[500],
    textTertiary: colors.gray[400],
    textInverse: '#FFFFFF',
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryActive: colors.primary[700],
    primarySubtle: colors.primary[50],
  },
  dark: {
    background: colors.dark.bg,
    surface: colors.dark.card,
    surfaceElevated: colors.gray[700],
    border: colors.dark.border,
    borderSubtle: colors.gray[800],
    textPrimary: colors.dark.text,
    textSecondary: colors.dark.textSecondary,
    textTertiary: colors.gray[500],
    textInverse: colors.gray[900],
    primary: colors.dark.primary,
    primaryHover: colors.dark.primaryHover,
    primaryActive: colors.primary[500],
    primarySubtle: colors.george.darkBubble,
  },
} as const;

export type ColorToken = typeof colors;
export type TypographyScale = keyof typeof typography.scale;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
