import { Skeleton } from '@/components/shared/Skeleton'

/**
 * Lightweight member-shell fallback — avoids full-screen branded flash on
 * every navigation so page transitions feel snappier.
 */
export default function MemberLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        background: 'var(--bg-page)',
        minHeight: '40vh',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Skeleton height={12} width={120} className="mb-4" />
        <Skeleton height={28} width="60%" className="mb-3" />
        <Skeleton height={14} width="90%" className="mb-2" />
        <Skeleton height={14} width="75%" />
      </div>
    </div>
  )
}
