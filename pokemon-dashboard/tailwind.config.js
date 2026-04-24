/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        navy: {
          950: '#070714',
          900: '#0c0b1e',
          800: '#0f0e27',
        },
      },
      boxShadow: {
        'glow-violet': '0 0 24px rgba(124, 58, 237, 0.25)',
        'glow-emerald': '0 0 24px rgba(52, 211, 153, 0.2)',
      },
    },
  },
  plugins: [],
}
