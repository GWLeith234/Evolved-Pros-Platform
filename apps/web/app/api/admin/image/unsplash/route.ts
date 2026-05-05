export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

interface UnsplashUser {
  name?: string
  username?: string
  links?: { html?: string }
}

interface UnsplashPhoto {
  id: string
  urls?: { raw?: string; full?: string; regular?: string; small?: string; thumb?: string }
  user?: UnsplashUser
}

export async function GET(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') ?? searchParams.get('query') ?? '').trim()
  if (!query) return NextResponse.json({ results: [] })

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ results: [] })

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    )
    if (!res.ok) return NextResponse.json({ results: [] })

    const data = (await res.json()) as { results?: UnsplashPhoto[] }
    const results = (data.results ?? []).map((p) => ({
      id: p.id,
      urls: {
        regular: p.urls?.regular ?? '',
        small: p.urls?.small ?? '',
        thumb: p.urls?.thumb ?? '',
      },
      user: {
        name: p.user?.name ?? 'Unsplash',
        username: p.user?.username ?? '',
        link: p.user?.links?.html ?? '',
      },
    }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
