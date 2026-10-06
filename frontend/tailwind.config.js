/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT:'#2563EB', light:'#38BDF8', dark:'#1D4ED8' },
        teal:     { DEFAULT:'#14B8A6', light:'#2DD4BF' },
        aurora: {
          cyan: '#22D3EE',
          blue: '#2563EB',
          violet: '#8B5CF6',
          ink: '#020617',
        },
        risk: {
          low:      '#22c55e',
          medium:   '#f59e0b',
          high:     '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        glow: '0 24px 70px rgba(34, 211, 238, 0.18)',
      },
    },
  },
  plugins: [],
}
