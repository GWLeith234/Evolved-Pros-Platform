import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { Card, CardBody, CardHeader } from '@evolved-pros/ui'

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, postCountResult, lessonsResult, progressResult, coursesResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, bio, role_title, location, tier, points, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),
    supabase.from('lessons').select('id, course_id, sort_order, title').eq('is_published', true),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, updated_at, notes')
      .eq('user_id', user.id),
    supabase.from('courses').select('id, title, slug, sort_order').eq('is_published', true).order('sort_order'),
  ])

  if (!profileResult.data) redirect('/login')
  const profile = profileResult.data
  const postCount = postCountResult.count ?? 0

  const tab = searchParams.tab ?? 'overview'

  // Build course progress for Progress tab
  const lessonsByCourse: Record<string, { id: string; sort_order: number; title: string }[]> = {}
  for (const l of lessonsResult.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l)
  }

  const completedLessons = new Set(
    (progressResult.data ?? []).filter(p => p.completed_at).map(p => p.lesson_id)
  )

  const courseProgress = (coursesResult.data ?? []).map(c => {
    const lessons = (lessonsByCourse[c.id] ?? []).sort((a, b) => a.sort_order - b.sort_order)
    const total = lessons.length
    const completed = lessons.filter(l => completedLessons.has(l.id)).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { ...c, total, completed, pct }
  })

  const headerUser = {
    ...profile,
    postCount,
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'progress', label: 'Progress' },
    { key: 'edit', label: 'Edit Profile' },
  ]

  return (
    <div className="p-6 space-y-5">
      <ProfileHeader user={headerUser} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[rgba(27,60,90,0.12)]">
        {TABS.map(t => (
          <a
            key={t.key}
            href={t.key === 'overview' ? '/profile/me' : `/profile/me?tab=${t.key}`}
            className="px-4 py-2.5 font-condensed font-semibold uppercase tracking-wide text-xs transition-colors border-b-2 -mb-px"
            style={{
              color: tab === t.key ? '#68a2b9' : '#7a8a96',
              borderColor: tab === t.key ? '#68a2b9' : 'transparent',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab userId={user.id} supabase={supabase} />
      )}

      {tab === 'progress' && (
        <div className="space-y-3">
          {courseProgress.map(c => {
            const isDone = c.pct === 100
            const fillColor = isDone ? '#22c55e' : '#68a2b9'
            return (
              <Card key={c.id}>
                <CardBody>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body font-semibold text-sm text-[#1b3c5a]">{c.title}</span>
                    <span
                      className="font-condensed font-bold text-xs"
                      style={{ color: isDone ? '#22c55e' : '#68a2b9' }}
                    >
                      {c.completed} / {c.total} lessons · {c.pct}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: '4px', backgroundColor: 'rgba(27,60,90,0.12)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${c.pct}%`, backgroundColor: fillColor }}
                    />
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'edit' && (
        <Card>
          <CardHeader title="Edit Profile" />
          <CardBody>
            <ProfileEditForm
              userId={user.id}
              profile={{
                display_name: profile.display_name,
                full_name: profile.full_name,
                bio: profile.bio,
                role_title: profile.role_title,
                location: profile.location,
                avatar_url: profile.avatar_url,
              }}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}

async function OverviewTab({
  userId,
  supabase,
}: {
  userId: string
  supabase: ReturnType<typeof createClient>
}) {
  const { data: posts } = await supabase
    .from('posts')
    .select('id, body, created_at, like_count, reply_count, channels(name, slug)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="font-condensed text-xs uppercase tracking-widest text-[#7a8a96] text-center py-4">
            No posts yet
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map(post => {
        const channel = post.channels as { name: string; slug: string } | null
        return (
          <Card key={post.id}>
            <CardBody>
              {channel && (
                <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-[#68a2b9] mb-1">
                  #{channel.name}
                </p>
              )}
              <p className="font-body text-sm text-[#1b3c5a] leading-relaxed mb-2">
                {post.body}
              </p>
              <div className="flex items-center gap-4">
                <span className="font-condensed text-[10px] text-[#7a8a96]">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="font-condensed text-[10px] text-[#7a8a96]">♥ {post.like_count}</span>
                <span className="font-condensed text-[10px] text-[#7a8a96]">↩ {post.reply_count}</span>
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
