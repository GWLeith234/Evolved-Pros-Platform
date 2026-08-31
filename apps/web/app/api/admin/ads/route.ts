export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { data, error } = await adminClient
    .from('platform_ads')
    .select('id, zone, sponsor_name, ad_type, image_url, click_url, headline, body_copy, cta_text, start_date, end_date, is_active, sort_order, created_at')
    .order('zone')
    .order('sort_order')

  if (error) return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  return NextResponse.json({ ads: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi()
    if (auth instanceof Response) return auth

    let body: Record<string, unknown>
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const zone = typeof body.zone === 'string' && ['A', 'B', 'C', 'D', 'E'].includes(body.zone)
      ? body.zone
      : 'A'
    const adType = typeof body.ad_type === 'string' && ['image', 'video', 'native'].includes(body.ad_type)
      ? body.ad_type
      : 'image'

    // RLS-FIX: adminClient — platform_ads RLS admin-role check breaks for
    // users where auth.uid() ≠ public.users.id.
    const { data, error } = await adminClient
      .from('platform_ads')
      .insert({
        zone,
        ad_type: adType,
        title: typeof body.headline === 'string' ? body.headline.trim() || 'Ad' : 'Ad',
        sponsor_name: typeof body.sponsor_name === 'string' ? body.sponsor_name.trim() || null : null,
        image_url: typeof body.image_url === 'string' ? body.image_url.trim() || null : null,
        click_url: typeof body.click_url === 'string' ? body.click_url.trim() || null : null,
        headline: typeof body.headline === 'string' ? body.headline.trim() || null : null,
        body_copy: typeof body.body_copy === 'string' ? body.body_copy.trim() || null : null,
        cta_text: typeof body.cta_text === 'string' ? body.cta_text.trim() || null : null,
        start_date: typeof body.start_date === 'string' ? body.start_date || null : null,
        end_date: typeof body.end_date === 'string' ? body.end_date || null : null,
        is_active: body.is_active === true,
        sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
        // keep placement for backwards compatibility with sidebar ad query
        placement: zone === 'A' || zone === 'E' ? 'sidebar' : 'topnav',
        placements: Array.isArray(body.placements) ? body.placements : ['platform'],
      })
      .select()
      .single()

    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed to create ad' }, { status: 500 })
    const { revalidateTag } = await import('next/cache')
    const { CACHE_TAGS } = await import('@/lib/cache/shared')
    revalidateTag(CACHE_TAGS.platformAds)
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}
