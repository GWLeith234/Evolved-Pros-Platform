import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EpisodeForm } from '../../EpisodeForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: { episodeId: string }
}

export default async function EditEpisodePage({ params }: Props) {
  const supabase = createClient()

  const { data: ep } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', params.episodeId)
    .single()

  if (!ep) notFound()

  const initialValues = {
    title: ep.title ?? '',
    slug: ep.slug ?? '',
    episodeNumber: ep.episode_number != null ? String(ep.episode_number) : '',
    season: ep.season != null ? String(ep.season) : '1',
    description: ep.description ?? '',
    guestName: ep.guest_name ?? '',
    guestTitle: ep.guest_title ?? '',
    guestCompany: ep.guest_company ?? '',
    muxPlaybackId: ep.mux_playback_id ?? '',
    youtubeUrl: ep.youtube_url ?? '',
    thumbnailUrl: ep.thumbnail_url ?? '',
    durationSeconds: ep.duration_seconds != null ? String(ep.duration_seconds) : '',
    isPublished: ep.is_published ?? false,
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Edit Episode</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          {ep.title}
        </p>
      </div>
      <EpisodeForm initialValues={initialValues} episodeId={params.episodeId} />
    </div>
  )
}
