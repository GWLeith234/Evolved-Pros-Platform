'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const BASE = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/'

const BANNER_URLS = {
  morning: `${BASE}banner-morning.jpg`,
  midday:  `${BASE}banner-midday.jpg`,
  evening: `${BASE}banner-evening.jpg`,
}

type TimePeriod = 'morning' | 'midday' | 'evening'

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'midday'
  return 'evening'
}

// ssr:false — these components are NEVER in the server-rendered HTML.
// Default exports used so dynamic() needs no .then() transform.
const GreetingHeading = dynamic(() => import('./GreetingHeading'), { ssr: false })
const WeekLabel = dynamic(() => import('./WeekLabel'), { ssr: false })

interface WelcomeBannerProps {
  displayName: string
  tier?: string | null
  avatarUrl?: string | null
  quote?: { quote_text: string; source: string | null } | null
  unreadPostCount?: number
  upcomingEventCount?: number
}

export function WelcomeBanner({ displayName, tier, avatarUrl, quote }: WelcomeBannerProps) {
  const [period, setPeriod] = useState<TimePeriod | null>(null)

  useEffect(() => {
    setPeriod(getTimePeriod(new Date().getHours()))
  }, [])

  const tierLabel = tier ? tier.toUpperCase() : null

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ minHeight: '220px' }}>
      {/* Background image — suppressHydrationWarning covers the src attribute change only */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER_URLS[period ?? 'morning']}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        suppressHydrationWarning
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(10,15,24,0.92) 0%, rgba(10,15,24,0.65) 50%, rgba(10,15,24,0.25) 100%)',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col justify-between px-6 py-5 md:px-7 md:py-6"
        style={{ minHeight: '220px' }}
      >
        {/* Main content row: avatar + name/quote */}
        <div className="flex items-start gap-6">
          {/* Avatar — 128px hero with tier badge on bottom-left corner */}
          <div className="flex-shrink-0 relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-32 h-32 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center ring-2 ring-white/20"
                style={{ backgroundColor: '#ef0e30' }}
              >
                <span className="font-display font-black text-white" style={{ fontSize: '40px' }}>
                  {displayName[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
            {tierLabel && (
              <span
                className="font-condensed font-bold uppercase tracking-wide"
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '4px',
                  transform: 'translate(-25%, 25%)',
                  background: '#ef0e30',
                  color: 'white',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  zIndex: 20,
                }}
              >
                ★ {tierLabel}
              </span>
            )}
          </div>

          {/* Name + quote */}
          <div className="flex-1 flex flex-col pt-1">
            {/* GreetingHeading is client-only (ssr:false) — never in server HTML, no tree mismatch */}
            <GreetingHeading displayName={displayName} />
            {quote && (
              <div className="mt-2 max-w-[480px]">
                <p
                  className="font-display italic leading-snug line-clamp-2"
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,0.80)' }}
                >
                  &ldquo;{quote.quote_text}&rdquo;
                </p>
                {quote.source && (
                  <p
                    className="font-condensed font-semibold mt-0.5"
                    style={{ fontSize: '11px', color: '#c9a84c' }}
                  >
                    — {quote.source}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: week label left + CTA buttons right */}
        <div className="flex items-center justify-between mt-auto pt-4">
          {/* WeekLabel is client-only (ssr:false) — renders null on server, appears after mount */}
          <WeekLabel />

          <div className="flex items-center gap-2">
            <Link
              href="/community"
              className="inline-flex items-center justify-center font-condensed font-semibold uppercase tracking-wide transition-colors"
              style={{
                fontSize: '11px',
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.75)',
                backgroundColor: 'transparent',
              }}
            >
              Community
            </Link>
            <Link
              href="/academy"
              className="inline-flex items-center justify-center font-condensed font-semibold uppercase tracking-wide transition-colors"
              style={{
                fontSize: '11px',
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid rgba(104,162,185,0.4)',
                color: '#68a2b9',
                backgroundColor: 'transparent',
              }}
            >
              Learning
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
