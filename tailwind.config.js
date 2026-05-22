/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        primaryDark: '#0F172A',
        accent: {
          DEFAULT: '#FACC15',
          soft: '#FEF08A',
          dark: '#CA8A04',
        },
        bg: '#EFF6FF',
        card: '#FFFFFF',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: [
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 4px 14px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        soft: '0 1px 3px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
