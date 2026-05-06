import { SponsorDisclosure } from './SponsorDisclosure'
import { SponsorLogo } from './SponsorLogo'
import {
  brandColor,
  SPONSOR_BG,
  SPONSOR_BORDER,
  SPONSOR_TEXT,
  type Sponsor,
} from './types'

export function SponsorCardRail({ sponsor }: { sponsor: Sponsor }) {
  const color = brandColor(sponsor)

  return (
    <article
      style={{
        backgroundColor: SPONSOR_BG,
        color: SPONSOR_TEXT,
        borderTop: `2px solid ${color}`,
        borderRight: `1px solid ${SPONSOR_BORDER}`,
        borderBottom: `1px solid ${SPONSOR_BORDER}`,
        borderLeft: `1px solid ${SPONSOR_BORDER}`,
        borderRadius: 0,
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 230,
      }}
    >
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color,
          }}
        >
          Partner
        </span>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 8,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.4)',
            border: `1px solid ${SPONSOR_BORDER}`,
            padding: '1px 5px',
          }}
        >
          Sponsored
        </span>
      </div>

      {/* Logo + brand row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SponsorLogo sponsor={sponsor} size={28} color={color} />
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SPONSOR_TEXT,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sponsor.name}
        </span>
      </div>

      {/* One-line tagline */}
      {sponsor.tagline && (
        <p
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.4,
            color: SPONSOR_TEXT,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {sponsor.tagline}
        </p>
      )}

      {/* Compact CTA */}
      {sponsor.cta_text && sponsor.cta_url && (
        <a
          href={sponsor.cta_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color,
            border: `1px solid ${color}`,
            borderRadius: 0,
            textDecoration: 'none',
            alignSelf: 'flex-start',
          }}
        >
          {sponsor.cta_text} →
        </a>
      )}

      <SponsorDisclosure />
    </article>
  )
}
