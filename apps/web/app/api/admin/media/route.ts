import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import type { TablesInsert } from '@evolved-pros/db'
import { notifyMediaPublished } from '@/lib/notifications/fanout'
import { publishHeroGate } from '@/lib/media/heroReachable'
import { mediaStoryWriteFailure } from '@/lib/media/mediaStoryWrite'
import { stripLeadingTitle } from '@/lib/media/storyBody'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const { data, error } = await adminClient
    .from('media_stories')
    .select('id, title, slug, pillar, story_type, is_published, is_featured, published_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    title, slug, excerpt, body: articleBody, pillar, tags, story_type,
    source_url, source_name, featured_image_url, author, seo_title,
    seo_description, is_featured, is_published,
  } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 422 })
  }

  const featuredImage = typeof featured_image_url === 'string' && featured_image_url.trim()
    ? featured_image_url.trim()
    : null
  const publishing = is_published === true
  if (publishing) {
    const decision = await publishHeroGate({
      isPublished: true,
      featuredImageUrl: featuredImage,
    })
    if (!decision.allow) {
      return NextResponse.json({ error: decision.error }, { status: 422 })
    }
  }

  const storedBody = typeof articleBody === 'string' && typeof title === 'string'
    ? stripLeadingTitle(articleBody, title)
    : articleBody

  const row = {
    title, slug, excerpt, body: storedBody, pillar, story_type,
    source_url: source_url || null,
    source_name: source_name || null,
    featured_image_url: featuredImage,
    author: author || 'George Leith',
    seo_title: seo_title || null,
    seo_description: seo_description || null,
    tags: Array.isArray(tags) ? tags : [],
    is_featured: is_featured ?? false,
    is_published: publishing,
    published_at: publishing ? new Date().toISOString() : null,
  }

  const { data, error } = await adminClient
    .from('media_stories')
    .insert(row as TablesInsert<'media_stories'>)
    .select()
    .single()

  if (error) {
    const failure = mediaStoryWriteFailure(error)
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
  if (data.is_published) {
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
