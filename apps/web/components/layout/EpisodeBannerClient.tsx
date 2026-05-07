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
      style={{
        backgroundColor: 'var(--episode-banner-bg)',
        borderTop: '2px solid #C9302A',
        borderBottom: '1px solid var(--episode-banner-border)',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '20px',
        paddingRight: '20px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span
          style={{
            backgroundColor: '#C9302A',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '3px',
            flexShrink: 0,
          }}
        >
          LATEST EPISODE
        </span>

        <span
          className="truncate max-w-[160px] sm:max-w-xs md:max-w-none text-sm"
          style={{ color: 'var(--episode-banner-text)', fontWeight: 500 }}
        >
          {displayText}
        </span>

        {guestLabel && (
          <>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--episode-banner-border)', flexShrink: 0 }} />
            <span style={{ color: 'var(--episode-banner-text-dim)', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {guestLabel}
            </span>
          </>
        )}

        {dateLabel && (
          <>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--episode-banner-border)', flexShrink: 0 }} />
            <span style={{ color: 'var(--episode-banner-text-dim)', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {dateLabel}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Link
          href={href}
          {...(externalLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          style={{
            backgroundColor: 'var(--episode-banner-cta-bg)',
            border: '1px solid var(--episode-banner-cta-bg)',
            color: 'var(--episode-banner-cta-text)',
            fontSize: '11px',
            fontWeight: 500,
            padding: '4px 12px',
            borderRadius: '4px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
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
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--episode-banner-text-dim)',
            fontSize: '14px',
            lineHeight: 1,
            padding: '4px 6px',
            cursor: 'pointer',
            borderRadius: '3px',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
