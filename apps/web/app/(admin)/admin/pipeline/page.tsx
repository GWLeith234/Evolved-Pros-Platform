import { createClient } from '@/lib/supabase/server'
import { getEngagementLevel, getEngagementScore } from '@/lib/admin/helpers'
import { PipelineBoard } from '@/components/admin/PipelineBoard'
import type { PipelineMemberCard } from '@/components/admin/PipelineCard'

export const dynamic = 'force-dynamic'

type PipelineStage = 'awareness' | 'engaged' | 'upgrade_ready' | 'closed'

export default async function AdminPipelinePage() {
  const supabase = createClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: members } = await supabase
    .from('users')
    .select('id, display_name, full_name, tier, tier_status, created_at, updated_at')
    .neq('role', 'admin')
    .in('tier_status', ['active', 'trial'])

  const memberList = members ?? []
  if (memberList.length === 0) {
    return (
      <div className="px-8 py-6">
        <h1 className="font-display font-black text-[28px] text-[#112535] mb-2">Pipeline</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96]">No active members yet.</p>
      </div>
    )
  }

  const userIds = memberList.map(m => m.id)

  const [postsData, lessonsData, pillar4Data, overridesData] = await Promise.all([
    supabase.from('posts').select('author_id').in('author_id', userIds).gte('created_at', thirtyDaysAgo),
    supabase.from('lesson_progress').select('user_id').in('user_id', userIds).gte('updated_at', thirtyDaysAgo).not('completed_at', 'is', null),
    supabase
      .from('lesson_progress')
      .select('user_id, lessons(course_id, courses(pillar_number))')
      .in('user_id', userIds)
      .not('completed_at', 'is', null),
    supabase.from('pipeline_stage_overrides').select('user_id, stage, note').in('user_id', userIds),
  ])

  const postCounts: Record<string, number>   = {}
  const lessonCounts: Record<string, number> = {}
  for (const p of postsData.data ?? [])   postCounts[p.author_id]  = (postCounts[p.author_id]  ?? 0) + 1
  for (const l of lessonsData.data ?? []) lessonCounts[l.user_id]  = (lessonCounts[l.user_id]  ?? 0) + 1

  const pillar4Users = new Set<string>()
  for (const lp of pillar4Data.data ?? []) {
    const lesson = lp.lessons as { course_id: string; courses: { pillar_number: number } | null } | null
    if (lesson?.courses?.pillar_number === 4) pillar4Users.add(lp.user_id)
  }

  const overrides: Record<string, { stage: PipelineStage; note: string }> = {}
  for (const ov of overridesData.data ?? []) {
    overrides[ov.user_id] = { stage: ov.stage as PipelineStage, note: ov.note ?? '' }
  }

  // Recent pro upgrades (updated to pro this month)
  const recentProIds = new Set(
    memberList
      .filter(m => m.tier === 'pro' && m.tier_status === 'active' && m.updated_at >= monthStart)
      .map(m => m.id),
  )

  const result: Record<PipelineStage, PipelineMemberCard[]> = {
    awareness: [], engaged: [], upgrade_ready: [], closed: [],
  }

  for (const m of memberList) {
    const p30    = postCounts[m.id]   ?? 0
    const l30    = lessonCounts[m.id] ?? 0
    const engLvl = getEngagementLevel(p30, l30)

    let stage: PipelineStage
    let stageNote: string
    let estimatedValue: number

    if (overrides[m.id]) {
      stage          = overrides[m.id].stage
      stageNote      = overrides[m.id].note
      estimatedValue = stage === 'upgrade_ready' || stage === 'closed' ? 79 * 12 : 39 * 12
    } else if (recentProIds.has(m.id)) {
      stage = 'closed'; stageNote = 'Upgraded to Pro'; estimatedValue = 79 * 12
    } else if (pillar4Users.has(m.id) && m.tier === 'vip') {
      stage = 'upgrade_ready'; stageNote = 'Hit P4 · ready for Pro'; estimatedValue = 79 * 12
    } else if (m.tier === 'vip' && (engLvl === 'Med' || engLvl === 'High')) {
      stage = 'engaged'; stageNote = 'VIP · Active'; estimatedValue = 39 * 12
    } else {
      stage = 'awareness'; stageNote = 'Low activity'; estimatedValue = 0
    }

    result[stage].push({
      id:              m.id,
      displayName:     m.display_name,
      fullName:        m.full_name,
      tier:            m.tier,
      tierStatus:      m.tier_status,
      stage,
      stageNote,
      estimatedValue,
      engagementLevel: engLvl,
      overridden:      !!overrides[m.id],
    })
  }

  const totalValue = [
    ...result.upgrade_ready,
    ...result.closed,
  ].reduce((sum, m) => sum + m.estimatedValue, 0)

  return (
    <div className="px-8 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display font-black text-[28px] text-[#112535]">Pipeline</h1>
          <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
            Upgrade pipeline — drag cards to reclassify members
          </p>
        </div>
        <div className="text-right">
          <p className="font-condensed font-bold text-[10px] uppercase tracking-[0.16em] text-[#7a8a96]">Pipeline Value</p>
          <p className="font-display font-black text-[24px] text-[#c9a84c]">${totalValue.toLocaleString()}</p>
          <p className="font-condensed text-[10px] text-[#7a8a96]">upgrade ready + closed · annual</p>
        </div>
      </div>

      <PipelineBoard initialData={result} />
    </div>
  )
}
