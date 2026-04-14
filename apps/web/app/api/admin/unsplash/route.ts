export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Admin auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 422 })

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.warn('[unsplash] UNSPLASH_ACCESS_KEY not set')
    return NextResponse.json({ photos: [] })
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[unsplash] API error:', res.status, text)
      return NextResponse.json({ photos: [] })
    }

    const data = await res.json()
    const photos = (data.results ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      url: (p.urls as Record<string, string>)?.regular,
      thumb: (p.urls as Record<string, string>)?.thumb,
      credit: (p.user as Record<string, string>)?.name ?? 'Unsplash',
      link: (p.links as Record<string, string>)?.html,
    }))

    return NextResponse.json({ photos })
  } catch (err) {
    console.error('[unsplash] Fetch error:', err)
    return NextResponse.json({ photos: [] })
  }
}
