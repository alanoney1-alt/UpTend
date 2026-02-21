import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './client/src/**/*.{ts,tsx}',
    './client/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — Orange/Amber
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
        // Neutral — Warm Stone/Gray
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
        // Semantic
        success: {
          DEFAULT: '#16A34A',
          bg: '#F0FDF4',
          dark: '#4ADE80',
          'dark-bg': '#052E16',
        },
        warning: {
          DEFAULT: '#CA8A04',
          bg: '#FEFCE8',
          dark: '#FACC15',
          'dark-bg': '#422006',
        },
        error: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
          dark: '#F87171',
          'dark-bg': '#450A0A',
        },
        info: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
          dark: '#60A5FA',
          'dark-bg': '#172554',
        },
        // Mr. George
        george: {
          bubble: '#FFF7ED',
          accent: '#F97316',
          'dark-bubble': '#431407',
        },
        // Dark mode surfaces
        dark: {
          bg: '#1C1917',
          card: '#292524',
          border: '#44403C',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['2.5rem', { lineHeight: '3rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-lg': ['2rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading-xl': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        'heading-lg': ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        'heading-md': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'body-md': ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'body-xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'label-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '500', letterSpacing: '0.01em' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500', letterSpacing: '0.01em' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0.02em' }],
        'caption': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.03em' }],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(28, 25, 23, 0.05)',
        'sm': '0 2px 4px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
        'DEFAULT': '0 2px 4px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
        'md': '0 4px 12px rgba(28, 25, 23, 0.08), 0 2px 4px rgba(28, 25, 23, 0.04)',
        'lg': '0 8px 24px rgba(28, 25, 23, 0.12), 0 4px 8px rgba(28, 25, 23, 0.04)',
        'xl': '0 16px 48px rgba(28, 25, 23, 0.16), 0 8px 16px rgba(28, 25, 23, 0.04)',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
