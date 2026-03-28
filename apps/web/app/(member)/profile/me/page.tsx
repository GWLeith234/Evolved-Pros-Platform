import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileBannerWrapper } from '@/components/profile/ProfileBannerWrapper'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import type { OverviewPost, CourseProgressItem, PointsEntry, ProfileForEdit } from '@/components/profile/ProfileTabs'

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    profileResult,
    postCountResult,
    lessonsResult,
    progressResult,
    coursesResult,
    overviewPostsResult,
    eventRegsResult,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, banner_url, bio, role_title, location, tier, points, created_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible')
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
  ])

  if (!profileResult.data) redirect('/login')
  const profile = profileResult.data
  const postCount = postCountResult.count ?? 0

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

  const headerUser = { ...profile, postCount }

  return (
    <div className="p-6 space-y-5">
      <ProfileBannerWrapper user={headerUser} isOwn={true} />

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
