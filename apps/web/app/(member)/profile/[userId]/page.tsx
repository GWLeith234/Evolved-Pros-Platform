import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { ProfileView } from '@/components/profile/ProfileView'

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const { data } = await adminClient
    .from('users')
    .select('display_name, full_name')
    .eq('id', params.userId)
    .maybeSingle()
  const name = data?.display_name ?? data?.full_name ?? 'Profile'
  return { title: `${name} — Evolved Pros` }
}

export default async function MemberProfilePage({ params }: { params: { userId: string } }) {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // params.userId IS public.users.id — query by id here.
  const { data: profile } = await adminClient
    .from('users')
    .select('id, display_name, full_name, avatar_url, bio, role_title, banner_url, points, created_at')
    .eq('id', params.userId)
    .maybeSingle()

  if (!profile) notFound()

  // Resolve session user's public.users.id by email to determine isSelf.
  // auth.users.id ≠ public.users.id — must use email lookup.
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

  const [postCountResult, badgesResult] = await Promise.all([
    adminClient
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id),
    adminClient
      .from('member_badges')
      .select('pillar_number')
      .eq('user_id', profile.id),
  ])

  const stats = {
    posts: postCountResult.count ?? 0,
    badges: (badgesResult.data ?? []).map(b => b.pillar_number),
  }

  return <ProfileView profile={profile} stats={stats} isSelf={isSelf} />
}
