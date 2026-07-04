// HOME-4UP-TILES: the one shared list-row template for the 4-up tiles.
// Anatomy (fixed positions, left → right):
//   [leading token] · [primary line] / [secondary meta line] · [trailing action]
// Leading tokens sit in a single left column, trailing actions in a single
// right column, and the meta line uses one shared type style across all four
// tiles so the eye doesn't re-learn each card.

import type { ReactNode } from 'react'

interface TileRowProps {
  /** Leading token: avatar, rank numeral, episode chip, or checkbox. */
  leading: ReactNode
  /** Primary line: author, headline, episode title, or habit name. */
  primary: ReactNode
  /** Secondary meta line (optional): relative time + snippet, category +
   *  read time, guest + role. Daily Pulse habits pass none. */
  meta?: ReactNode
  /** Trailing action (optional), right-aligned: reactions, play, streak. */
  trailing?: ReactNode
  /** First row drops the divider so the list reads as a single block. */
  isFirst?: boolean
  /** Vertical-center the leading/trailing tokens (single-line rows) vs.
   *  top-align them (multi-line rows like Community / Top Stories). */
  align?: 'start' | 'center'
  /** When set, the primary+meta stack renders inside a real anchor
   *  (keyboard-focusable). Rows whose primary slot already contains its
   *  own <a> must NOT pass href — nested anchors are invalid HTML. */
  href?: string
}

export function TileRow({ leading, primary, meta, trailing, isFirst = false, align = 'start', href }: TileRowProps) {
  const stack = (
    <>
      {primary}
      {meta != null && <div style={{ marginTop: 3 }}>{meta}</div>}
    </>
  )
  return (
    <li
      style={{
        display: 'flex',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderTop: isFirst ? 'none' : '1px solid var(--border-color)',
      }}
    >
      {/* Leading column — single left rail across all tiles. */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {leading}
      </div>

      {/* Primary + meta stack — a real link when the row has a destination. */}
      {href ? (
        <a href={href} style={{ flex: 1, minWidth: 0, display: 'block', textDecoration: 'none', color: 'inherit' }}>
          {stack}
        </a>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>{stack}</div>
      )}

      {/* Trailing column — single right rail across all tiles. */}
      {trailing != null && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {trailing}
        </div>
      )}
    </li>
  )
}

interface TileFooterLinkProps {
  href: string
  /** Footer label, e.g. "All posts" / "All stories" / "All episodes" /
   *  "All habits". The "→" and all-caps treatment are applied here so every
   *  tile's footer is identical. */
  children: ReactNode
}

/** The one footer link for the 4-up tiles: `ALL <NOUN> →`, identically
 *  positioned and styled. Pass into TileCard's `footer` slot. */
export function TileFooterLink({ href, children }: TileFooterLinkProps) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        textAlign: 'right',
      }}
    >
      {children} →
    </a>
  )
}
