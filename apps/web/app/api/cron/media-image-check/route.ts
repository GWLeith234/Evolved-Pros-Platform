import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { authorizeCronBearer } from '@/lib/cron/authorize'
import { checkPublishedStoryImages } from '@/lib/media/mediaImageCheck'

export const dynamic = 'force-dynamic'

/**
 * Standing check for live media stories. Redirects are skipped (they render
 * no page). HTTP 500 when any checked story's hero does not load or its
 * og:image is the default logo, so the GitHub Actions job goes red.
 *
 * Auth: Bearer CRON_SECRET. The workflow also needs the APP_URL secret to
 * reach this route. Supabase reads use the app's existing
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
export async function GET(request: Request) {
  const gate = authorizeCronBearer(request.headers.get('authorization'), process.env.CRON_SECRET)
  if (!gate.ok) {
    if (gate.status === 500) console.error('[cron/media-image-check] CRON_SECRET is not set')
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { data, error } = await adminClient
    .from('media_stories')
    .select('id, slug, pillar, title, featured_image_url')
    .eq('is_published', true)
    .neq('story_type', 'redirect')
    .lte('published_at', new Date().toISOString())

  if (error) {
    console.error('[cron/media-image-check] query failed', error.code ?? 'unknown')
    return NextResponse.json({ ok: false, checked: 0, failures: [] }, { status: 500 })
  }

  const result = await checkPublishedStoryImages({
    stories: (data ?? []).map((row) => ({
      slug: row.slug,
      title: row.title,
      pillar: row.pillar,
      featured_image_url: row.featured_image_url,
    })),
    origin: new URL(request.url).origin,
  })

  if (!result.ok) {
    console.error(
      '[cron/media-image-check] failures',
      result.failures.map((failure) => failure.slug).join(','),
    )
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
