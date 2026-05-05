import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
}

// Theme-aware shimmer. Uses CSS custom properties so the same component
// reads correctly on light admin surfaces (where bg is #fff) and on the
// dark member surfaces (where bg is #0A0F18 / #111926). Falls back to
// neutral mid-grey when the variables aren't set.
export function Skeleton({ width, height, className, rounded = false }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        background:     'linear-gradient(90deg, var(--skeleton-base, rgba(255,255,255,0.06)) 25%, var(--skeleton-highlight, rgba(255,255,255,0.12)) 50%, var(--skeleton-base, rgba(255,255,255,0.06)) 75%)',
        backgroundSize: '200% 100%',
        animation:      'skeleton-shimmer 1.5s infinite',
        borderRadius:   rounded ? 9999 : 4,
      }}
    />
  )
}

// ── Preset composite skeletons ─────────────────────────────────────────────
// All cards use var(--bg-surface) so they sit correctly on every theme.
// The dark member theme defines --bg-surface = #111926; the light admin
// theme leaves it as #fff via the css fallback chain.

const cardStyle: React.CSSProperties = {
  background:      'var(--bg-surface, #fff)',
  border:          '1px solid var(--border-color, rgba(27,60,90,0.10))',
}

export function StatCardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          ...cardStyle,
          flex:         '1 1 140px',
          borderRadius: 8,
          padding:      '16px 20px',
        }}>
          <Skeleton height={10} width={60} className="mb-2" />
          <Skeleton height={28} width={80} />
        </div>
      ))}
    </div>
  )
}

export function PostSkeleton() {
  return (
    <div style={{
      ...cardStyle,
      borderBottom: '1px solid var(--border-color, rgba(27,60,90,0.08))',
      borderTop:    'none',
      borderLeft:   'none',
      borderRight:  'none',
      padding:      '20px 24px',
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Skeleton width={36} height={36} rounded />
        <div style={{ flex: 1 }}>
          <Skeleton height={12} width={120} className="mb-1.5" />
          <Skeleton height={10} width={80} />
        </div>
      </div>
      <Skeleton height={14} width="90%" className="mb-1.5" />
      <Skeleton height={14} width="70%" />
    </div>
  )
}

export function CourseCardSkeleton() {
  return (
    <div style={{
      ...cardStyle,
      borderRadius: 8,
      overflow:     'hidden',
      marginBottom: 8,
      display:      'flex',
    }}>
      <Skeleton width={72} height={88} />
      <div style={{ flex: 1, padding: '14px 16px' }}>
        <Skeleton height={10} width={60} className="mb-2" />
        <Skeleton height={16} width="75%" className="mb-2" />
        <Skeleton height={4} width="100%" />
      </div>
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div style={{
      ...cardStyle,
      borderRadius: 8,
      padding:      16,
      display:      'flex',
      gap:          16,
      marginBottom: 8,
    }}>
      <Skeleton width={48} height={52} />
      <div style={{ flex: 1 }}>
        <Skeleton height={10} width={80} className="mb-2" />
        <Skeleton height={14} width="80%" className="mb-1.5" />
        <Skeleton height={12} width="55%" />
      </div>
    </div>
  )
}

export function NotificationSkeleton() {
  return (
    <div style={{
      padding:      '14px 20px',
      borderBottom: '1px solid var(--border-color, rgba(27,60,90,0.06))',
      display:      'flex',
      gap:          12,
    }}>
      <Skeleton width={8} height={8} rounded className="mt-1 flex-shrink-0" />
      <div style={{ flex: 1 }}>
        <Skeleton height={13} width="85%" className="mb-1.5" />
        <Skeleton height={10} width={60} />
      </div>
    </div>
  )
}
