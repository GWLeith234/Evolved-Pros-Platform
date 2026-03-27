'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@evolved-pros/ui'
import { MemberBadge } from '@/components/ui/MemberBadge'

interface WelcomeBannerProps {
  displayName: string
  tier?: string | null
  unreadPostCount: number
  upcomingEventCount: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getWeekLabel(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const day = now.getDate()
  const year = now.getFullYear()
  return `Week of ${monthName} ${day}, ${year} — Q${quarter} · Week ${weekNum}`
}

export function WelcomeBanner({ displayName, tier, unreadPostCount, upcomingEventCount }: WelcomeBannerProps) {
  const greeting = useMemo(() => getGreeting(), [])
  const weekLabel = useMemo(() => getWeekLabel(), [])

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ backgroundColor: '#112535', padding: '24px 28px' }}
    >
      {/* Watermark */}
      <span
        className="absolute right-[-20px] top-1/2 -translate-y-1/2 select-none pointer-events-none font-display font-black leading-none"
        style={{
          fontSize: '110px',
          color: 'rgba(255,255,255,0.03)',
          whiteSpace: 'nowrap',
        }}
        aria-hidden="true"
      >
        EP
      </span>

      <div className="relative z-10">
        {/* Eyebrow */}
        <p
          className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-3"
          style={{ color: '#68a2b9' }}
        >
          {weekLabel}
        </p>

        {/* Title */}
        <h1
          className="font-display font-bold text-white mb-2 leading-tight flex items-center gap-3 flex-wrap"
          style={{ fontSize: '20px' }}
        >
          {greeting}, {displayName}.
          {tier && <MemberBadge tier={tier} size="md" />}
        </h1>

        {/* Subtitle */}
        <p
          className="font-body text-[13px] mb-5"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {unreadPostCount === 0 && upcomingEventCount === 0 ? (
            "You're all caught up this week!"
          ) : (
            <>
              You have{' '}
              <span className="text-white font-medium">{unreadPostCount}</span> unread{' '}
              {unreadPostCount === 1 ? 'post' : 'posts'} and{' '}
              <span className="text-white font-medium">{upcomingEventCount}</span> upcoming{' '}
              {upcomingEventCount === 1 ? 'event' : 'events'} this week.
            </>
          )}
        </p>

        {/* CTA row */}
        <div className="flex items-center gap-3">
          <Link href="/community">
            <Button variant="primary" size="sm">
              Go to Community →
            </Button>
          </Link>
          <Link href="/academy">
            <button
              className="inline-flex items-center justify-center gap-2 rounded font-condensed font-semibold uppercase tracking-wide transition-all duration-150 px-3 py-1.5 text-xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
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
