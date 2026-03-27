import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProfileBannerWrapper } from '@/components/profile/ProfileBannerWrapper'
import { PointsHistory } from '@/components/profile/PointsHistory'
import { Card, CardBody } from '@evolved-pros/ui'

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams: { tab?: string }
}) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) redirect('/login')

  // Redirect own profile to /profile/me
  if (params.userId === currentUser.id) redirect('/profile/me')

  const [profileResult, postCountResult, lessonsResult, progressResult, coursesResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, banner_url, bio, role_title, location, tier, points, created_at')
      .eq('id', params.userId)
      .single(),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', params.userId),
    supabase.from('lessons').select('id, course_id, sort_order, title').eq('is_published', true),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', params.userId),
    supabase.from('courses').select('id, title, slug, sort_order').eq('is_published', true).order('sort_order'),
  ])

  if (!profileResult.data) notFound()

  const profile = profileResult.data
  const postCount = postCountResult.count ?? 0

  // Build course progress
  const lessonsByCourse: Record<string, string[]> = {}
  for (const l of lessonsResult.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l.id)
  }
  const completedLessons = new Set(
    (progressResult.data ?? []).filter(p => p.completed_at).map(p => p.lesson_id)
  )
  const courseProgress = (coursesResult.data ?? []).map(c => {
    const total = lessonsByCourse[c.id]?.length ?? 0
    const completed = (lessonsByCourse[c.id] ?? []).filter(id => completedLessons.has(id)).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { ...c, total, completed, pct }
  })

  // Fetch their recent posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, body, created_at, like_count, reply_count, channels(name, slug)')
    .eq('author_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const tab = searchParams.tab ?? 'overview'

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'progress', label: 'Progress' },
    { key: 'points', label: 'Points' },
  ]

  const base = `/profile/${params.userId}`

  return (
    <div className="p-6 space-y-5">
      <ProfileBannerWrapper user={{ ...profile, postCount }} isOwn={false} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[rgba(27,60,90,0.12)]">
        {TABS.map(t => (
          <a
            key={t.key}
            href={t.key === 'overview' ? base : `${base}?tab=${t.key}`}
            className="px-4 py-2.5 font-condensed font-semibold uppercase tracking-wide text-xs border-b-2 -mb-px transition-colors"
            style={{
              color: tab === t.key ? '#68a2b9' : '#7a8a96',
              borderColor: tab === t.key ? '#68a2b9' : 'transparent',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Bio */}
          {profile.bio && (
            <Card>
              <CardBody>
                <p className="font-body text-sm text-[#1b3c5a] leading-relaxed">{profile.bio}</p>
              </CardBody>
            </Card>
          )}

          {/* Recent posts */}
          <div>
            <h2 className="font-condensed font-bold uppercase tracking-widest text-xs text-[#7a8a96] mb-3">
              Recent Posts
            </h2>
            {!posts || posts.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="font-condensed text-xs uppercase tracking-widest text-[#7a8a96] text-center py-4">
                    No posts yet
                  </p>
                </CardBody>
              </Card>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* Progress tab */}
      {tab === 'progress' && (
        <div className="space-y-3">
          <h2 className="font-condensed font-bold uppercase tracking-widest text-xs text-[#7a8a96] mb-3">
            Academy Progress
          </h2>
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
                      {c.pct}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: '4px', backgroundColor: 'rgba(27,60,90,0.12)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.pct}%`, backgroundColor: fillColor }}
                    />
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Points tab */}
      {tab === 'points' && (
        <div className="space-y-3">
          <h2 className="font-condensed font-bold uppercase tracking-widest text-xs text-[#7a8a96] mb-3">
            Points Activity
          </h2>
          <PointsHistory userId={params.userId} supabase={supabase} />
        </div>
      )}
    </div>
  )
}
