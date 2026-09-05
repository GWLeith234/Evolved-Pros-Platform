import { Skeleton, CardSkeleton } from '@/components/shared/Skeleton'

/**
 * Theme-aware /home loading shell.
 * Mirrors locked IA: Banner -> Accountability -> Fuel -> episodes.
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
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: 24,
          }}
        >
          <Skeleton height={10} width={120} className="mb-3" />
          <Skeleton height={28} width="60%" className="mb-3" />
          <Skeleton height={14} width={80} className="mb-2" />
          <Skeleton height={8} width="70%" />
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: 24,
          }}
        >
          <Skeleton height={10} width={140} className="mb-3" />
          <Skeleton height={18} width={220} className="mb-4" />
          <Skeleton height={16} width="90%" className="mb-3" />
          <Skeleton height={16} width="80%" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} height={180} />
          ))}
        </div>
      </div>
    </div>
  )
}
