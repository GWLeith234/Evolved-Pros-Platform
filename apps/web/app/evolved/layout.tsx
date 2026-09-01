import { Montserrat } from 'next/font/google'

/**
 * Standalone charcoal/gold shell for the EVOLVED book preorder.
 *
 * Must not inherit the (public) navy/red footer. Montserrat matches the
 * existing cover reconstruction (design/sponsor-creatives/book-cover.html).
 */
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-evolved-book',
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
