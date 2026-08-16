// cache-bust: 2026-03-25
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Barlow_Condensed, Barlow, Bebas_Neue, Merriweather, Abril_Fatface } from 'next/font/google'
import { getDefaultTheme } from '@/lib/cache/shared'
import { getGscVerification } from '@/lib/analytics/public-ids'
import { AudienceAnalytics } from '@/components/analytics/AudienceAnalytics'
import { ThemeInit } from '@/components/ThemeInit'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'

const gscVerification = getGscVerification()

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '900'],
  style: ['normal', 'italic'],
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-condensed',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const barlow = Barlow({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-logo',
  weight: ['400'],
})

const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-abril',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

const LOGO_CIRCLE_DARK = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Branding/logo_circle_dark.png`

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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Evolved Pros',
  },
  formatDetection: {
    telephone: false,
  },
  // Search Console HTML-tag verification. Omitted when the env var is unset.
  ...(gscVerification ? { verification: { google: gscVerification } } : {}),
}

/** iOS/Android web: device-width + safe-area (viewport-fit=cover). */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0F18' },
    { media: '(prefers-color-scheme: light)', color: '#FAF9F7' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cached 5 min — avoids a DB round-trip on every public + member request.
  let defaultTheme = 'dark'
  try {
    defaultTheme = await getDefaultTheme()
  } catch {
    // platform_settings may not exist yet — use default
  }

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${barlowCondensed.variable} ${barlow.variable} ${bebasNeue.variable} ${abrilFatface.variable} ${merriweather.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Fonts — exposes the literal family names ("Bebas Neue",
           "Barlow Condensed", "Barlow", "Playfair Display") so component-level
           fontFamily strings resolve. next/font above also loads these for the
           CSS-variable form (--font-logo etc.) used by other components. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap"
        />
        <ThemeInit defaultTheme={defaultTheme} />
      </head>
      <body
        className="antialiased"
        style={{
          fontFamily: 'var(--font-body)',
          backgroundColor: 'var(--bg-page)',
          color: 'var(--text-primary)',
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <AudienceAnalytics />
      </body>
    </html>
  )
}
