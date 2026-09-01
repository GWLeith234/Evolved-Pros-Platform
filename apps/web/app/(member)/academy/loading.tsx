import { CourseCardSkeleton, Skeleton } from '@/components/shared/Skeleton'

/**
 * Theme-aware Academy hub skeleton — course grid, not a full-screen flash.
 */
export default function AcademyLoading() {
  return (
    <div
      role="status"
      aria-label="Loading academy"
      style={{ background: 'var(--bg-page)', minHeight: '60vh', padding: '32px 24px 48px' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Skeleton height={12} width={100} className="mb-3" />
        <Skeleton height={44} width={280} className="mb-2" />
        <Skeleton height={14} width="45%" className="mb-8" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
