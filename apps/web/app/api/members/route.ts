/**
 * GET /api/members - the member directory payload (SPRINT Q1).
 *
 * Open to every signed-in member, in two shapes. The viewer's tier decides
 * WHICH COLUMNS ARE SELECTED, not which fields are rendered: a community or
 * VIP viewer's response never contains company, bio, goal_90day or a social
 * URL, because those were never fetched. Hiding them in the component would
 * leave them in this JSON, one devtools tab away.
 *
 * Reads `users` rather than the member_directory view: the view drops
 * tier_status, and the active filter below matters more than the convenience.
 * The redaction discipline is identical either way, since both are a SELECT.
 */

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { directoryDetail } from '@/lib/entitlements'
import { directorySearchTerm, directorySelect, shapeDirectory, type DirectoryRow } from '@/lib/community/directory'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // FAILS CLOSED: an unreadable tier resolves to community, which is the
  // public payload. Guessing generously here would hand the roster away.
  const detail = directoryDetail(
    (profile as unknown as { tier?: string | null }).tier,
    (profile as unknown as { tier_status?: string | null }).tier_status,
  )

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const tier = searchParams.get('tier') ?? ''
  const cursor = searchParams.get('cursor') ?? ''
  const limit = 20

  let query = adminClient
    .from('users')
    .select(directorySelect(detail))
    .eq('tier_status', 'active')
    .order('points', { ascending: false })
    .limit(limit + 1)

  const term = directorySearchTerm(search)
  if (term) {
    // Search spans display_name / full_name / role_title for everyone: a
    // community viewer may FIND somebody by surname without being SHOWN it.
    // The term is stripped of PostgREST filter syntax before interpolation.
    query = query.or(
      `display_name.ilike.%${term}%,full_name.ilike.%${term}%,role_title.ilike.%${term}%`,
    )
  }

  if (tier === 'pro' || tier === 'vip') {
    query = query.eq('tier', tier)
  }

  if (cursor) {
    const parsed = parseInt(cursor, 10)
    if (Number.isFinite(parsed)) query = query.lt('points', parsed)
  }

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/members]', error.code ?? 'unknown')
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as DirectoryRow[]
  const hasMore = rows.length > limit
  const members = shapeDirectory(rows.slice(0, limit), detail)

  // `detail` is echoed so the client knows whether to render a live Message
  // button, without re-deriving the tier rule in the browser.
  return NextResponse.json({ members, hasMore, detail })
}
