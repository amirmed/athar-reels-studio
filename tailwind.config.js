import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          50: 'rgb(var(--color-surface-50) / <alpha-value>)',
          100: 'rgb(var(--color-surface-100) / <alpha-value>)',
          200: 'rgb(var(--color-surface-200) / <alpha-value>)',
          300: 'rgb(var(--color-surface-300) / <alpha-value>)',
          400: 'rgb(var(--color-surface-400) / <alpha-value>)',
          500: 'rgb(var(--color-surface-500) / <alpha-value>)',
          600: 'rgb(var(--color-surface-600) / <alpha-value>)',
          700: 'rgb(var(--color-surface-700) / <alpha-value>)',
          750: 'rgb(var(--color-surface-750) / <alpha-value>)',
          800: 'rgb(var(--color-surface-800) / <alpha-value>)',
          900: 'rgb(var(--color-surface-900) / <alpha-value>)',
          950: 'rgb(var(--color-surface-950) / <alpha-value>)',
        },
        accent: {
          50: '#f2f7f4',
          100: '#e1ede5',
          200: '#c5dcce',
          300: '#9ec2ac',
          400: '#72a384',
          500: '#538767',
          600: '#3f6c51',
          700: '#345642',
          800: '#2c4637',
          900: '#263b30',
        },
        gold: {
          50: '#fbf9f2',
          100: '#f6f1e2',
          200: '#ece1c4',
          300: '#ddc997',
          400: '#cbb06b',
          500: '#b89849',
          600: '#9f7e36',
          700: '#81632d',
          800: '#695028',
          900: '#574224',
        },
        onbrand: 'rgb(var(--color-on-brand) / <alpha-value>)',
      },
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '1rem' }],        // 10px
        'caption-xs': ['0.6875rem', { lineHeight: '1rem' }],   // 11px
        'caption-sm': ['0.75rem', { lineHeight: '1.125rem' }], // 12px
        'body-sm': ['0.8125rem', { lineHeight: '1.25rem' }],    // 13px
        'body-md': ['0.875rem', { lineHeight: '1.375rem' }],    // 14px
        'title-sm': ['1rem', { lineHeight: '1.5rem' }],         // 16px
        'title-md': ['1.125rem', { lineHeight: '1.625rem' }],   // 18px
        'heading-md': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        'heading-lg': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        'display-sm': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        'display-md': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
        'display-lg': ['3rem', { lineHeight: '1.15' }],         // 48px
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
        display: ['Cairo', 'sans-serif'],
      },
      spacing: {
        'tight': '0.75rem',        // 12px (p-3)
        'normal': '1rem',          // 16px (p-4)
        'comfortable': '1.25rem',  // 20px (p-5)
        'spacious': '1.5rem',      // 24px (p-6)
      },
      borderRadius: {
        'xs': '0.125rem',
        '2xl': '0.75rem',
        '3xl': '1rem',
        '4xl': '1.25rem',
      },
      ringWidth: {
        '1.5': '1.5px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.15)' },
          '100%': { boxShadow: '0 0 30px rgba(20, 184, 166, 0.3)' },
        },
      },
    },
  },
  plugins: [tailwindAnimate],
};
