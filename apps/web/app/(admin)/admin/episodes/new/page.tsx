import { adminClient } from '@/lib/supabase/admin'
import { EpisodeForm } from '../EpisodeForm'

export const dynamic = 'force-dynamic'

export default async function NewEpisodePage() {
  // Default the next episode number to max(episode_number) + 1.
  const { data: top } = await adminClient
    .from('episodes')
    .select('episode_number')
    .order('episode_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNumber =
    top?.episode_number != null ? String(top.episode_number + 1) : '1'

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">New Episode</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          Create a new episode entry
        </p>
      </div>
      <EpisodeForm initialValues={{ episodeNumber: nextNumber }} />
    </div>
  )
}
