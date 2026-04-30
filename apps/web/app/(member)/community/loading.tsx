import { PostSkeleton } from '@/components/shared/Skeleton'

export default function CommunityLoading() {
  return (
    <div className="flex-1" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-3xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
