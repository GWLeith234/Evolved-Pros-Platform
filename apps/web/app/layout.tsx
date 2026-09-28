// cache-bust: 2026-03-25
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { getDefaultTheme } from '@/lib/cache/shared'
import { getGscVerification } from '@/lib/analytics/public-ids'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import { AudienceAnalytics } from '@/components/analytics/AudienceAnalytics'
import { ThemeInit } from '@/components/ThemeInit'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'

const gscVerification = getGscVerification()

// Self-hosted latin woff2 (same families, weights, styles, and CSS variables).
// display stays swap. Serif families keep the Times New Roman size-adjusted
// fallback; the others keep Arial. Files are the latin cuts from Google Fonts.
const playfair = localFont({
  src: [
    {
      path: '../fonts/playfair-display/playfair-display-latin-700-900-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/playfair-display/playfair-display-latin-700-900-normal.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../fonts/playfair-display/playfair-display-latin-700-900-italic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../fonts/playfair-display/playfair-display-latin-700-900-italic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

const barlowCondensed = localFont({
  src: [
    { path: '../fonts/barlow-condensed/barlow-condensed-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/barlow-condensed/barlow-condensed-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/barlow-condensed/barlow-condensed-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/barlow-condensed/barlow-condensed-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/barlow-condensed/barlow-condensed-latin-800-normal.woff2', weight: '800', style: 'normal' },
    { path: '../fonts/barlow-condensed/barlow-condensed-latin-900-normal.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-condensed',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const barlow = localFont({
  src: [
    { path: '../fonts/barlow/barlow-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/barlow/barlow-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/barlow/barlow-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/barlow/barlow-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/barlow/barlow-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const bebasNeue = localFont({
  src: '../fonts/bebas-neue/bebas-neue-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-logo',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const abrilFatface = localFont({
  src: '../fonts/abril-fatface/abril-fatface-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-abril',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const merriweather = localFont({
  src: [
    {
      path: '../fonts/merriweather/merriweather-latin-400-700-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/merriweather/merriweather-latin-400-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/merriweather/merriweather-latin-400-700-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/merriweather/merriweather-latin-400-700-italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-serif',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

const LOGO_CIRCLE_DARK = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Branding/logo_circle_dark.png`

export const metadata: Metadata = {
  // Resolve relative canonical / og URLs to www. Page-level publicPageMetadata
  // (or generateMetadata) owns the path-specific url so /media cannot inherit
  // the homepage the way it did when this layout hardcoded og:url = SITE_URL.
  metadataBase: new URL(CANONICAL_ORIGIN),
  title:       'Evolved Pros — The Platform for High Performers',
  description: 'Community, academy, and accountability for professionals who operate at the highest level.',
  icons: {
    icon:  LOGO_CIRCLE_DARK,
    apple: LOGO_CIRCLE_DARK,
  },
  openGraph: {
    title:       'Evolved Pros',
    description: 'The platform for high performers.',
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
          href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap"
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
