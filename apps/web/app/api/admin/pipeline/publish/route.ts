export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use adminClient + email to avoid two-UUID problem
  const { data: profile } = await adminClient
    .from('users')
    .select('id, role')
    .eq('email', user.email)
    .single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = typeof body.type === 'string' ? body.type : ''
  const content = body.content as Record<string, unknown> | undefined
  const pillar = typeof body.pillar === 'string' ? body.pillar : ''

  if (!type || !content) return NextResponse.json({ error: 'type and content required' }, { status: 422 })

  // Use the resolved profile.id as author_id
  const authorId = profile.id

  // Get general channel
  const { data: channel } = await adminClient
    .from('channels')
    .select('id')
    .ilike('name', '%general%')
    .limit(1)
    .maybeSingle()

  try {
    if (type === 'community') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminClient as any).from('posts').insert({
        author_id: authorId,
        channel_id: channel?.id ?? null,
        body: typeof content.body === 'string' ? content.body : String(content),
        like_count: 0,
        reply_count: 0,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, type: 'community' })
    }

    if (type === 'article') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminClient as any).from('media_stories').insert({
        title: content.title ?? 'Untitled',
        slug: content.slug ?? `article-${Date.now()}`,
        excerpt: content.metaDescription ?? '',
        body: content.body ?? '',
        pillar: pillar || null,
        seo_description: content.metaDescription ?? '',
        story_type: 'original',
        author: 'George Leith',
        is_published: false,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, type: 'article' })
    }

    if (type === 'social') {
      return NextResponse.json({ ok: true, type: 'social', message: 'Copy to clipboard' })
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 422 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
