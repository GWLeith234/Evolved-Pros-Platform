interface MemberBadgeProps {
  tier: 'vip' | 'pro' | string | null | undefined
  size?: 'sm' | 'md'
}

const BADGE_CONFIG = {
  vip: {
    background: '#C9A84C',
    border: '1px solid rgba(0,0,0,0.1)',
    color: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(201,168,76,0.35)',
    label: 'VIP',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  pro: {
    background: '#C9302A',
    border: '1px solid rgba(0,0,0,0.1)',
    color: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(201,48,42,0.35)',
    label: 'PRO',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
}

const FALLBACK_BADGE = {
  background: 'rgba(122,138,150,0.08)',
  border: '1px solid rgba(122,138,150,0.3)',
  color: '#7a8a96',
  borderRadius: '20px',
}

export function MemberBadge({ tier, size = 'md' }: MemberBadgeProps) {
  // No tier (free / unset) renders nothing — the constraint allows only
  // 'vip', 'pro', or NULL, so a missing tier is the canonical "free" state.
  if (!tier) return null

  const isSm = size === 'sm'
  const key = tier.toLowerCase() as keyof typeof BADGE_CONFIG
  const config = BADGE_CONFIG[key]

  // Defensive fallback: if a row ever lands in the DB with a tier outside
  // the allowed set (the constraint would normally block this), surface it
  // as a muted grey badge with the raw value rather than silently mapping
  // it to a tier it isn't.
  if (!config) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isSm ? '3px' : '5px',
          background: FALLBACK_BADGE.background,
          border: FALLBACK_BADGE.border,
          borderRadius: FALLBACK_BADGE.borderRadius,
          padding: isSm ? '1px 8px' : '2px 10px',
          fontSize: isSm ? '9px' : '10px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: FALLBACK_BADGE.color,
          lineHeight: 1.4,
          flexShrink: 0,
        }}
      >
        {tier.toUpperCase()}
      </span>
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '3px' : '5px',
        background: config.background,
        border: config.border,
        borderRadius: config.borderRadius ?? '20px',
        padding: isSm ? '1px 8px' : '2px 10px',
        fontSize: isSm ? '9px' : '10px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        color: config.color,
        lineHeight: 1.4,
        flexShrink: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((config as any).boxShadow ? { boxShadow: (config as any).boxShadow } : {}),
      }}
    >
      <span style={{ color: config.color, display: 'flex', alignItems: 'center', fontSize: '12px' }}>
        {config.icon(9)}
      </span>
      {config.label}
    </span>
  )
}
