/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'nodo-navy': '#0F172A',
        'nodo-navy-2': '#1E293B',
        'nodo-navy-3': '#334155',
        'nodo-bg': '#F8FAFC',
        'nodo-surface': '#F1F5F9',
        'nodo-border': '#E2E8F0',
        'nodo-green': '#10B981',
        'nodo-green-dark': '#059669',
        'nodo-red': '#EF4444',
        'nodo-amber': '#F59E0B',
        'nodo-cyan': '#06B6D4',
        'nodo-teal': '#0D9488',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.06)',
        lift: '0 8px 24px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 3px rgba(6, 182, 212, 0.15)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [],
};
