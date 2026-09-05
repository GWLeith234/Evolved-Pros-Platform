import { Skeleton, CardSkeleton, ActionCardSkeleton } from '@/components/shared/Skeleton'

/**
 * Theme-aware /home loading shell.
 * Mirrors: welcome → Today's Evolution → 4-up tiles → sponsors
 * so navigation feels instant and layout doesn't jump.
 */
export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-label="Loading home"
      className="ep-page-gutter ep-stack px-6 pb-6"
      style={{ background: 'var(--bg-page)', minHeight: '60vh' }}
    >
      <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }} className="ep-stack">
        {/* Welcome banner */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: 24,
          }}
        >
          <Skeleton height={12} width={140} className="mb-4" />
          <Skeleton height={30} width="55%" className="mb-3" />
          <Skeleton height={14} width="80%" className="mb-2" />
          <Skeleton height={14} width="65%" />
        </div>

        {/* Today's Evolution */}
        <div>
          <Skeleton height={10} width={120} className="mb-2" />
          <Skeleton height={24} width={220} className="mb-3" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ActionCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* 4-up tiles */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} height={200} />
          ))}
        </div>

        {/* Sponsor row (exactly 2) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} height={200} />
          ))}
        </div>
      </div>
    </div>
  )
}
