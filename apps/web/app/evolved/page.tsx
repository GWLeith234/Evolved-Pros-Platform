/**
 * Public EVOLVED book preorder landing page.
 *
 * House IAB book ads dest here. Charcoal/gold only — this page must not use
 * Evolved Pros navy or red. Cover art is the existing repo reconstruction
 * at /ads/book-cover.png; do not invent a new cover or an Amazon/ASIN link.
 *
 * Lives outside app/(public) so it does not inherit the navy/red PublicFooter
 * (Join free). Not in the middleware matcher, so anonymous visitors render
 * the page — same bar as /terms, /privacy, /contact.
 */

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BookPreorderForm, type BookPreorderUtm } from '@/components/book/BookPreorderForm'
import { BOOK_COVER_SRC, BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import { footerCopyright } from '@/lib/layout/publicFooter'
import { publicPageMetadata } from '@/lib/seo/canonical'

const CHARCOAL = '#28282B'
const CHARCOAL_DEEP = '#1a1a1d'
const GOLD = '#C89A3C'
const GOLD_LIGHT = '#E1BC5B'
const CREAM = '#F3EEE4'
const MUTED = 'rgba(243,238,228,0.55)'
const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FM = 'var(--font-evolved-book), Montserrat, Barlow, sans-serif'

export const metadata: Metadata = publicPageMetadata(BOOK_PREORDER_PATH, {
  title: 'EVOLVED — George Leith',
  description: 'Get the book. Leave your name for the EVOLVED preorder list. No charge, no membership.',
  openGraph: {
    images: [{ url: BOOK_COVER_SRC, width: 1200, height: 1920, alt: 'EVOLVED by George Leith' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [BOOK_COVER_SRC],
  },
})

function oneParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    const trimmed = value[0].trim()
    return trimmed || undefined
  }
  return undefined
}

export default function EvolvedBookPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const utm: BookPreorderUtm = {
    utm_source: oneParam(searchParams.utm_source),
    utm_medium: oneParam(searchParams.utm_medium),
    utm_campaign: oneParam(searchParams.utm_campaign),
    utm_content: oneParam(searchParams.utm_content),
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(165deg, ${CHARCOAL} 0%, ${CHARCOAL_DEEP} 70%, #121214 100%)`,
        color: CREAM,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1040,
          margin: '0 auto',
          padding: 'clamp(32px, 6vw, 72px) 20px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(28px, 5vw, 64px)',
          alignItems: 'center',
        }}
      >
        <div style={{ justifySelf: 'center', width: '100%', maxWidth: 280, margin: '0 auto' }}>
          <Image
            src={BOOK_COVER_SRC}
            alt="EVOLVED by George Leith"
            width={600}
            height={960}
            priority
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 3,
              boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
              display: 'block',
            }}
          />
        </div>

        <div style={{ minWidth: 0, position: 'relative' }}>
          <p
            style={{
              margin: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: GOLD,
            }}
          >
            New book
          </p>
          <h1
            style={{
              margin: '10px 0 8px',
              fontFamily: FM,
              fontWeight: 900,
              fontSize: 'clamp(42px, 8vw, 72px)',
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, #B4842A 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            EVOLVED
          </h1>
          <p
            style={{
              margin: '0 0 22px',
              fontFamily: FB,
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            George Leith
          </p>
          <p
            style={{
              margin: '0 0 28px',
              fontFamily: FB,
              fontSize: 17,
              lineHeight: 1.55,
              color: CREAM,
              maxWidth: 460,
            }}
          >
            Leave your name. We&rsquo;ll hold your place for the book. No charge. No membership.
          </p>
          <BookPreorderForm utm={utm} />
        </div>
      </main>

      <footer
        style={{
          borderTop: '1px solid rgba(200,154,60,0.22)',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 20px',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1040,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <p style={{ margin: 0, fontFamily: FB, fontSize: 12, color: MUTED }}>{footerCopyright()}</p>
        <nav aria-label="Legal" style={{ display: 'flex', gap: 16 }}>
          <Link href="/privacy" style={{ fontFamily: FBC, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, textDecoration: 'none' }}>
            Privacy
          </Link>
          <Link href="/terms" style={{ fontFamily: FBC, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, textDecoration: 'none' }}>
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  )
}
