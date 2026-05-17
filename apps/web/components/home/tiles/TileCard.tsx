// HOME-4UP-TILES: shared card chrome for the 4-up below-fold tile row.
// Mirrors home-tiles.jsx <Card> (lines 11-71) with theme tokens.

import type { ReactNode } from 'react'

interface TileCardProps {
  /** Top stripe + eyebrow color (one of --tile-* tokens). */
  accent: string
  eyebrow: string
  title: string
  /** Optional badge in the top-right (e.g. "3 NEW", "EP 142", "MEDIA"). */
  count?: string | null
  children: ReactNode
  footer?: ReactNode
  /** When true, slightly shorter min-height (per JSX `dense` flag). */
  dense?: boolean
}

export function TileCard({ accent, eyebrow, title, count, children, footer, dense = false }: TileCardProps) {
  return (
    <article
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        minHeight: dense ? 280 : 320,
        overflow: 'hidden',
      }}
    >
      {/* Accent stripe */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
        }}
      />

      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            {eyebrow}
          </p>
          <h3
            style={{
              margin: '4px 0 0',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 22,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h3>
        </div>
        {count != null && (
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              padding: '2px 8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
            }}
          >
            {count}
          </span>
        )}
      </header>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {footer && (
        <footer
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {footer}
        </footer>
      )}
    </article>
  )
}
