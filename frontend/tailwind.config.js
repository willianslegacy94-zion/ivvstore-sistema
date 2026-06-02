/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rosa pastel suave — fundo do panfleto, cards, badges sutis
        'ivs-pink': {
          50:  '#FFF5F7',
          100: '#FFE8EE',
          200: '#FBCAD7',
          300: '#F5A3B8',
          400: '#EC7A97',
          500: '#DE5079',
          600: '#C4335D',
          700: '#9E2147',
        },
        // Verde oliva/militar fechado — botões de ação, WhatsApp, badges ativos
        'ivs-green': {
          50:  '#F1F5EE',
          100: '#D8E4D0',
          200: '#B2C9A1',
          300: '#89AC72',
          400: '#638F48',
          500: '#4A7033',
          600: '#3A5828',  // cor principal — botões e estados ativos
          700: '#2A4019',
          800: '#1B2B0F',
        },
        // Bronze/dourado escuro — títulos elegantes, marca, perfumaria
        'ivs-gold': {
          50:  '#FBF8F0',
          100: '#F5EDCF',
          200: '#E8D59A',
          300: '#D6B960',
          400: '#BF9B34',
          500: '#A07C1E',  // dourado médio
          600: '#7C5C12',  // bronze escuro principal — brand e headings
          700: '#5A4109',
          800: '#3A2904',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
