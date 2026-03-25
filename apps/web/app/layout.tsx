// cache-bust: 2026-03-25
import type { Metadata } from 'next'
import { Playfair_Display, Barlow_Condensed, Barlow } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '900'],
  style: ['normal', 'italic'],
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-condensed',
  weight: ['400', '500', '600', '700'],
})

const barlow = Barlow({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title:       'Evolved Pros — The Platform for High Performers',
  description: 'Community, academy, and accountability for professionals who operate at the highest level.',
  openGraph: {
    title:       'Evolved Pros',
    description: 'The platform for high performers.',
    url:         'https://platform.evolvedpros.com',
    siteName:    'Evolved Pros',
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Evolved Pros',
    description: 'The platform for high performers.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${barlowCondensed.variable} ${barlow.variable}`}
    >
      <body
        className="bg-navy-deep text-navy antialiased"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {children}
      </body>
    </html>
  )
}
