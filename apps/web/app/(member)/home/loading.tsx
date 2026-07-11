import { Skeleton, CardSkeleton } from '@/components/shared/Skeleton'

/**
 * Theme-aware /home loading shell for the simplified daily dashboard.
 * Mirrors: welcome → Today's Evolution (3 panels) → 2 sponsors
 * so navigation feels instant and the layout doesn't jump.
 */
export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-label="Loading home"
      className="ep-page-gutter space-y-5 px-6 pb-6"
      style={{ background: 'var(--bg-page)', minHeight: '60vh' }}
    >
      <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }} className="space-y-5 pt-2">
        {/* Welcome banner */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: 24 }}>
          <Skeleton height={12} width={140} className="mb-4" />
          <Skeleton height={30} width="55%" className="mb-3" />
          <Skeleton height={14} width="80%" className="mb-2" />
          <Skeleton height={14} width="65%" />
        </div>

        {/* Today's Evolution — header + 3 dashboard panels */}
        <div>
          <Skeleton height={10} width={120} className="mb-2" />
          <Skeleton height={26} width={260} className="mb-1.5" />
          <Skeleton height={12} width="70%" className="mb-4" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} height={300} />
            ))}
          </div>
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
