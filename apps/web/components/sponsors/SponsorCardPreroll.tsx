import { SponsorDisclosure } from './SponsorDisclosure'
import { SponsorLogo } from './SponsorLogo'
import {
  brandColor,
  SPONSOR_BG,
  SPONSOR_TEXT,
  SPONSOR_TEXT_MUTED,
  type Sponsor,
} from './types'

export function SponsorCardPreroll({ sponsor }: { sponsor: Sponsor }) {
  const color = brandColor(sponsor)

  return (
    <article
      style={{
        backgroundColor: SPONSOR_BG,
        color: SPONSOR_TEXT,
        borderTop: `2px solid ${color}`,
        borderBottom: `2px solid ${color}`,
        borderRadius: 0,
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        width: '100%',
      }}
    >
      {/* Logo */}
      <SponsorLogo sponsor={sponsor} size={40} color={color} />

      {/* Eyebrow + brand + tagline + body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color,
            }}
          >
            Partner of this episode
          </span>
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SPONSOR_TEXT,
            }}
          >
            {sponsor.name}
          </span>
        </div>

        {sponsor.tagline && (
          <p
            style={{
              margin: 0,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.35,
              color: SPONSOR_TEXT,
            }}
          >
            {sponsor.tagline}
          </p>
        )}

        {sponsor.body_copy && (
          <p
            style={{
              margin: 0,
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: 12,
              lineHeight: 1.5,
              color: SPONSOR_TEXT_MUTED,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {sponsor.body_copy}
          </p>
        )}

        <div style={{ marginTop: 4 }}>
          <SponsorDisclosure />
        </div>
      </div>

      {/* CTA right */}
      {sponsor.cta_text && sponsor.cta_url && (
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
            flexShrink: 0,
          }}
        >
          {sponsor.cta_text} →
        </a>
      )}
    </article>
  )
}
