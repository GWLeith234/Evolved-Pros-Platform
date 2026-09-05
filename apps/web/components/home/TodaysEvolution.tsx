import Link from 'next/link'
import { gradients } from '@evolved-pros/ui'

export type TodaysEvolutionAction = {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
  /** brand accent for the left bar */
  accent: string
  primary?: boolean
}

interface TodaysEvolutionProps {
  actions: TodaysEvolutionAction[]
}

/**
 * One-glance daily loop for DAU — clear CTAs into course, accountability,
 * and community. Theme-aware via CSS vars; pure server component.
 * Sprint 2: CTAs use shared Button variants for premium consistency.
 */
export function TodaysEvolution({ actions }: TodaysEvolutionProps) {
  if (!actions.length) return null

  return (
    <section
      aria-label="Today's Evolution"
      className="ep-stack--tight"
      style={{ width: '100%', maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column' }}
    >
      <div
        className="ep-section-head"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 0,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-red, #C9302A)',
            }}
          >
            Today&apos;s Evolution
          </p>
          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 28,
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            One click. Keep the streak.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-ep-section">
        {actions.map(a => (
          <Link
            key={a.id}
            href={a.href}
            className="ep-surface-card ep-card-pad group"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              overflow: 'hidden',
              minHeight: 148,
              transition: 'border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: a.accent,
              }}
            />
            <p
              style={{
                margin: 0,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: a.accent,
              }}
            >
              {a.eyebrow}
            </p>
            <h3
              style={{
                margin: 0,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                color: 'var(--text-primary)',
              }}
            >
              {a.title}
            </h3>
            <p
              style={{
                margin: 0,
                flex: 1,
                fontFamily: '"Barlow", sans-serif',
                fontSize: 13,
                lineHeight: 1.4,
                color: 'var(--text-secondary)',
              }}
            >
              {a.description}
            </p>
            {/* Button chrome (Sprint 1 tokens) — parent Link owns navigation */}
            <span
              aria-hidden
              className={a.primary ? 'ep-btn ep-btn--primary' : 'ep-btn ep-btn--secondary'}
              style={{
                alignSelf: 'flex-start',
                marginTop: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                minHeight: 32,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                borderRadius: 0,
                border: a.primary ? '1px solid transparent' : '1px solid var(--brand-gold, #C9A84C)',
                background: a.primary ? (gradients?.primary ?? 'linear-gradient(135deg, #ef0e30 0%, #c50a26 100%)') : 'transparent',
                color: a.primary ? '#FFFFFF' : 'var(--brand-gold, #C9A84C)',
              }}
            >
              {a.cta}
              <span>→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
