export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 180

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { XaiImageError, safeErrorMessage } from '@/lib/art/xaiImages'
import {
  acceptHeroOption,
  generateHeroOptions,
  persistDraftHero,
} from '@/lib/media/generateHero'
import { HERO_KEY_MISSING_MESSAGE } from '@/lib/media/heroPublishGuard'

function isMissingKey(err: unknown): boolean {
  return err instanceof Error && err.message === HERO_KEY_MISSING_MESSAGE
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown> = {}
  try {
    const text = await request.text()
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: story, error } = await adminClient
    .from('media_stories')
    .select('id, slug, title, excerpt, seo_description')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  const brief = {
    id: story.id,
    slug: story.slug,
    title: story.title,
    excerpt: story.excerpt,
    dek: story.seo_description,
  }

  try {
    if (typeof body.acceptUrl === 'string' && body.acceptUrl.trim()) {
      const accepted = await acceptHeroOption(story, body.acceptUrl.trim())
      return NextResponse.json(accepted)
    }

    if (body.count === 2 || body.count === 3) {
      const options = await generateHeroOptions(brief, body.count)
      return NextResponse.json({ options })
    }

    const proposed = await persistDraftHero(brief, { replace: true })
    return NextResponse.json({
      featured_image_url: proposed.featuredUrl,
      options: [],
    })
  } catch (err) {
    const message = isMissingKey(err) ? HERO_KEY_MISSING_MESSAGE : safeErrorMessage(err)
    console.error('[media-hero] request failed:', message)
    if (isMissingKey(err)) {
      return NextResponse.json({ error: message }, { status: 422 })
    }
    const status = err instanceof XaiImageError && err.status === 404 ? 422 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
