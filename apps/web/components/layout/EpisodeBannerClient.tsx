'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DISMISS_KEY = 'ep_banner_dismissed'

interface EpisodeBannerClientProps {
  episodeId: string
  displayText: string
  guestLabel: string | null
  dateLabel: string | null
  href: string
  ctaLabel: string
  externalLink: boolean
}

export function EpisodeBannerClient({
  episodeId,
  displayText,
  guestLabel,
  dateLabel,
  href,
  ctaLabel,
  externalLink,
}: EpisodeBannerClientProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const d = localStorage.getItem(DISMISS_KEY)
      if (d === episodeId) setDismissed(true)
    } catch {
      // localStorage may be unavailable (private mode, SSR-bridge edge)
    }
  }, [episodeId])

  if (dismissed) return null

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:h-[38px] gap-2 sm:gap-0 px-4 sm:px-5 py-2 sm:py-0 w-full max-w-full overflow-hidden box-border"
      style={{
        backgroundColor: 'var(--episode-banner-bg)',
        borderTop: '2px solid #C9302A',
        borderBottom: '1px solid var(--episode-banner-border)',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-2 sm:gap-[10px] min-w-0">
        <span
          className="text-[12px] sm:text-[9px] font-bold uppercase tracking-wider rounded-[3px] px-2 py-[2px] shrink-0"
          style={{ backgroundColor: '#C9302A', color: '#ffffff' }}
        >
          LATEST EPISODE
        </span>

        {/* Desktop: title inline alongside the badge. Hidden on mobile —
            mobile renders the title on its own row below. */}
        <span
          className="hidden sm:inline truncate sm:max-w-xs md:max-w-none text-sm"
          style={{ color: 'var(--episode-banner-text)', fontWeight: 500 }}
        >
          {displayText}
        </span>

        {guestLabel && (
          <>
            <span className="hidden sm:block shrink-0" style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--episode-banner-border)' }} />
            <span
              className="hidden sm:inline whitespace-nowrap text-[11px] shrink-0"
              style={{ color: 'var(--episode-banner-text-dim)' }}
            >
              {guestLabel}
            </span>
          </>
        )}

        {dateLabel && (
          <>
            <span className="hidden sm:block shrink-0" style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--episode-banner-border)' }} />
            <span
              className="hidden sm:inline whitespace-nowrap text-[11px] shrink-0"
              style={{ color: 'var(--episode-banner-text-dim)' }}
            >
              {dateLabel}
            </span>
          </>
        )}
      </div>

      {/* Mobile-only: title row stacked under the label row. */}
      <span
        className="sm:hidden truncate text-[13px] w-full min-w-0"
        style={{ color: 'var(--episode-banner-text)', fontWeight: 500 }}
      >
        {displayText}
      </span>

      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
        <Link
          href={href}
          {...(externalLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-[12px] sm:text-[11px] font-medium rounded px-3 py-2 sm:py-1 no-underline whitespace-nowrap"
          style={{
            backgroundColor: 'var(--episode-banner-cta-bg)',
            border: '1px solid var(--episode-banner-cta-bg)',
            color: 'var(--episode-banner-cta-text)',
          }}
        >
          {ctaLabel}
        </Link>

        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, episodeId)
            } catch {
              // ignore — still dismiss for this session
            }
            setDismissed(true)
          }}
          aria-label="Dismiss latest episode banner"
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center rounded-[3px] cursor-pointer text-[14px] leading-none px-[6px] py-1 bg-transparent border-0"
          style={{ color: 'var(--episode-banner-text-dim)' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
