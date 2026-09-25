import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { buildPreviewToken, isPreviewSlug, previewStoryUrl } from '@/lib/media/previewToken'

export const dynamic = 'force-dynamic'

function devAdminBypass(): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const raw = cookies().get('dev_session')?.value
  if (!raw) return false
  try {
    return (JSON.parse(raw) as { role?: string }).role === 'admin'
  } catch {
    return false
  }
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!devAdminBypass()) {
    const check = await requireAdminApi()
    if (check instanceof Response) return check
  }

  const { data, error } = await adminClient
    .from('media_stories')
    .select('slug')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data?.slug) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }
  if (!isPreviewSlug(data.slug)) {
    return NextResponse.json({ error: 'Slug cannot be used in a preview link.' }, { status: 400 })
  }

  const token = buildPreviewToken({ kind: 'story', slug: data.slug })
  if (!token) {
    return NextResponse.json({ error: 'PREVIEW_TOKEN_SECRET is not set' }, { status: 500 })
  }

  return NextResponse.json(
    { url: previewStoryUrl(data.slug, token) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
