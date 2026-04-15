'use client'

import { PostQueueItem } from './PostQueueItem'

interface Post {
  id: string
  body: string
  status: string
  scheduled_at: string
  pillar?: string
  slot?: string
  tier?: string
}

interface PostQueueProps {
  posts: Post[]
  onAction: (postId: string, action: 'approve' | 'reject', body?: string) => void
}

export function PostQueue({ posts, onAction }: PostQueueProps) {
  return (
    <div>
      <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
        This Week&apos;s Queue
      </p>
      <div className="flex flex-col gap-2">
        {posts.map(post => (
          <PostQueueItem key={post.id} post={post} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}
