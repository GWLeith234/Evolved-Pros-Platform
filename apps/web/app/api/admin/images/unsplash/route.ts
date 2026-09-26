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
  // Accept both `query` (UI picker) and `q` (legacy singular route).
  const query =
    (searchParams.get('query') ?? searchParams.get('q') ?? '').trim() ||
    'professional business'

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ photos: [], results: [] })

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    )
    if (!res.ok) return NextResponse.json({ photos: [], results: [] })

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

    // Flat `photos` shape for components/ui/ImagePicker.
    const photos = results.map((p) => ({
      id: p.id,
      url: p.urls.regular,
      thumb: p.urls.small,
      credit: p.user.name,
      profileUrl: p.user.link || null,
    }))

    return NextResponse.json({ photos, results })
  } catch {
    return NextResponse.json({ photos: [], results: [] })
  }
}
