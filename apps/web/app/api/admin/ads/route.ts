export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET() {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { data, error } = await supabase
    .from('platform_ads')
    .select('id, zone, sponsor_name, ad_type, image_url, click_url, headline, start_date, end_date, is_active, sort_order, created_at')
    .order('zone')
    .order('sort_order')

  if (error) return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  return NextResponse.json({ ads: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const zone = typeof body.zone === 'string' && ['A', 'B', 'C', 'D'].includes(body.zone)
    ? body.zone
    : 'A'
  const adType = typeof body.ad_type === 'string' && ['image', 'video', 'native'].includes(body.ad_type)
    ? body.ad_type
    : 'image'

  const { data, error } = await supabase
    .from('platform_ads')
    .insert({
      zone,
      ad_type: adType,
      sponsor_name: typeof body.sponsor_name === 'string' ? body.sponsor_name.trim() || null : null,
      image_url: typeof body.image_url === 'string' ? body.image_url.trim() || null : null,
      click_url: typeof body.click_url === 'string' ? body.click_url.trim() || null : null,
      headline: typeof body.headline === 'string' ? body.headline.trim() || null : null,
      start_date: typeof body.start_date === 'string' ? body.start_date || null : null,
      end_date: typeof body.end_date === 'string' ? body.end_date || null : null,
      is_active: body.is_active === true,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      // keep placement for backwards compatibility with sidebar ad query
      placement: zone === 'A' ? 'sidebar' : 'topnav',
    })
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed to create ad' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
