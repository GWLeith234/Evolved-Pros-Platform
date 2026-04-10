import { NextResponse, NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const audience = request.nextUrl.searchParams.get('audience') ?? 'all'

  const supabase = createClient()
  let query = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('tier_status', ['active', 'trial'])
    .neq('role', 'admin')

  if (audience === 'vip') query = query.eq('tier', 'vip')
  if (audience === 'pro') query = query.eq('tier', 'pro')

  const { count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
