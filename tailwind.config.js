/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ---------------------------------------------------------------
           Paleta del rediseño · "Cada comunidad, un nodo"
           Lavanda terroso + sol cálido + papel. Cálido y de barrio.
        --------------------------------------------------------------- */
        lav: { DEFAULT: '#5E52C4', deep: '#3B2FA6', soft: '#EBE9F8' },
        sun: { DEFAULT: '#E8A33D', soft: '#F9E9CF' },
        clay: '#C56A46',
        paper: '#F8F6F1',
        cloud: '#FFFFFF',
        sand: '#EFEADE',
        cream: '#F3EFE6',
        ink: { DEFAULT: '#292620', soft: '#6B655B', faint: '#948D7E' },
        line: '#E5DDCF',
        ok: { DEFAULT: '#2E8B5E', soft: '#DCEFE4' },
        warn: '#D98A2B',
        crit: { DEFAULT: '#C0453B', soft: '#F6E0DD' },

        /* ---------------------------------------------------------------
           Alias de compatibilidad — se migran a los tokens de arriba
           componente por componente.
        --------------------------------------------------------------- */
        'nodo-navy': '#3B2FA6',
        'nodo-navy-2': '#2F2585',
        'nodo-navy-3': '#4C40B0',
        'nodo-bg': '#F8F6F1',
        'nodo-surface': '#EFEADE',
        'nodo-border': '#E5DDCF',
        'nodo-green': '#2E8B5E',
        'nodo-green-dark': '#237049',
        'nodo-red': '#C0453B',
        'nodo-amber': '#E8A33D',
        'nodo-cyan': '#6A5FB8',
        'nodo-teal': '#6A5FB8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(41, 38, 32, 0.05), 0 10px 28px rgba(41, 38, 32, 0.07)',
        lift: '0 10px 24px rgba(41, 38, 32, 0.1), 0 32px 60px rgba(41, 38, 32, 0.13)',
        glow: '0 0 0 3px rgba(106, 95, 184, 0.16)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
};
