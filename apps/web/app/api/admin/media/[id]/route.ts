import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { notifyMediaPublished } from '@/lib/notifications/fanout'
import { featuredImageForPublish, publishGuardDecision } from '@/lib/media/heroPublishGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const { data, error } = await adminClient
    .from('media_stories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const publishing = body.is_published === true
  const { data: current } = publishing
    ? await adminClient
        .from('media_stories')
        .select('is_published, featured_image_url')
        .eq('id', params.id)
        .maybeSingle()
    : { data: null }

  if (publishing) {
    const featuredImageUrl = featuredImageForPublish({
      bodyHasImage: Object.prototype.hasOwnProperty.call(body, 'featured_image_url'),
      bodyImage: body.featured_image_url,
      currentImage: current?.featured_image_url,
    })
    const decision = publishGuardDecision({
      isPublished: true,
      featuredImageUrl,
    })
    if (!decision.allow) {
      return NextResponse.json({ error: decision.error }, { status: 422 })
    }
  }

  if (typeof body.featured_image_url === 'string') {
    body.featured_image_url = body.featured_image_url.trim() || null
  }

  // If publishing for the first time, set published_at
  if (publishing && !body.published_at) {
    body.published_at = new Date().toISOString()
  }

  const { data, error } = await adminClient
    .from('media_stories')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (publishing && current && !current.is_published && data.is_published) {
    void notifyMediaPublished({
      title: data.title,
      slug: data.slug,
      pillar: data.pillar,
    })
  }

  const hero = !data.is_published && !data.featured_image_url
    ? (await import('@/lib/media/generateHero')).queueDraftHero({
        id: data.id,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        dek: data.seo_description,
      })
    : undefined

  return NextResponse.json(hero ? { ...data, hero } : data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const { error } = await adminClient
    .from('media_stories')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
