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
        navy:      { DEFAULT: '#1b3c5a', dark: '#112535', deep: '#0d1c27' },
        red:       { DEFAULT: '#ef0e30', dark: '#c50a26' },
        teal:      { DEFAULT: '#68a2b9', light: '#a8cdd9' },
        gold:      '#c9a84c',
        'off-white': '#faf9f7',
        muted:     '#7a8a96',
      },
      fontFamily: {
        display:   ['"Playfair Display"', 'Georgia', 'serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        body:      ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
