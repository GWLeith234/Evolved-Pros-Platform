export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function GET(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim() || 'professional business'

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ photos: [] })

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    )
    if (!res.ok) return NextResponse.json({ photos: [] })

    const data = await res.json()
    const photos = (data.results ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      url: (p.urls as Record<string, string>)?.regular,
      thumb: (p.urls as Record<string, string>)?.small,
      credit: (p.user as Record<string, string>)?.name ?? 'Unsplash',
      profileUrl: (p.user as Record<string, unknown>)?.links
        ? ((p.user as Record<string, unknown>).links as Record<string, string>)?.html
        : null,
    }))
    return NextResponse.json({ photos })
  } catch {
    return NextResponse.json({ photos: [] })
  }
}
