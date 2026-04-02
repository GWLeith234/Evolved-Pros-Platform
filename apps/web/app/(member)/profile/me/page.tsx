import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ProfileBannerWrapper } from '@/components/profile/ProfileBannerWrapper'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfileAdUnit } from '@/components/profile/ProfileAdUnit'
import type { OverviewPost, CourseProgressItem, PointsEntry, ProfileForEdit } from '@/components/profile/ProfileTabs'

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adPromise = adminClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('platform_ads' as any)
    .select('id, image_url, headline, tool_name, cta_text, link_url, click_url, sponsor_name')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const [
    profileResult,
    postCountResult,
    lessonsResult,
    progressResult,
    coursesResult,
    overviewPostsResult,
    eventRegsResult,
    adResult,
    alumniBadgeResult,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, banner_url, bio, role_title, location, tier, points, created_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible, pioneer_driver_type')
      .eq('id', user.id)
      .single(),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('lessons').select('id, course_id, sort_order, title').eq('is_published', true),
    supabase.from('lesson_progress').select('lesson_id, completed_at, updated_at').eq('user_id', user.id),
    supabase.from('courses').select('id, title, slug, sort_order').eq('is_published', true).order('sort_order'),
    // Overview tab: recent posts with channel
    supabase
      .from('posts')
      .select('id, body, created_at, like_count, reply_count, channels(name, slug)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    // Points tab: event registrations
    supabase
      .from('event_registrations')
      .select('event_id, created_at, events(title, starts_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    adPromise,
    // Alumni badge (pillar_number = 7)
    adminClient
      .from('member_badges')
      .select('pillar_number, awarded_at')
      .eq('user_id', user.id)
      .eq('pillar_number', 7)
      .maybeSingle(),
  ])

  if (!profileResult.data) redirect('/login')
  const profile = profileResult.data
  const postCount = postCountResult.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileAd = (adResult.data as any) ?? null
  const alumniBadge = alumniBadgeResult.data as { pillar_number: number; awarded_at: string | null } | null
  const alumniAwardedAt = alumniBadge?.awarded_at
    ? new Date(alumniBadge.awarded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  // Build course progress for Progress tab
  const lessonsByCourse: Record<string, { id: string; sort_order: number; title: string }[]> = {}
  for (const l of lessonsResult.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l)
  }
  const completedLessons = new Set(
    (progressResult.data ?? []).filter(p => p.completed_at).map(p => p.lesson_id)
  )
  const courseProgress: CourseProgressItem[] = (coursesResult.data ?? []).map(c => {
    const lessons = (lessonsByCourse[c.id] ?? []).sort((a, b) => a.sort_order - b.sort_order)
    const total = lessons.length
    const completed = lessons.filter(l => completedLessons.has(l.id)).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { id: c.id, title: c.title, total, completed, pct }
  })

  // Build overview posts
  const overviewPosts: OverviewPost[] = (overviewPostsResult.data ?? []).map(p => ({
    id: p.id,
    body: p.body,
    created_at: p.created_at,
    like_count: p.like_count,
    reply_count: p.reply_count,
    channels: p.channels as { name: string; slug: string } | null,
  }))

  // Build points history entries
  const lessonsById = new Map((lessonsResult.data ?? []).map(l => [l.id, l]))
  const pointsEntries: PointsEntry[] = []

  for (const post of overviewPosts) {
    pointsEntries.push({
      id: `post-${post.id}`,
      icon: '✍️',
      description: `Posted in community${post.body ? `: "${post.body.slice(0, 60)}${post.body.length > 60 ? '…' : ''}"` : ''}`,
      points: 10,
      date: post.created_at,
    })
    if (post.like_count > 0) {
      pointsEntries.push({
        id: `likes-${post.id}`,
        icon: '♥',
        description: `Received ${post.like_count} like${post.like_count !== 1 ? 's' : ''} on a post`,
        points: post.like_count * 5,
        date: post.created_at,
      })
    }
  }
  for (const p of (progressResult.data ?? []).filter(lp => lp.completed_at)) {
    const lesson = lessonsById.get(p.lesson_id)
    pointsEntries.push({
      id: `lesson-${p.lesson_id}`,
      icon: '📚',
      description: `Completed lesson${lesson?.title ? `: ${lesson.title}` : ''}`,
      points: 25,
      date: p.completed_at!,
    })
  }
  for (const reg of (eventRegsResult.data ?? [])) {
    const event = reg.events as { title: string; starts_at: string } | null
    pointsEntries.push({
      id: `event-${reg.event_id}`,
      icon: '📅',
      description: `Registered for event${event?.title ? `: ${event.title}` : ''}`,
      points: 15,
      date: reg.created_at,
    })
  }
  pointsEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const profileForEdit: ProfileForEdit = {
    display_name: profile.display_name,
    full_name: profile.full_name,
    bio: profile.bio,
    role_title: profile.role_title,
    location: profile.location,
    avatar_url: profile.avatar_url,
    company: profile.company ?? null,
    linkedin_url: profile.linkedin_url ?? null,
    website_url: profile.website_url ?? null,
    twitter_handle: profile.twitter_handle ?? null,
    phone: profile.phone ?? null,
    phone_visible: profile.phone_visible ?? false,
    current_pillar: profile.current_pillar ?? null,
    goal_90day: profile.goal_90day ?? null,
    goal_visible: profile.goal_visible ?? true,
  }

  const validTabs = ['overview', 'progress', 'points', 'edit'] as const
  type Tab = typeof validTabs[number]
  const rawTab = searchParams.tab ?? 'overview'
  const initialTab: Tab = (validTabs as readonly string[]).includes(rawTab)
    ? (rawTab as Tab)
    : 'overview'

  const headerUser = { ...profile, postCount, pioneer_driver_type: profile.pioneer_driver_type ?? null }

  return (
    <div className="p-6 space-y-5" style={{ backgroundColor: '#0A0F18', minHeight: '100%' }}>
      <ProfileBannerWrapper user={headerUser} isOwn={true} />

      {alumniBadge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#111926', border: '2px solid rgba(201,168,76,0.35)', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #C9A84C', backgroundColor: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '22px' }}>★</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: '18px', color: '#C9A84C', margin: '0 0 2px', letterSpacing: '0.06em' }}>
              EVOLVED
            </p>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', margin: '0 0 2px' }}>
              ALUMNI
            </p>
            {alumniAwardedAt && (
              <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                Awarded {alumniAwardedAt}
              </p>
            )}
          </div>
          <a href="/academy/completion" style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', textDecoration: 'none', flexShrink: 0 }}>
            View →
          </a>
        </div>
      )}

      {profileAd && <ProfileAdUnit ad={profileAd} />}

      <ProfileTabs
        userId={user.id}
        initialTab={initialTab}
        overviewPosts={overviewPosts}
        courseProgress={courseProgress}
        pointsEntries={pointsEntries.slice(0, 20)}
        profile={profileForEdit}
      />
    </div>
  )
}
