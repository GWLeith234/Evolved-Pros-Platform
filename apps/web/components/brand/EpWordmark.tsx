import type { CSSProperties, ElementType } from 'react'

/**
 * Standing mandate (George via CoS/GM, 2026-09-07): EVOLVED·PROS with a red
 * middle interpunct. Magic Link email is the bar. Never a space-separated
 * lockup and never a period in place of ·.
 */
export const EP_WORDMARK_DOT_COLOR = 'var(--brand-red-hot)'

export const EP_WORDMARK_SNIPPET =
  "EVOLVED<span style={{ color: 'var(--brand-red-hot)' }}>·</span>PROS" as const

/** Shared mark children. Emails and UI both render this exact span. */
export function EpWordmarkMark() {
  return (
    <>
      EVOLVED<span style={{ color: EP_WORDMARK_DOT_COLOR }}>·</span>PROS
    </>
  )
}

export function EpWordmark({
  as: Tag = 'p',
  tone = 'light',
  className,
  style,
}: {
  as?: ElementType
  tone?: 'light' | 'dark'
  className?: string
  style?: CSSProperties
}) {
  const color = tone === 'light' ? 'var(--text-primary)' : 'var(--navy-dark)'
  return (
    <Tag
      data-testid="ep-wordmark"
      aria-label="Evolved Pros"
      className={className}
      style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.15em',
        color,
        margin: 0,
        lineHeight: 1,
        ...style,
      }}
    >
      <EpWordmarkMark />
    </Tag>
  )
}
