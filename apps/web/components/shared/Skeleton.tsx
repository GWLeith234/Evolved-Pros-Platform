import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
}

export function Skeleton({ width, height, className, rounded = false }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        background:     'linear-gradient(90deg, rgba(27,60,90,0.06) 25%, rgba(27,60,90,0.10) 50%, rgba(27,60,90,0.06) 75%)',
        backgroundSize: '200% 100%',
        animation:      'skeleton-shimmer 1.5s infinite',
        borderRadius:   rounded ? 9999 : 4,
      }}
    />
  )
}

// ── Preset composite skeletons ─────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          flex:            '1 1 140px',
          background:      '#fff',
          border:          '1px solid rgba(27,60,90,0.10)',
          borderRadius:    8,
          padding:         '16px 20px',
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
      background:      '#fff',
      borderBottom:    '1px solid rgba(27,60,90,0.08)',
      padding:         '20px 24px',
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
      background:   '#fff',
      border:       '1px solid rgba(27,60,90,0.10)',
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
      background:   '#fff',
      border:       '1px solid rgba(27,60,90,0.10)',
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
      borderBottom: '1px solid rgba(27,60,90,0.06)',
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
