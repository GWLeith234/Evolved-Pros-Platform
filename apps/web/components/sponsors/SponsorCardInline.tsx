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

export function SponsorCardInline({ sponsor }: { sponsor: Sponsor }) {
  const color = brandColor(sponsor)

  return (
    <article
      style={{
        backgroundColor: SPONSOR_BG,
        color: SPONSOR_TEXT,
        borderTop: `1px solid ${SPONSOR_BORDER}`,
        borderRight: `1px solid ${SPONSOR_BORDER}`,
        borderBottom: `1px solid ${SPONSOR_BORDER}`,
        borderLeft: '3px solid #C9302A',
        borderRadius: 0,
        height: 64,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 16px',
        transition: 'box-shadow 160ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,48,42,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Eyebrow */}
      <span
        style={{
          fontFamily: 'var(--font-condensed), sans-serif',
          fontWeight: 800,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#0A0F18',
            background: 'var(--brand-gold, #C9A84C)',
            border: 'none',
          padding: '2px 6px',
          flexShrink: 0,
        }}
      >
        Partner
      </span>

      {/* Logo + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <SponsorLogo sponsor={sponsor} size={28} color={color} />
        <span
          style={{
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SPONSOR_TEXT,
            whiteSpace: 'nowrap',
          }}
        >
          {sponsor.name}
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          margin: 0,
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-display), Georgia, serif',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.3,
          color: SPONSOR_TEXT_MUTED,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {sponsor.tagline}
      </p>

      {/* CTA */}
      {sponsor.cta_text && sponsor.cta_url && (
        <a
          href={sponsor.cta_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color,
            border: `1px solid ${color}`,
            borderRadius: 0,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          {sponsor.cta_text} →
        </a>
      )}

      {/* Disclosure */}
      <SponsorDisclosure inline />
    </article>
  )
}
