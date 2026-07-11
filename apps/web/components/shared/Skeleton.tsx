import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
  /** Optional explicit border-radius (px). Overrides `rounded`. */
  radius?: number
}

/**
 * Theme-aware shimmer skeleton.
 * Uses --skeleton-base / --skeleton-highlight from globals.css
 * (dark: white-alpha, light: navy-alpha). Falls back safely if unset.
 */
export function Skeleton({
  width,
  height,
  className,
  rounded = false,
  radius,
}: SkeletonProps) {
  return (
    <div
      className={className}
      role="presentation"
      aria-hidden="true"
      style={{
        width,
        height,
        background:
          'linear-gradient(90deg, var(--skeleton-base, rgba(255,255,255,0.06)) 25%, var(--skeleton-highlight, rgba(255,255,255,0.12)) 50%, var(--skeleton-base, rgba(255,255,255,0.06)) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        borderRadius: radius ?? (rounded ? 9999 : 4),
      }}
    />
  )
}

// ── Preset composite skeletons ─────────────────────────────────────────────
// All cards use var(--bg-surface) so they sit correctly on every theme.

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface, #fff)',
  border: '1px solid var(--border-color, rgba(27,60,90,0.10))',
}

export function PostSkeleton() {
  return (
    <div
      style={{
        ...cardStyle,
        borderBottom: '1px solid var(--border-color, rgba(27,60,90,0.08))',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        padding: '20px 24px',
      }}
    >
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

export function EventCardSkeleton() {
  return (
    <div
      style={{
        ...cardStyle,
        borderRadius: 0,
        padding: 16,
        display: 'flex',
        gap: 16,
        marginBottom: 8,
      }}
    >
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
    <div
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-color, rgba(27,60,90,0.06))',
        display: 'flex',
        gap: 12,
      }}
    >
      <Skeleton width={8} height={8} rounded className="mt-1 flex-shrink-0" />
      <div style={{ flex: 1 }}>
        <Skeleton height={13} width="85%" className="mb-1.5" />
        <Skeleton height={10} width={60} />
      </div>
    </div>
  )
}

/** Generic card placeholder for home tiles / sponsor slots. */
export function CardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div
      style={{
        ...cardStyle,
        borderRadius: 0,
        padding: 20,
        height,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Skeleton width={36} height={36} />
        <Skeleton height={14} width={120} />
      </div>
      <Skeleton height={16} width="85%" />
      <Skeleton height={12} width="60%" />
      <div style={{ marginTop: 'auto' }}>
        <Skeleton height={28} width={110} />
      </div>
    </div>
  )
}
