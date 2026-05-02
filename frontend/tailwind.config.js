/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        dark: {
          900: '#0a0f1e',
          800: '#0d1424',
          700: '#111827',
          600: '#1a2236',
          500: '#232f45',
          400: '#2d3d57',
          300: '#3d5068',
        }
      }
    }
  },
  plugins: [],
}
