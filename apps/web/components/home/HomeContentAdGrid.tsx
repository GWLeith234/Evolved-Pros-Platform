import Link from 'next/link'
import { HomeSponsorAd, type SponsorAd } from './HomeSponsorAd'

/**
 * Home editorial row: at most two content cards, then one IAB.
 * Never a third story. Never a row of four.
 */
export function HomeContentAdGrid({
  title,
  href,
  linkLabel,
  ad,
  children,
  eyebrowColor = 'var(--brand-red)',
}: {
  title: string
  href: string
  linkLabel: string
  ad?: SponsorAd | null
  children: React.ReactNode
  eyebrowColor?: string
}) {
  return (
    <section data-home-content-row style={{ padding: '32px 0', borderTop: '1px solid var(--border-color)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: eyebrowColor,
          }}
        >
          {title}
        </h2>
        <Link
          href={href}
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
          }}
        >
          {linkLabel}
        </Link>
      </div>
      <ul
        data-home-content-grid
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {children}
        {ad ? (
          <li
            data-home-ads="in-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 250,
              minWidth: 0,
            }}
          >
            <HomeSponsorAd ad={ad} />
          </li>
        ) : null}
      </ul>
    </section>
  )
}

export function HomeEditorialCard({
  href,
  title,
  meta,
}: {
  href: string
  title: string
  meta: string | null
}) {
  return (
    <li style={{ minWidth: 0 }}>
      <Link
        href={href}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          height: '100%',
          padding: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          textDecoration: 'none',
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.25,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </span>
        {meta && (
          <span style={{ fontFamily: '"Barlow", sans-serif', fontSize: 13, color: 'var(--text-tertiary)' }}>
            {meta}
          </span>
        )}
      </Link>
    </li>
  )
}

export function HomeEndBox({ ad }: { ad: SponsorAd | null }) {
  if (!ad) return null
  return (
    <div
      data-home-ads="end-box"
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 600,
      }}
    >
      <HomeSponsorAd ad={ad} />
    </div>
  )
}
