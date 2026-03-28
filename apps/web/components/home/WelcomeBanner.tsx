'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MemberBadge } from '@/components/ui/MemberBadge'

const BASE = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/'

const BANNER_URLS = {
  morning: `${BASE}banner-morning.jpg`,
  midday:  `${BASE}banner-midday.jpg`,
  evening: `${BASE}banner-evening.jpg`,
}

const PILLAR_LABELS: Record<string, string> = {
  p1: 'Foundation',
  p2: 'Identity',
  p3: 'Mental Toughness',
  p4: 'Strategy',
  p5: 'Accountability',
  p6: 'Execution',
}

type TimePeriod = 'morning' | 'midday' | 'evening'

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'midday'
  return 'evening'
}

function getGreeting(period: TimePeriod): string {
  if (period === 'morning') return 'Good morning'
  if (period === 'midday') return 'Good afternoon'
  return 'Good evening'
}

function getWeekLabel(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  return `Week of ${monthName} ${now.getDate()}, ${now.getFullYear()} — Q${quarter} · Week ${weekNum}`
}

function getDayOfYear(): number {
  const now = new Date()
  return Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  )
}

type Quote = { quote: string; pillar: string | null }

interface WelcomeBannerProps {
  displayName: string
  tier?: string | null
  // kept for backward-compat with home/page.tsx, not rendered in banner
  unreadPostCount?: number
  upcomingEventCount?: number
}

export function WelcomeBanner({ displayName, tier }: WelcomeBannerProps) {
  const period    = useMemo(() => getTimePeriod(new Date().getHours()), [])
  const greeting  = useMemo(() => getGreeting(period), [period])
  const weekLabel = useMemo(() => getWeekLabel(), [])
  const dayOfYear = useMemo(() => getDayOfYear(), [])

  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('greeting_quotes')
      .select('quote, pillar')
      .in('time_of_day', [period, 'any'])
      .then(({ data }) => {
        if (data && data.length > 0) {
          setQuote(data[dayOfYear % data.length])
        }
      })
  }, [period, dayOfYear])

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

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,15,24,0.55) 0%, rgba(10,15,24,0.20) 40%, rgba(10,15,24,0.45) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 py-4 md:px-7 md:py-5">

        {/* Top: week label + greeting + quote */}
        <div>
          <p
            className="font-condensed font-bold uppercase tracking-[0.2em] mb-1"
            style={{ fontSize: '9px', color: '#c9a84c' }}
          >
            {weekLabel}
          </p>

          <h1
            className="font-display font-black text-white leading-tight flex items-center gap-3 flex-wrap"
            style={{ fontSize: '22px' }}
          >
            {greeting}, {displayName}.
            {tier && <MemberBadge tier={tier} size="md" />}
          </h1>

          {quote && (
            <div className="mt-1 max-w-[520px]">
              <p
                className="font-display italic leading-snug line-clamp-2 md:line-clamp-none"
                style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}
              >
                &ldquo;{quote.quote}&rdquo;
              </p>
              {quote.pillar && PILLAR_LABELS[quote.pillar] && (
                <p
                  className="font-condensed font-bold uppercase tracking-[0.15em] mt-0.5"
                  style={{ fontSize: '9px', color: 'rgba(201,168,76,0.6)' }}
                >
                  EVOLVED · Pillar {quote.pillar.slice(1)}: {PILLAR_LABELS[quote.pillar]}
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
