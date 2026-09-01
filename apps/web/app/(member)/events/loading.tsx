import { EventCardSkeleton } from '@/components/shared/Skeleton'

export default function EventsLoading() {
  return (
    <div className="flex-1" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
