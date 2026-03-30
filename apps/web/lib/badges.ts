import type { SupabaseClient } from '@supabase/supabase-js'

export async function awardBadge(
  supabase: SupabaseClient,
  userId: string,
  pillarNumber: number,
  pillarName: string,
  score: number
) {
  return supabase.from('member_badges').upsert(
    {
      user_id: userId,
      pillar_number: pillarNumber,
      pillar_name: pillarName,
      score,
    },
    { onConflict: 'user_id,pillar_number' }
  )
}
