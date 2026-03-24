import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEngagementLevel, getEngagementScore, getTierMrr } from '@/lib/admin/helpers'
import { MemberDetailClient } from '@/components/admin/MemberDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { userId: string }
}

export default async function AdminMemberDetailPage({ params }: Props) {
  const supabase = createClient()

  const [userResult, postsResult, progressResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, full_name, display_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, vendasta_contact_id, points, created_at, updated_at')
      .eq('id', params.userId)
      .single(),
    supabase
      .from('posts')
      .select('id, body, created_at, channels(name, slug)')
      .eq('author_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, watch_time_seconds, updated_at, lessons(title, course_id, courses(title, pillar_number))')
      .eq('user_id', params.userId)
      .order('updated_at', { ascending: false }),
  ])

  if (!userResult.data) notFound()
  const user = userResult.data

  // Fetch Vendasta webhooks if contact linked
  const webhooksResult = user.vendasta_contact_id
    ? await supabase
        .from('vendasta_webhooks')
        .select('id, event_type, vendasta_order_id, product_sku, processed_at, status, error_message')
        .eq('vendasta_contact_id', user.vendasta_contact_id)
        .order('processed_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const p30 = (postsResult.data ?? []).filter(p => p.created_at >= thirtyDaysAgo).length
  const l30 = (progressResult.data ?? []).filter(p => p.updated_at >= thirtyDaysAgo && p.completed_at).length

  const member = {
    id:                user.id,
    email:             user.email,
    fullName:          user.full_name,
    displayName:       user.display_name,
    avatarUrl:         user.avatar_url,
    bio:               user.bio,
    roleTitle:         user.role_title,
    location:          user.location,
    tier:              user.tier,
    tierStatus:        user.tier_status,
    tierExpiresAt:     user.tier_expires_at,
    vendastaContactId: user.vendasta_contact_id,
    points:            user.points,
    joinedAt:          user.created_at,
    lastActive:        user.updated_at,
    mrr:               getTierMrr(user.tier, user.tier_status),
    engagementLevel:   getEngagementLevel(p30, l30),
    engagementScore:   getEngagementScore(p30, l30),
    postsLast30:       p30,
    lessonsLast30:     l30,
    recentPosts:       (postsResult.data ?? []) as Parameters<typeof MemberDetailClient>[0]['member']['recentPosts'],
    lessonProgress:    (progressResult.data ?? []) as Parameters<typeof MemberDetailClient>[0]['member']['lessonProgress'],
    vendastaWebhooks:  (webhooksResult.data ?? []) as Parameters<typeof MemberDetailClient>[0]['member']['vendastaWebhooks'],
  }

  const displayName = user.display_name ?? user.full_name ?? user.email

  return (
    <div>
      <div className="px-8 pt-6 pb-0">
        <Link
          href="/admin/members"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← All Members
        </Link>
        <h1 className="font-display font-black text-[28px] text-[#112535] mt-2">{displayName}</h1>
      </div>
      <MemberDetailClient member={member} />
    </div>
  )
}
