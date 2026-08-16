import { SponsorDisclosure } from './SponsorDisclosure'
import { SponsorLogo } from './SponsorLogo'
import {
  brandColor,
  SPONSOR_BG,
  SPONSOR_BORDER,
  SPONSOR_TEXT,
  SPONSOR_TEXT_MUTED,
  type Sponsor,
} from './types'

export function SponsorCardHero({ sponsor }: { sponsor: Sponsor }) {
  const color = brandColor(sponsor)

  return (
    <article
      style={{
        backgroundColor: SPONSOR_BG,
        color: SPONSOR_TEXT,
        borderTop: '2px solid #C9302A',
        borderRight: `1px solid ${SPONSOR_BORDER}`,
        borderBottom: `1px solid ${SPONSOR_BORDER}`,
        borderLeft: `1px solid ${SPONSOR_BORDER}`,
        borderRadius: 0,
        padding: '20px 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,48,42,0.14)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'rgba(201,48,42,0.45)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = SPONSOR_BORDER
      }}
    >
      {/* Eyebrow row — Evolution Partner badge + sponsored disclosure */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#0A0F18',
            background: 'var(--brand-gold, #C9A84C)',
            border: 'none',
            padding: '3px 8px',
          }}
        >
          Partner
        </span>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SPONSOR_TEXT_MUTED,
            border: `1px solid ${SPONSOR_BORDER}`,
            padding: '2px 6px',
          }}
        >
          Sponsored
        </span>
      </div>

      {/* Logo + brand row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SponsorLogo sponsor={sponsor} size={48} color={color} />
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SPONSOR_TEXT,
          }}
        >
          {sponsor.name}
        </span>
      </div>

      {/* Tagline (serif) */}
      {sponsor.tagline && (
        <p
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.35,
            color: SPONSOR_TEXT,
          }}
        >
          {sponsor.tagline}
        </p>
      )}

      {/* Body line */}
      {sponsor.body_copy && (
        <p
          style={{
            margin: 0,
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.55,
            color: SPONSOR_TEXT_MUTED,
          }}
        >
          {sponsor.body_copy}
        </p>
      )}

      {/* CTA + disclosure */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        {sponsor.cta_text && sponsor.cta_url ? (
          <a
            href={sponsor.cta_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color,
              border: `1px solid ${color}`,
              borderRadius: 0,
              textDecoration: 'none',
            }}
          >
            {sponsor.cta_text} →
          </a>
        ) : <span />}
        <SponsorDisclosure />
      </div>
    </article>
  )
}

