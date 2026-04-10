import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'

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

  const row: Record<string, unknown> = {
    title, slug, excerpt, body: articleBody, pillar, story_type,
    source_url: source_url || null,
    source_name: source_name || null,
    featured_image_url: featured_image_url || null,
    author: author || 'George Leith',
    seo_title: seo_title || null,
    seo_description: seo_description || null,
    tags: Array.isArray(tags) ? tags : [],
    is_featured: is_featured ?? false,
    is_published: is_published ?? false,
    published_at: is_published ? new Date().toISOString() : null,
  }

  const { data, error } = await adminClient
    .from('media_stories')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
