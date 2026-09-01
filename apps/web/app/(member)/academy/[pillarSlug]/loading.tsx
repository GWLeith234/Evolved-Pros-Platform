import { Skeleton, CardSkeleton } from '@/components/shared/Skeleton'

/** Theme-aware course / pillar page skeleton. */
export default function AcademyCourseLoading() {
  return (
    <div
      role="status"
      aria-label="Loading course"
      style={{ background: 'var(--bg-page)', minHeight: '60vh' }}
    >
      <Skeleton height={280} width="100%" radius={0} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>
        <Skeleton height={12} width={140} className="mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <CardSkeleton height={72} />
          </div>
        ))}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-8">
          <CardSkeleton height={200} />
          <CardSkeleton height={200} />
        </div>
      </div>
    </div>
  )
}
