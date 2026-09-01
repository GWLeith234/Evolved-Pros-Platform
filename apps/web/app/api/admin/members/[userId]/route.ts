import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi, getEngagementLevel, getEngagementScore, getTierMrr } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  // RLS-FIX: adminClient bypasses RLS so admins see canonical data.
  const [userResult, postsResult, progressResult] = await Promise.all([
    adminClient
      .from('users')
      .select('id, email, full_name, display_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, comp_promo_code_id, points, created_at, updated_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible')
      .eq('id', params.userId)
      .maybeSingle(),
    adminClient
      .from('posts')
      .select('id, body, created_at, channels(name, slug)')
      .eq('author_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(20),
    adminClient
      .from('lesson_progress')
      .select('lesson_id, completed_at, watch_time_seconds, updated_at, lessons(title, course_id, courses(title, pillar_number))')
      .eq('user_id', params.userId)
      .order('updated_at', { ascending: false }),
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
    isComped:          Boolean(user.comp_promo_code_id),
    tierExpiresAt:     user.tier_expires_at,
    points:            user.points,
    joinedAt:          user.created_at,
    lastActive:        user.updated_at,
    company:           user.company,
    linkedinUrl:       user.linkedin_url,
    websiteUrl:        user.website_url,
    twitterHandle:     user.twitter_handle,
    phone:             user.phone,
    phoneVisible:      user.phone_visible,
    currentPillar:     user.current_pillar,
    goal90day:         user.goal_90day,
    goalVisible:       user.goal_visible,
    mrr:               getTierMrr(user.tier, user.tier_status, Boolean(user.comp_promo_code_id)),
    engagementLevel:   getEngagementLevel(postsLast30, lessonsLast30),
    engagementScore:   getEngagementScore(postsLast30, lessonsLast30),
    postsLast30,
    lessonsLast30,
    recentPosts:       postsResult.data ?? [],
    lessonProgress:    progressResult.data ?? [],
  })
}
