import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdminApi, getEngagementLevel, getEngagementScore, getTierMrr } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const search  = searchParams.get('search') ?? ''
  const tier    = searchParams.get('tier') ?? ''
  const status  = searchParams.get('status') ?? ''
  const cursor  = searchParams.get('cursor') ?? ''
  const limit   = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  let query = supabase
    .from('users')
    .select('id, email, full_name, display_name, avatar_url, tier, tier_status, vendasta_contact_id, points, created_at', { count: 'exact' })
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (tier)   query = query.eq('tier', tier)
  if (status) query = query.eq('tier_status', status)
  if (cursor) query = query.lt('created_at', cursor)

  const { data: users, count, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })

  const memberList = users ?? []
  if (memberList.length === 0) {
    return NextResponse.json({ members: [], total: count ?? 0, nextCursor: null })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const userIds = memberList.map(u => u.id)

  // Fetch engagement data for these users in parallel
  const [postsData, lessonsData] = await Promise.all([
    supabase
      .from('posts')
      .select('author_id')
      .in('author_id', userIds)
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('lesson_progress')
      .select('user_id')
      .in('user_id', userIds)
      .gte('updated_at', thirtyDaysAgo)
      .not('completed_at', 'is', null),
  ])

  // Count per user
  const postCounts: Record<string, number>   = {}
  const lessonCounts: Record<string, number> = {}
  for (const p of postsData.data ?? [])  postCounts[p.author_id]   = (postCounts[p.author_id]   ?? 0) + 1
  for (const l of lessonsData.data ?? []) lessonCounts[l.user_id]  = (lessonCounts[l.user_id]   ?? 0) + 1

  const members = memberList.map(u => {
    const postsLast30   = postCounts[u.id]   ?? 0
    const lessonsLast30 = lessonCounts[u.id] ?? 0
    return {
      id:                 u.id,
      email:              u.email,
      displayName:        u.display_name,
      fullName:           u.full_name,
      avatarUrl:          u.avatar_url,
      tier:               u.tier,
      tierStatus:         u.tier_status,
      vendastaContactId:  u.vendasta_contact_id,
      points:             u.points,
      joinedAt:           u.created_at,
      mrr:                getTierMrr(u.tier, u.tier_status),
      engagementLevel:    getEngagementLevel(postsLast30, lessonsLast30),
      engagementScore:    getEngagementScore(postsLast30, lessonsLast30),
      postsLast30,
      lessonsLast30,
    }
  })

  const nextCursor = memberList.length === limit
    ? memberList[memberList.length - 1]?.created_at ?? null
    : null

  return NextResponse.json({ members, total: count ?? 0, nextCursor })
}
