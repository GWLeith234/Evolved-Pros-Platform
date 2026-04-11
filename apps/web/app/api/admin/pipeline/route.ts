import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdminApi, getEngagementLevel, getEngagementScore } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export type PipelineStage = 'awareness' | 'engaged' | 'upgrade_ready' | 'closed'

export interface PipelineMember {
  id: string
  displayName: string | null
  fullName: string | null
  avatarUrl: string | null
  tier: string | null
  tierStatus: string | null
  engagementLevel: string
  engagementScore: number
  postsLast30: number
  lessonsLast30: number
  stage: PipelineStage
  stageNote: string
  estimatedValue: number
  joinedAt: string
  overridden: boolean
}

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const supabase = createClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Fetch all community members
  const { data: members } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, tier, tier_status, created_at, vendasta_contact_id')
    .neq('role', 'admin')
    .in('tier_status', ['active', 'trial'])

  const memberList = members ?? []
  if (memberList.length === 0) {
    return NextResponse.json({ awareness: [], engaged: [], upgrade_ready: [], closed: [] })
  }

  const userIds = memberList.map(m => m.id)

  // Fetch activity + overrides + lesson progress for pillar 4 check + recent pro upgrades in parallel
  const [postsData, lessonsData, pillar4Data, overridesData, recentProData] = await Promise.all([
    supabase.from('posts').select('author_id').in('author_id', userIds).gte('created_at', thirtyDaysAgo),
    supabase.from('lesson_progress').select('user_id').in('user_id', userIds).gte('updated_at', thirtyDaysAgo).not('completed_at', 'is', null),
    // Check pillar 4 completion — courses with pillar_number = 4
    supabase.from('lesson_progress')
      .select('user_id, lessons(course_id, courses(pillar_number))')
      .in('user_id', userIds)
      .not('completed_at', 'is', null),
    supabase.from('pipeline_stage_overrides').select('user_id, stage, note').in('user_id', userIds),
    // Members who upgraded to pro this month
    supabase.from('users').select('id').eq('tier', 'pro').eq('tier_status', 'active').gte('updated_at', monthStart).in('id', userIds),
  ])

  const postCounts: Record<string, number>   = {}
  const lessonCounts: Record<string, number> = {}
  for (const p of postsData.data ?? [])  postCounts[p.author_id]  = (postCounts[p.author_id]  ?? 0) + 1
  for (const l of lessonsData.data ?? []) lessonCounts[l.user_id] = (lessonCounts[l.user_id]  ?? 0) + 1

  // Build set of users who have completed pillar 4
  const pillar4Users = new Set<string>()
  for (const lp of pillar4Data.data ?? []) {
    const lesson = lp.lessons as { course_id: string; courses: { pillar_number: number } | null } | null
    if (lesson?.courses?.pillar_number === 4) {
      pillar4Users.add(lp.user_id)
    }
  }

  const overrides: Record<string, { stage: PipelineStage; note: string }> = {}
  for (const ov of overridesData.data ?? []) {
    overrides[ov.user_id] = { stage: ov.stage as PipelineStage, note: ov.note ?? '' }
  }

  const recentProIds = new Set((recentProData.data ?? []).map(u => u.id))

  const result: Record<PipelineStage, PipelineMember[]> = {
    awareness:     [],
    engaged:       [],
    upgrade_ready: [],
    closed:        [],
  }

  for (const m of memberList) {
    const postsLast30   = postCounts[m.id]   ?? 0
    const lessonsLast30 = lessonCounts[m.id] ?? 0
    const engLevel      = getEngagementLevel(postsLast30, lessonsLast30)
    const engScore      = getEngagementScore(postsLast30, lessonsLast30)

    let stage: PipelineStage
    let stageNote: string
    let estimatedValue: number

    if (overrides[m.id]) {
      stage      = overrides[m.id].stage
      stageNote  = overrides[m.id].note
      estimatedValue = stage === 'upgrade_ready' || stage === 'closed' ? 249 * 12 : 79 * 12
    } else if (recentProIds.has(m.id)) {
      stage          = 'closed'
      stageNote      = 'Upgraded to Pro'
      estimatedValue = 249 * 12
    } else if (pillar4Users.has(m.id) && m.tier === 'vip') {
      stage          = 'upgrade_ready'
      stageNote      = 'Hit P4 · ready for Pro'
      estimatedValue = 249 * 12
    } else if (m.tier === 'vip' && (engLevel === 'Med' || engLevel === 'High')) {
      stage          = 'engaged'
      stageNote      = 'VIP · Active'
      estimatedValue = 79 * 12
    } else {
      stage          = 'awareness'
      stageNote      = 'Low activity'
      estimatedValue = 0
    }

    result[stage].push({
      id:              m.id,
      displayName:     m.display_name,
      fullName:        m.full_name,
      avatarUrl:       m.avatar_url,
      tier:            m.tier,
      tierStatus:      m.tier_status,
      engagementLevel: engLevel,
      engagementScore: engScore,
      postsLast30,
      lessonsLast30,
      stage,
      stageNote,
      estimatedValue,
      joinedAt:        m.created_at,
      overridden:      !!overrides[m.id],
    })
  }

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, stage, note } = body
  const validStages = ['awareness', 'engaged', 'upgrade_ready', 'closed']
  if (typeof userId !== 'string' || !validStages.includes(stage as string)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 422 })
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('pipeline_stage_overrides')
    .upsert({
      user_id:    userId,
      stage:      stage as string,
      note:       typeof note === 'string' ? note : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
