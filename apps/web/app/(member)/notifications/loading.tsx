import { NotificationSkeleton } from '@/components/shared/Skeleton'

export default function NotificationsLoading() {
  return (
    <div className="flex-1" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-2xl mx-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
