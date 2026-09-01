import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { ProfileView } from '@/components/profile/ProfileView'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { countUserPosts } from '@/lib/community/postCount'

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const { data } = await adminClient
    .from('users')
    .select('display_name, full_name')
    .eq('id', params.userId)
    .maybeSingle()
  const name = data?.display_name ?? data?.full_name ?? 'Profile'
  return { title: `${name} — Evolved Pros` }
}

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams?: { edit?: string }
}) {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // params.userId IS public.users.id — query by id here.
  const { data: profile } = await adminClient
    .from('users')
    .select(
      'id, display_name, full_name, avatar_url, bio, role_title, location, banner_url, points, tier, tier_status, created_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible',
    )
    .eq('id', params.userId)
    .maybeSingle()

  if (!profile) notFound()

  // Resolve session user's public.users.id by email (auth.users.id ≠ public.users.id).
  let selfId: string | null = null
  if (authUser?.email) {
    const { data: selfRow } = await adminClient
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .maybeSingle()
    selfId = selfRow?.id ?? null
  }
  const isSelf = selfId !== null && selfId === profile.id

  // Post count comes from the shared source of truth (lib/community/postCount)
  // so Profile and the Home scoreboard can't drift on the same number.
  const [postCount, badgesResult, lessonsResult] = await Promise.all([
    countUserPosts(adminClient, profile.id),
    adminClient
      .from('member_badges')
      .select('pillar_number')
      .eq('user_id', profile.id),
    adminClient
      .from('lesson_progress')
      .select('lesson_id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null),
  ])

  const stats = {
    posts: postCount,
    badges: (badgesResult.data ?? []).map(b => b.pillar_number),
    lessons: lessonsResult.count ?? 0,
  }

  if (isSelf && searchParams?.edit === '1' && authUser?.email) {
    const editProfile = {
      display_name: profile.display_name,
      full_name: profile.full_name,
      bio: profile.bio,
      role_title: profile.role_title,
      location: profile.location,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      company: profile.company,
      linkedin_url: profile.linkedin_url,
      website_url: profile.website_url,
      twitter_handle: profile.twitter_handle,
      phone: profile.phone,
      phone_visible: profile.phone_visible ?? false,
      current_pillar: profile.current_pillar,
      goal_90day: profile.goal_90day,
      goal_visible: profile.goal_visible ?? true,
    }
    return (
      <div style={{ backgroundColor: '#0A0F18', minHeight: '100%', padding: '32px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                fontSize: '28px',
                color: '#F5F0E8',
                margin: 0,
              }}
            >
              Edit Profile
            </h1>
            <a
              href={`/profile/${profile.id}`}
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#7a8a96',
                textDecoration: 'none',
              }}
            >
              ← Back to profile
            </a>
          </div>
          <ProfileEditForm userId={profile.id} userEmail={authUser.email} profile={editProfile} />
        </div>
      </div>
    )
  }

  return <ProfileView profile={profile} stats={stats} isSelf={isSelf} />
}
