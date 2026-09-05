import { PostSkeleton, RailCardSkeleton, Skeleton } from '@/components/shared/Skeleton'

/**
 * Theme-aware /community loading shell.
 * Two-column rhythm matches feed + sticky engagement rail.
 */
export default function CommunityLoading() {
  return (
    <div
      role="status"
      aria-label="Loading community"
      className="flex-1"
      style={{ background: 'var(--bg-page)', minHeight: '60vh' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 32px' }}>
        {/* Header */}
        <div style={{ padding: '16px 8px 20px' }}>
          <Skeleton height={12} width={100} className="mb-3" />
          <Skeleton height={40} width={220} className="mb-2" />
          <Skeleton height={14} width="50%" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(280px,35fr)]">
          {/* Feed column */}
          <div>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Skeleton height={12} width={80} className="mb-3" />
              <Skeleton height={64} width="100%" className="mb-3" />
              <Skeleton height={32} width={100} />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>

          {/* Rail column — desktop only */}
          <div className="hidden lg:flex flex-col gap-3">
            <RailCardSkeleton height={160} />
            <RailCardSkeleton height={130} />
            <RailCardSkeleton height={140} />
            <RailCardSkeleton height={180} />
          </div>
        </div>
      </div>
    </div>
  )
}
