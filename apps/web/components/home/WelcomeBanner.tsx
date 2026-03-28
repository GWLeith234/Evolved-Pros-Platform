'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo } from 'react'

const GreetingText = dynamic(
  () => import('@/components/home/GreetingText').then(m => m.GreetingText),
  { ssr: false }
)

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
  quote?: { quote_text: string; source: string | null } | null
  // kept for backward-compat with home/page.tsx, not rendered in banner
  unreadPostCount?: number
  upcomingEventCount?: number
}

export function WelcomeBanner({ displayName, tier, quote }: WelcomeBannerProps) {
  // Period is used only for banner image selection — text rendering moved to GreetingText
  const period = useMemo(() => getTimePeriod(new Date().getHours()), [])

  return (
    <div className="relative overflow-hidden rounded-lg h-[140px] md:h-[180px]">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER_URLS[period]}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay — bottom 60% for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(10,15,24,0.85) 0%, rgba(10,15,24,0.50) 40%, rgba(10,15,24,0.10) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 py-4 md:px-7 md:py-5">

        {/* Top: greeting (client-only to avoid timezone hydration errors) + quote */}
        <div>
          <GreetingText firstName={displayName} tier={tier} />

          {quote && (
            <div className="mt-1 max-w-[520px]">
              <p
                className="font-display italic leading-snug line-clamp-2 md:line-clamp-none"
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

        {/* Bottom: CTA buttons */}
        <div className="flex items-center gap-3">
          <Link href="/community">
            <button
              className="inline-flex items-center justify-center rounded font-condensed font-bold uppercase tracking-wider transition-all text-[11px] px-4 py-2"
              style={{ backgroundColor: '#ef0e30', color: 'white' }}
            >
              Community →
            </button>
          </Link>
          <Link href="/academy">
            <button
              className="inline-flex items-center justify-center rounded font-condensed font-semibold uppercase tracking-wide transition-all text-[11px] px-3 py-2"
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
  )
}
