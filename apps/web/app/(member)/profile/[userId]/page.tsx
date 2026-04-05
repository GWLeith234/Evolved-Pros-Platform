import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { ProfileBannerWrapper } from '@/components/profile/ProfileBannerWrapper'

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const { data: profile } = await adminClient
    .from('users')
    .select('display_name, full_name')
    .eq('id', params.userId)
    .single()
  const name = profile?.display_name ?? profile?.full_name ?? 'Profile'
  return { title: `${name} — Evolved Pros` }
}
import { ProfileAdUnit } from '@/components/profile/ProfileAdUnit'
import { PointsHistory } from '@/components/profile/PointsHistory'
import { SendMessageButton } from '@/components/profile/SendMessageButton'

const PILLAR_LABELS: Record<string, string> = {
  p1: 'Foundation',
  p2: 'Identity',
  p3: 'Mental Toughness',
  p4: 'Strategy',
  p5: 'Accountability',
  p6: 'Execution',
}

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

  const adPromise = adminClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('platform_ads' as any)
    .select('id, image_url, headline, tool_name, cta_text, link_url, click_url, sponsor_name')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const [profileResult, postCountResult, lessonsResult, progressResult, coursesResult, adResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, banner_url, bio, role_title, location, tier, points, created_at, company, linkedin_url, website_url, twitter_handle, current_pillar, goal_90day, goal_visible')
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
    adPromise,
  ])

  if (!profileResult.data) notFound()

  const profile = profileResult.data
  const postCount = postCountResult.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileAd = (adResult.data as any) ?? null

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

  const CARD_STYLE = { backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }
  const CARD_BODY_STYLE = { padding: '16px 20px' }

  return (
    <div className="p-6 space-y-5" style={{ backgroundColor: '#0A0F18', minHeight: '100%' }}>
      <ProfileBannerWrapper
        user={{
          ...profile,
          postCount,
          company: profile.company ?? null,
          linkedin_url: profile.linkedin_url ?? null,
          website_url: profile.website_url ?? null,
          twitter_handle: profile.twitter_handle ?? null,
          current_pillar: profile.current_pillar ?? null,
          goal_90day: profile.goal_90day ?? null,
          goal_visible: profile.goal_visible ?? true,
        }}
        isOwn={false}
      />

      {profileAd && <ProfileAdUnit ad={profileAd} />}

      {/* Send Message button */}
      <div className="flex justify-end">
        <SendMessageButton recipientId={params.userId} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <a
            key={t.key}
            href={t.key === 'overview' ? base : `${base}?tab=${t.key}`}
            className="px-4 py-2.5 font-condensed font-semibold uppercase tracking-wide text-xs border-b-2 -mb-px transition-colors"
            style={{
              color: tab === t.key ? '#C9A84C' : 'rgba(255,255,255,0.4)',
              borderColor: tab === t.key ? '#C9A84C' : 'transparent',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {profile.bio && (
            <div style={CARD_STYLE}>
              <div style={CARD_BODY_STYLE}>
                <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{profile.bio}</p>
              </div>
            </div>
          )}

          {profile.goal_visible && profile.goal_90day && (
            <div style={CARD_STYLE}>
              <div style={CARD_BODY_STYLE}>
                <p className="font-condensed font-bold uppercase tracking-widest text-[9px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  90-Day Focus
                </p>
                <p className="font-body text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {profile.goal_90day}
                </p>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-condensed font-bold uppercase tracking-widest text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Recent Posts
            </h2>
            {!posts || posts.length === 0 ? (
              <div style={CARD_STYLE}>
                <div style={CARD_BODY_STYLE}>
                  <p className="font-condensed text-xs uppercase tracking-widest text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No posts yet
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => {
                  const channel = post.channels as { name: string; slug: string } | null
                  return (
                    <div key={post.id} style={CARD_STYLE}>
                      <div style={CARD_BODY_STYLE}>
                        {channel && (
                          <p className="font-condensed text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#68a2b9' }}>
                            #{channel.name}
                          </p>
                        )}
                        <p className="font-body text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                          {post.body}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="font-condensed text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="font-condensed text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>♥ {post.like_count}</span>
                          <span className="font-condensed text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>↩ {post.reply_count}</span>
                        </div>
                      </div>
                    </div>
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
          <h2 className="font-condensed font-bold uppercase tracking-widest text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Academy Progress
          </h2>
          {courseProgress.map(c => {
            const isDone = c.pct === 100
            const fillColor = isDone ? '#22c55e' : '#68a2b9'
            return (
              <div key={c.id} style={CARD_STYLE}>
                <div style={CARD_BODY_STYLE}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{c.title}</span>
                    <span className="font-condensed font-bold text-xs" style={{ color: isDone ? '#22c55e' : '#68a2b9' }}>
                      {c.pct}%
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: fillColor }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Points tab */}
      {tab === 'points' && (
        <div className="space-y-3">
          <h2 className="font-condensed font-bold uppercase tracking-widest text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Points Activity
          </h2>
          <PointsHistory userId={params.userId} supabase={supabase} />
        </div>
      )}
    </div>
  )
}
