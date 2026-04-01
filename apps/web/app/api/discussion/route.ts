export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const moduleNumber = searchParams.get('module_number')

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })

  // Fetch all posts for this course+module (top-level and replies together)
  let query = supabase
    .from('discussion_posts')
    .select('id, body, like_count, created_at, parent_id, user_id')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (moduleNumber) query = query.eq('module_number', Number(moduleNumber))

  const { data: allPosts, error: postsError } = await query
  if (postsError) {
    console.error('[GET /api/discussion]', postsError)
    return NextResponse.json({ error: postsError.message }, { status: 500 })
  }

  if (!allPosts?.length) return NextResponse.json({ posts: [] })

  // Fetch author info for all unique user_ids
  const userIds = [...new Set(allPosts.map(p => p.user_id))]
  const { data: authors } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  const authorMap = new Map((authors ?? []).map(a => [a.id, { display_name: a.display_name, avatar_url: a.avatar_url }]))

  // Separate top-level posts and replies
  const topLevel = allPosts.filter(p => !p.parent_id)
  const repliesAll = allPosts.filter(p => p.parent_id)

  const posts = topLevel.reverse().map(post => ({
    id: post.id,
    body: post.body,
    like_count: post.like_count ?? 0,
    created_at: post.created_at,
    author: authorMap.get(post.user_id) ?? { display_name: 'Member', avatar_url: null },
    replies: repliesAll
      .filter(r => r.parent_id === post.id)
      .map(r => ({
        id: r.id,
        body: r.body,
        like_count: r.like_count ?? 0,
        created_at: r.created_at,
        author: authorMap.get(r.user_id) ?? { display_name: 'Member', avatar_url: null },
      })),
  }))

  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const moduleNumber = typeof body.module_number === 'number' ? body.module_number : null
  const postBody = typeof body.body === 'string' ? body.body.trim() : ''
  const parentId = typeof body.parent_id === 'string' ? body.parent_id.trim() : null

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (!postBody) return NextResponse.json({ error: 'body is required' }, { status: 422 })

  const { data: inserted, error: insertError } = await supabase
    .from('discussion_posts')
    .insert({
      user_id: user.id,
      course_id: courseId,
      module_number: moduleNumber,
      body: postBody,
      parent_id: parentId,
      like_count: 0,
    })
    .select('id, body, like_count, created_at, parent_id, user_id')
    .single()

  if (insertError || !inserted) {
    console.error('[POST /api/discussion]', insertError)
    return NextResponse.json({ error: insertError?.message ?? 'Failed to post' }, { status: 500 })
  }

  // Fetch author for the response
  const { data: author } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    post: {
      id: inserted.id,
      body: inserted.body,
      like_count: inserted.like_count ?? 0,
      created_at: inserted.created_at,
      author: author ?? { display_name: 'Member', avatar_url: null },
    },
  }, { status: 201 })
}
