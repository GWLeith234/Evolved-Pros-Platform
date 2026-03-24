import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdminApi, getEngagementLevel, getEngagementScore, getTierMrr } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const supabase = createClient()

  const [userResult, postsResult, progressResult, webhooksResult] = await Promise.all([
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
    supabase
      .from('vendasta_webhooks')
      .select('id, event_type, vendasta_order_id, product_sku, processed_at, status, error_message')
      .eq('vendasta_contact_id', userResult.data?.vendasta_contact_id ?? '')
      .order('processed_at', { ascending: false })
      .limit(50),
  ])

  if (!userResult.data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const user = userResult.data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const postsLast30   = (postsResult.data ?? []).filter(p => p.created_at >= thirtyDaysAgo).length
  const lessonsLast30 = (progressResult.data ?? []).filter(p => p.updated_at >= thirtyDaysAgo && p.completed_at).length

  return NextResponse.json({
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
    engagementLevel:   getEngagementLevel(postsLast30, lessonsLast30),
    engagementScore:   getEngagementScore(postsLast30, lessonsLast30),
    postsLast30,
    lessonsLast30,
    recentPosts:       postsResult.data ?? [],
    lessonProgress:    progressResult.data ?? [],
    vendastaWebhooks:  webhooksResult.data ?? [],
  })
}
