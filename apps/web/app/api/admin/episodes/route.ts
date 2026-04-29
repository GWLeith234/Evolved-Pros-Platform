export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { data, error } = await adminClient
    .from('episodes')
    .select('id, episode_number, season, title, slug, guest_name, guest_company, thumbnail_url, duration_seconds, is_published, published_at, created_at')
    .order('episode_number', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 })
  return NextResponse.json({ episodes: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })

  const slug = typeof body.slug === 'string' && body.slug.trim()
    ? body.slug.trim()
    : slugify(title)

  const isPublished = body.is_published === true
  const publishedAt = isPublished ? new Date().toISOString() : null

  // RLS-FIX: adminClient — episodes RLS admin-role check breaks for users
  // where auth.uid() ≠ public.users.id.
  const { data, error } = await adminClient
    .from('episodes')
    .insert({
      title,
      slug,
      episode_number: typeof body.episode_number === 'number' ? body.episode_number : null,
      season: typeof body.season === 'number' ? body.season : 1,
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      guest_name: typeof body.guest_name === 'string' ? body.guest_name.trim() || null : null,
      guest_title: typeof body.guest_title === 'string' ? body.guest_title.trim() || null : null,
      guest_company: typeof body.guest_company === 'string' ? body.guest_company.trim() || null : null,
      mux_playback_id: typeof body.mux_playback_id === 'string' ? body.mux_playback_id.trim() || null : null,
      youtube_url: typeof body.youtube_url === 'string' ? body.youtube_url.trim() || null : null,
      thumbnail_url: typeof body.thumbnail_url === 'string' ? body.thumbnail_url.trim() || null : null,
      duration_seconds: typeof body.duration_seconds === 'number' ? body.duration_seconds : null,
      transcript: typeof body.transcript === 'string' ? body.transcript.trim() || null : null,
      guest_image_url: typeof body.guest_image_url === 'string' ? body.guest_image_url.trim() || null : null,
      show_notes: typeof body.show_notes === 'string' ? body.show_notes.trim() || null : null,
      pillars: Array.isArray(body.pillars) ? body.pillars.filter((p): p is string => typeof p === 'string') : [],
      transistor_episode_id: typeof body.transistor_episode_id === 'string' ? body.transistor_episode_id.trim() || null : null,
      is_members_only: body.is_members_only === true,
      is_published: isPublished,
      published_at: publishedAt,
    })
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed to create episode' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
