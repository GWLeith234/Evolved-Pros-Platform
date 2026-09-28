import localFont from 'next/font/local'

/**
 * Standalone charcoal/gold shell for the EVOLVED book preorder.
 *
 * Must not inherit the (public) navy/red footer. Montserrat matches the
 * Gold V3 Kindle cover (design/sponsor-creatives/book-cover.png).
 */
const montserrat = localFont({
  src: [
    {
      path: '../../fonts/montserrat/montserrat-latin-800-900-normal.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../fonts/montserrat/montserrat-latin-800-900-normal.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-evolved-book',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

export default function EvolvedBookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={montserrat.variable}
      style={{
        minHeight: '100vh',
        background: '#28282B',
        color: '#F3EEE4',
        fontFamily: 'Barlow, sans-serif',
      }}
    >
      {children}
    </div>
  )
}
