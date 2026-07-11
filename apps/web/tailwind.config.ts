import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:      { DEFAULT: '#1B2A4A', dark: '#112535', deep: '#0d1c27', nav: '#0D1B2A' },
        red:       { DEFAULT: '#C9302A', hot: '#ef0e30', dark: '#c50a26' },
        teal:      { DEFAULT: '#0ABFA3', legacy: '#68a2b9', light: '#a8cdd9', dark: '#0A9980' },
        gold:      { DEFAULT: '#C9A84C', dark: '#8B6A00' },
        blue:      '#60A5FA',
        violet:    '#A78BFA',
        paper:     { DEFAULT: '#F5F0E8', card: '#FFFFFF' },
        'off-white': '#faf9f7',
        muted:     '#7a8a96',
        // Semantic theme tokens — resolve via CSS vars for dual-theme support
        page:      'var(--bg-page)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary:  'var(--text-tertiary)',
      },
      fontFamily: {
        display:   ['"Playfair Display"', 'Georgia', 'serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        body:      ['Barlow', 'sans-serif'],
        serif:     ['Merriweather', 'Georgia', 'serif'],
        bebas:     ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      fontSize: {
        'ep-display': ['clamp(2.75rem, 9vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '0.02em' }],
        'ep-h1':      ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'ep-h2':      ['1.25rem', { lineHeight: '1.25' }],
        'ep-h3':      ['1rem', { lineHeight: '1.3', letterSpacing: '0.02em' }],
        'ep-body':    ['0.9375rem', { lineHeight: '1.6' }],
        'ep-body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        'ep-eyebrow': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
        'ep-label':   ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.18em' }],
      },
    },
  },
  plugins: [],
}

export default config
