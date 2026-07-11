import Link from 'next/link'

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
 */
export function TodaysEvolution({ actions }: TodaysEvolutionProps) {
  if (!actions.length) return null

  return (
    <section
      aria-label="Today's Evolution"
      style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
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
              margin: '4px 0 0',
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

      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
      >
        {actions.map(a => (
          <Link
            key={a.id}
            href={a.href}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '16px 16px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              overflow: 'hidden',
              minHeight: 148,
              transition: 'border-color 140ms ease, transform 140ms ease',
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
            <span
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: a.primary ? '#fff' : a.accent,
                background: a.primary ? a.accent : 'transparent',
                border: `1px solid ${a.accent}`,
                padding: a.primary ? '7px 12px' : '6px 10px',
              }}
            >
              {a.cta}
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
