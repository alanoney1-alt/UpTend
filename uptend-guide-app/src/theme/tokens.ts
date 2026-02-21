/**
 * UpTend Design Tokens — React Native (Expo)
 * Auto-generated from DESIGN-SYSTEM.md v1.0
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

// ─── Colors ──────────────────────────────────────────────

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
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Typography ──────────────────────────────────────────

const fontFamily = Platform.select({
  ios: { regular: 'System', medium: 'System', semibold: 'System', bold: 'System' },
  android: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' },
  default: { regular: 'Inter', medium: 'Inter', semibold: 'Inter', bold: 'Inter' },
})!;

type TypeToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'>;

export const typography: Record<string, TypeToken> = {
  displayXl: { fontSize: 40, lineHeight: 48, fontWeight: '700', letterSpacing: -0.8, fontFamily: fontFamily.bold },
  displayLg: { fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: -0.64, fontFamily: fontFamily.bold },
  headingXl: { fontSize: 28, lineHeight: 36, fontWeight: '600', letterSpacing: -0.28, fontFamily: fontFamily.semibold },
  headingLg: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: -0.24, fontFamily: fontFamily.semibold },
  headingMd: { fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: 0, fontFamily: fontFamily.semibold },
  headingSm: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: 0, fontFamily: fontFamily.semibold },
  bodyLg: { fontSize: 18, lineHeight: 28, fontWeight: '400', letterSpacing: 0, fontFamily: fontFamily.regular },
  bodyMd: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0, fontFamily: fontFamily.regular },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.14, fontFamily: fontFamily.regular },
  bodyXs: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.24, fontFamily: fontFamily.regular },
  labelLg: { fontSize: 16, lineHeight: 24, fontWeight: '500', letterSpacing: 0.16, fontFamily: fontFamily.medium },
  labelMd: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.14, fontFamily: fontFamily.medium },
  labelSm: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.24, fontFamily: fontFamily.medium },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '400', letterSpacing: 0.33, fontFamily: fontFamily.regular },
};

// ─── Spacing (8px base) ──────────────────────────────────

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

// ─── Border Radius ───────────────────────────────────────

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows (iOS & Android) ─────────────────────────────

type ShadowToken = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

export const shadows: Record<string, ShadowToken> = {
  xs: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
};

// ─── Animation ───────────────────────────────────────────

export const animation = {
  duration: {
    fast: 100,
    normal: 150,
    slow: 300,
  },
  easing: {
    // Use with Animated or Reanimated
    default: [0.4, 0, 0.2, 1] as const,
    enter: [0, 0, 0.2, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
} as const;

// ─── Semantic Theme (light/dark) ─────────────────────────

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySubtle: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;
  georgeBubble: string;
  georgeAccent: string;
};

export const lightTheme: ThemeColors = {
  background: colors.gray[50],
  surface: colors.white,
  surfaceElevated: colors.white,
  border: colors.gray[200],
  borderSubtle: colors.gray[100],
  textPrimary: colors.gray[800],
  textSecondary: colors.gray[500],
  textTertiary: colors.gray[400],
  textInverse: colors.white,
  primary: colors.primary[500],
  primaryHover: colors.primary[600],
  primaryActive: colors.primary[700],
  primarySubtle: colors.primary[50],
  success: colors.semantic.success,
  successBg: colors.semantic.successBg,
  warning: colors.semantic.warning,
  warningBg: colors.semantic.warningBg,
  error: colors.semantic.error,
  errorBg: colors.semantic.errorBg,
  info: colors.semantic.info,
  infoBg: colors.semantic.infoBg,
  georgeBubble: colors.george.bubble,
  georgeAccent: colors.george.accent,
};

export const darkTheme: ThemeColors = {
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
  success: colors.dark.success,
  successBg: '#052E16',
  warning: colors.dark.warning,
  warningBg: '#422006',
  error: colors.dark.error,
  errorBg: '#450A0A',
  info: colors.dark.info,
  infoBg: '#172554',
  georgeBubble: colors.george.darkBubble,
  georgeAccent: colors.george.accent,
};
