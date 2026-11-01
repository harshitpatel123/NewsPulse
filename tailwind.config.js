/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1F3A',
        gold: '#C79A2B',
        paper: '#FAF8F3',
        surface: '#FFFFFF',
        ink: '#111827',
        muted: '#5B6472',
        line: '#E5E1D8',
        breaking: '#B3261E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'serif'],
      },
    },
  },
  plugins: [],
}
