/**
 * @module Design Tokens
 * @description Centralized design tokens for the UpTend component library.
 * Import these instead of hardcoding colors/sizes throughout the app.
 */

export const colors = {
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FCD34D',

  background: '#FFFFFF',
  backgroundDark: '#0F172A',
  surface: '#F8FAFC',
  surfaceDark: '#1E293B',

  text: '#1E293B',
  textDark: '#F8FAFC',
  textMuted: '#64748B',
  textMutedDark: '#94A3B8',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  border: '#E2E8F0',
  borderDark: '#334155',
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type ColorScheme = 'light' | 'dark';
