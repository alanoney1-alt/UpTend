import { Colors } from './colors';

export { Colors };

/** Unified theme object for easy access */
export const theme = {
  colors: Colors,
  fonts: { regular: 'System', medium: 'System', semiBold: 'System', bold: 'System' },
  get typography() { return Typography; },
  get spacing() { return Spacing; },
  get radius() { return Radius; },
  get shadows() { return Shadows; },
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  h4: { fontSize: 17, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  captionBold: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  small: { fontSize: 11, fontWeight: '500' as const, color: Colors.textLight },
  button: { fontSize: 16, fontWeight: '700' as const },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
