/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#080C0A',
        grass: { dark: '#142618', DEFAULT: '#4CAF50', light: '#81C784' },
        chalk: { DEFAULT: '#EDEAE5', muted: '#6B7B71' },
        gold: { DEFAULT: '#D4A843', light: '#E8C96A', dark: '#B8922E' },
        red: { card: '#E53935', dark: '#B71C1C' },
        surface: { DEFAULT: '#151C18', hover: '#1A231E' },
        border: { DEFAULT: '#1E2A22', light: '#25302A' },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'count-up': 'countUp 2s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'spin-wheel': 'spin 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
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
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 168, 67, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 168, 67, 0)' },
        },
      },
    },
  },
  plugins: [],
};
