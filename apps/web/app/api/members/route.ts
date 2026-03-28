import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const tier = searchParams.get('tier') ?? ''
  const cursor = searchParams.get('cursor') ?? ''
  const limit = 20

  let query = supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, role_title, location, tier, points, created_at')
    .eq('tier_status', 'active')
    .order('points', { ascending: false })
    .limit(limit + 1)

  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,full_name.ilike.%${search}%,role_title.ilike.%${search}%`
    )
  }

  if (tier === 'pro' || tier === 'vip') {
    query = query.eq('tier', tier)
  }

  if (cursor) {
    query = query.lt('points', parseInt(cursor, 10))
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })

  const rows = data ?? []
  const hasMore = rows.length > limit
  const members = rows.slice(0, limit).map(u => ({
    id: u.id,
    displayName: u.display_name ?? u.full_name ?? 'Member',
    avatarUrl: u.avatar_url,
    roleTitle: u.role_title,
    location: u.location,
    tier: u.tier,
    points: u.points,
    created_at: u.created_at,
  }))

  return NextResponse.json({ members, hasMore })
}
