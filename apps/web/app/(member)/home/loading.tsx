import { Skeleton, CardSkeleton } from '@/components/shared/Skeleton'

// Theme-aware /home skeleton. Mirrors the real page rhythm (welcome banner →
// 4-up tile grid → Evolution Partner sponsor row) so the layout doesn't shift
// when content arrives. All surfaces bind to --bg-page / --bg-surface.
export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-label="Loading home"
      className="space-y-5 px-6 pb-6"
      style={{ background: 'var(--bg-page)', minHeight: '100vh' }}
    >
      <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }} className="space-y-5 pt-2">
        {/* Welcome banner */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <Skeleton height={12} width={140} className="mb-4" />
          <Skeleton height={30} width="55%" className="mb-3" />
          <Skeleton height={14} width="80%" className="mb-2" />
          <Skeleton height={14} width="65%" />
        </div>

        {/* 4-up tile grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} height={200} />
          ))}
        </div>

        {/* Evolution Partner sponsor row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} height={220} />
          ))}
        </div>
      </div>
    </div>
  )
}
