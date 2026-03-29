// cache-bust: 2026-03-25
import type { Metadata } from 'next'
import { Playfair_Display, Barlow_Condensed, Barlow } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { ThemeInit } from '@/components/ThemeInit'
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

const LOGO_CIRCLE_DARK = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_circle_dark.png'

export const metadata: Metadata = {
  title:       'Evolved Pros — The Platform for High Performers',
  description: 'Community, academy, and accountability for professionals who operate at the highest level.',
  icons: {
    icon:  LOGO_CIRCLE_DARK,
    apple: LOGO_CIRCLE_DARK,
  },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let defaultTheme = 'dark'
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'default_theme')
      .single()
    if (data?.value) defaultTheme = data.value
  } catch {
    // platform_settings may not exist yet — use default
  }

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${barlowCondensed.variable} ${barlow.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInit defaultTheme={defaultTheme} />
      </head>
      <body
        className="bg-navy-deep text-navy antialiased"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {children}
      </body>
    </html>
  )
}
