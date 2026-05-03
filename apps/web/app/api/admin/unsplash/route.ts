export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function GET(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

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
