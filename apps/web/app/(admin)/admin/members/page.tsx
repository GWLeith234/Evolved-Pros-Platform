import { createClient } from '@/lib/supabase/server'
import { getEngagementLevel, getEngagementScore, getTierMrr } from '@/lib/admin/helpers'
import { MembersTable } from '@/components/admin/MembersTable'
import type { MemberRow } from '@/components/admin/MembersTable'

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  const supabase = createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, display_name, avatar_url, tier, tier_status, vendasta_contact_id, points, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .limit(200)

  const memberList = users ?? []
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const userIds = memberList.map(u => u.id)

  const [postsData, lessonsData] = await Promise.all([
    userIds.length > 0
      ? supabase.from('posts').select('author_id').in('author_id', userIds).gte('created_at', thirtyDaysAgo)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from('lesson_progress').select('user_id').in('user_id', userIds).gte('updated_at', thirtyDaysAgo).not('completed_at', 'is', null)
      : Promise.resolve({ data: [] }),
  ])

  const postCounts: Record<string, number>   = {}
  const lessonCounts: Record<string, number> = {}
  for (const p of postsData.data ?? [])   postCounts[p.author_id]  = (postCounts[p.author_id]  ?? 0) + 1
  for (const l of lessonsData.data ?? []) lessonCounts[l.user_id]  = (lessonCounts[l.user_id]  ?? 0) + 1

  const members: MemberRow[] = memberList.map(u => {
    const p30 = postCounts[u.id]   ?? 0
    const l30 = lessonCounts[u.id] ?? 0
    return {
      id:                u.id,
      email:             u.email,
      displayName:       u.display_name,
      fullName:          u.full_name,
      avatarUrl:         u.avatar_url,
      tier:              u.tier,
      tierStatus:        u.tier_status,
      vendastaContactId: u.vendasta_contact_id,
      points:            u.points,
      joinedAt:          u.created_at,
      mrr:               getTierMrr(u.tier, u.tier_status),
      engagementLevel:   getEngagementLevel(p30, l30),
      engagementScore:   getEngagementScore(p30, l30),
      postsLast30:       p30,
      lessonsLast30:     l30,
    }
  })

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Members</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          {members.length} total — search, filter, manage
        </p>
      </div>
      <MembersTable initialMembers={members} />
    </div>
  )
}
