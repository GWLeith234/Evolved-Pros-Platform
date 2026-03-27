import { createClient } from '@/lib/supabase/server'

type PointsHistoryEntry = {
  id: string
  icon: string
  description: string
  points: number
  date: string
}

interface PointsHistoryProps {
  userId: string
  supabase: ReturnType<typeof createClient>
}

export async function PointsHistory({ userId, supabase }: PointsHistoryProps) {
  // Fetch data sources to build activity log
  const [postsResult, lessonsResult, eventsResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, body, created_at, like_count')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, lessons(title)')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10),
    supabase
      .from('event_registrations')
      .select('event_id, created_at, events(title, starts_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const entries: PointsHistoryEntry[] = []

  // Posts earn points
  for (const post of postsResult.data ?? []) {
    entries.push({
      id: `post-${post.id}`,
      icon: '✍️',
      description: `Posted in community${post.body ? `: "${post.body.slice(0, 60)}${post.body.length > 60 ? '…' : ''}"` : ''}`,
      points: 10,
      date: post.created_at,
    })
    if (post.like_count > 0) {
      entries.push({
        id: `likes-${post.id}`,
        icon: '♥',
        description: `Received ${post.like_count} like${post.like_count !== 1 ? 's' : ''} on a post`,
        points: post.like_count * 5,
        date: post.created_at,
      })
    }
  }

  // Lesson completions earn points
  for (const progress of lessonsResult.data ?? []) {
    if (!progress.completed_at) continue
    const lesson = progress.lessons as { title: string } | null
    entries.push({
      id: `lesson-${progress.lesson_id}`,
      icon: '📚',
      description: `Completed lesson${lesson?.title ? `: ${lesson.title}` : ''}`,
      points: 25,
      date: progress.completed_at,
    })
  }

  // Event registrations earn points
  for (const reg of eventsResult.data ?? []) {
    const event = reg.events as { title: string; starts_at: string } | null
    entries.push({
      id: `event-${reg.event_id}`,
      icon: '📅',
      description: `Registered for event${event?.title ? `: ${event.title}` : ''}`,
      points: 15,
      date: reg.created_at,
    })
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const displayed = entries.slice(0, 20)

  if (displayed.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ backgroundColor: '#112535' }}
      >
        <p className="font-condensed text-xs uppercase tracking-widest" style={{ color: '#7a8a96' }}>
          No activity yet
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#112535', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {displayed.map((entry, i) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 px-4 py-3"
          style={{
            borderBottom: i < displayed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          {/* Icon */}
          <div
            className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-sm"
            style={{ backgroundColor: 'rgba(104,162,185,0.1)' }}
          >
            {entry.icon}
          </div>

          {/* Description */}
          <div className="flex-1 min-w-0">
            <p
              className="font-body text-sm leading-snug"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {entry.description}
            </p>
            <p
              className="font-condensed text-[10px] mt-0.5 uppercase tracking-wide"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {new Date(entry.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Points */}
          <div className="flex-shrink-0 text-right">
            <span
              className="font-condensed font-bold text-sm"
              style={{ color: '#68a2b9' }}
            >
              +{entry.points}
            </span>
            <p
              className="font-condensed text-[8px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              pts
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
