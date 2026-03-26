interface MemberBadgeProps {
  tier: 'community' | 'vip' | 'pro' | string | null | undefined
  size?: 'sm' | 'md'
}

const BADGE_CONFIG = {
  community: {
    background: '#1b3c5a',
    border: '1.5px solid #68a2b9',
    color: '#68a2b9',
    label: 'COMMUNITY',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  vip: {
    background: '#2a1f0a',
    border: '1.5px solid #BA7517',
    color: '#EF9F27',
    label: 'VIP MEMBER',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  pro: {
    background: '#1a0a0a',
    border: '1.5px solid #ef0e30',
    color: '#ef0e30',
    label: 'PRO MEMBER',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
}

export function MemberBadge({ tier, size = 'md' }: MemberBadgeProps) {
  if (!tier) return null

  const key = tier.toLowerCase() as keyof typeof BADGE_CONFIG
  const config = BADGE_CONFIG[key]
  if (!config) return null

  const isSm = size === 'sm'
  const iconSize = isSm ? 9 : 11

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '3px' : '5px',
        background: config.background,
        border: config.border,
        borderRadius: isSm ? '3px' : '4px',
        padding: isSm ? '1px 5px' : '2px 8px',
        fontSize: isSm ? '9px' : '10px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: config.color,
        lineHeight: 1.4,
        flexShrink: 0,
      }}
    >
      <span style={{ color: config.color, display: 'flex', alignItems: 'center' }}>
        {config.icon(iconSize)}
      </span>
      {config.label}
    </span>
  )
}
