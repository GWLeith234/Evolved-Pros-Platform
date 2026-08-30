export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export async function GET() {
  const supabase = createClient()
  const currentUser = await resolveCurrentUser(supabase)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: topUsersData } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, points')
    .order('points', { ascending: false })
    .limit(10)

  const topUsers = topUsersData ?? []

  const entries = topUsers.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    displayName: u.display_name ?? u.full_name ?? 'Member',
    avatarUrl: u.avatar_url,
    points: u.points,
    isCurrentUser: u.id === currentUser.id,
  }))

  // Current user rank (if not in top 10)
  let currentUserRank = entries.findIndex(e => e.isCurrentUser) + 1
  if (currentUserRank === 0) {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('points', currentUser.points ?? 0)
    currentUserRank = (count ?? 0) + 1

    // Append current user to entries if not already in top 10
    entries.push({
      rank: currentUserRank,
      userId: currentUser.id,
      displayName: currentUser.display_name ?? currentUser.full_name ?? 'Member',
      avatarUrl: currentUser.avatar_url,
      points: currentUser.points ?? 0,
      isCurrentUser: true,
    })
  }

  return NextResponse.json({ entries, currentUserRank })
}
