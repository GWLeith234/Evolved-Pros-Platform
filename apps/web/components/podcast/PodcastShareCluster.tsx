'use client'

import { useState } from 'react'

const FBC = 'Barlow Condensed, sans-serif'

interface PodcastShareClusterProps {
  title: string
  url: string
}

interface ShareIcon {
  key: 'x' | 'linkedin' | 'facebook' | 'email' | 'link'
  label: string
  svg: React.ReactNode
  href: (title: string, url: string) => string | null
}

const ICONS: ShareIcon[] = [
  {
    key: 'x',
    label: 'Share on X',
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    href: (title, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: 'linkedin',
    label: 'Share on LinkedIn',
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.268 2.37 4.268 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    href: (_title, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: 'facebook',
    label: 'Share on Facebook',
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    href: (_title, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: 'email',
    label: 'Share via email',
    svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    href: (title, url) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
  {
    key: 'link',
    label: 'Copy link',
    svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    href: () => null,
  },
]

export function PodcastShareCluster({ title, url }: PodcastShareClusterProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const onClick = async (key: ShareIcon['key'], href: string | null) => {
    if (key === 'link') {
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copied')
        setTimeout(() => setToast(null), 1800)
      } catch {
        setToast('Copy failed')
        setTimeout(() => setToast(null), 1800)
      }
      return
    }
    if (href) {
      if (key === 'email') window.location.href = href
      else window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          border: '1px solid var(--podcast-border-strong)',
          height: 46,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--podcast-text-3)',
            borderRight: '1px solid var(--podcast-border-soft2)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </span>
        {ICONS.map((c, i) => {
          const href = c.href(title, url)
          const isHover = hovered === c.key
          return (
            <button
              key={c.key}
              type="button"
              title={c.label}
              aria-label={c.label}
              onMouseEnter={() => setHovered(c.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onClick(c.key, href)}
              style={{
                width: 44,
                height: '100%',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isHover ? 'var(--podcast-bg-elevated)' : 'transparent',
                color: isHover ? 'var(--podcast-text-strong)' : 'var(--podcast-text-2)',
                border: 'none',
                borderLeft: i === 0 ? 'none' : '1px solid var(--podcast-border-soft)',
                cursor: 'pointer',
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              {c.svg}
            </button>
          )
        })}
      </div>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            background: '#0D1B2A',
            border: '1px solid rgba(201,168,76,0.5)',
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#fff',
            zIndex: 1200,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          {toast}
        </div>
      )}
    </>
  )
}
