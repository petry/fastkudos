import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: colors.sky,
        accent: colors.rose,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        kudo:
          '0 12px 32px -16px rgb(244 63 94 / 0.25), 0 4px 12px -8px rgb(14 165 233 / 0.20)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 220ms ease-out',
        pop: 'pop 220ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
