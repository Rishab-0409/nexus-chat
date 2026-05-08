/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexus: {
          50:  '#f0f4ff',
          100: '#dde8ff',
          200: '#c0cfff',
          300: '#94adff',
          400: '#6080ff',
          500: '#3d5eff',
          600: '#2540f5',
          700: '#1d31e1',
          800: '#1c2cb6',
          900: '#1e2b8f',
          950: '#141a5a',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'sos-flash': 'sosFlash 0.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        bounceDot: { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        pulseRing: { '0%': { transform: 'scale(0.9)', opacity: 1 }, '100%': { transform: 'scale(1.4)', opacity: 0 } },
        sosFlash: { '0%,100%': { background: '#ef4444' }, '50%': { background: '#dc2626' } },
      }
    }
  },
  plugins: []
}
