import { SponsorDisclosure } from './SponsorDisclosure'
import { SponsorLogo } from './SponsorLogo'
import {
  brandColor,
  SPONSOR_BG,
  SPONSOR_TEXT,
  SPONSOR_TEXT_MUTED,
  type Sponsor,
} from './types'

export function SponsorCardLessonBreak({ sponsor }: { sponsor: Sponsor }) {
  const color = brandColor(sponsor)

  return (
    <article
      style={{
        backgroundColor: SPONSOR_BG,
        color: SPONSOR_TEXT,
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
      }}
    >
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          Recommended by Evolved Pros
        </span>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SPONSOR_TEXT_MUTED,
            border: `1px solid ${color}55`,
            padding: '2px 6px',
          }}
        >
          Partner
        </span>
      </div>

      {/* Logo + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SponsorLogo sponsor={sponsor} size={64} color={color} />
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SPONSOR_TEXT,
          }}
        >
          {sponsor.name}
        </span>
      </div>

      {/* Tagline (serif, 22px) */}
      {sponsor.tagline && (
        <p
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.3,
            color: SPONSOR_TEXT,
          }}
        >
          {sponsor.tagline}
        </p>
      )}

      {/* Body */}
      {sponsor.body_copy && (
        <p
          style={{
            margin: 0,
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 14,
            lineHeight: 1.6,
            color: SPONSOR_TEXT_MUTED,
          }}
        >
          {sponsor.body_copy}
        </p>
      )}

      {/* Filled CTA + disclosure */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        {sponsor.cta_text && sponsor.cta_url ? (
          <a
            href={sponsor.cta_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 22px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#0F172A',
              backgroundColor: color,
              border: `1px solid ${color}`,
              borderRadius: 4,
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
