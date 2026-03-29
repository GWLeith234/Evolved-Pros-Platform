'use client'

import Link from 'next/link'
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
  const [weekLabel, setWeekLabel] = useState<string | null>(null)
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    setPeriod(getTimePeriod(hour))
    const g = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    setGreeting(g)
    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    setWeekLabel(
      `Week of ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — Q${quarter}`
    )
  }, [])

  const tierLabel = tier ? tier.toUpperCase() : null

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ minHeight: '220px' }}>
      {/* Background image — suppress hydration: src differs server(morning) vs client(actual period) */}
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

      {/* Professional badge — absolute top-right */}
      {tierLabel && (
        <div className="absolute top-3 right-3 z-20">
          <span
            className="font-condensed font-bold uppercase tracking-wide"
            style={{
              background: '#ef0e30',
              color: 'white',
              fontSize: '10px',
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ★ {tierLabel}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className="relative z-10 flex flex-col justify-between px-6 py-5 md:px-7 md:py-6"
        style={{ minHeight: '220px' }}
      >
        {/* Main content row: avatar + name/quote */}
        <div className="flex items-start gap-6">
          {/* Avatar — 128px hero */}
          <div className="flex-shrink-0">
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
          </div>

          {/* Name + quote */}
          <div className="flex-1 flex flex-col pt-1">
            {/* Greeting — null on server, fills in after useEffect — zero hydration diff */}
            {greeting && (
              <h1 className="text-3xl font-bold text-white leading-tight">
                {greeting}, {displayName}.
              </h1>
            )}
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
          {weekLabel ? (
            <p
              className="font-condensed font-bold uppercase tracking-widest"
              style={{ fontSize: '9px', color: '#c9a84c' }}
            >
              {weekLabel}
            </p>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <Link href="/community">
              <button
                className="inline-flex items-center justify-center rounded font-condensed font-bold uppercase tracking-wider transition-all text-xs px-4 py-2"
                style={{ backgroundColor: '#ef0e30', color: 'white' }}
              >
                Community →
              </button>
            </Link>
            <Link href="/academy">
              <button
                className="inline-flex items-center justify-center rounded font-condensed font-semibold uppercase tracking-wide transition-all text-xs px-4 py-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  color: 'rgba(255,255,255,0.80)',
                }}
              >
                Continue Learning →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
