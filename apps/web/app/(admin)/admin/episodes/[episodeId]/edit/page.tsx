import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { EpisodeForm, type Pillar } from '../../EpisodeForm'
import { GuestArtworkPanel } from '@/components/admin/GuestArtworkPanel'
import { dbRowToEpisode, type EpisodeRow } from '@/lib/podcast/transforms'

export const dynamic = 'force-dynamic'

interface Props {
  params: { episodeId: string }
}

export default async function EditEpisodePage({ params }: Props) {
  // RLS-FIX: adminClient — episodes RLS admin policy keys on users.id = auth.uid(),
  // which the codebase documents as mismatched. SSR client returns no row for
  // drafts (or any row, depending on policy match), causing a false 404. The
  // (admin) layout already gates this page on role = 'admin'.
  const { data: ep } = await adminClient
    .from('episodes')
    .select('*')
    .eq('id', params.episodeId)
    .single()

  if (!ep) notFound()

  // duration_seconds → mm:ss (or h:mm:ss) for the runtime field.
  const secs = ep.duration_seconds
  let duration = ''
  if (typeof secs === 'number' && Number.isFinite(secs)) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    duration = h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`
  }

  // Canonical pillar is the singular column; fall back to the legacy array's
  // first entry for any older rows that only populated `pillars`.
  const pillar = (ep.pillar ?? (Array.isArray(ep.pillars) ? ep.pillars[0] : null) ?? '') as Pillar | ''

  const initialValues = {
    title: ep.title ?? '',
    slug: ep.slug ?? '',
    episodeNumber: ep.episode_number != null ? String(ep.episode_number) : '',
    season: ep.season != null ? String(ep.season) : '1',
    description: ep.description ?? '',
    guestName: ep.guest_name ?? '',
    guestTitle: ep.guest_title ?? '',
    guestCompany: ep.guest_company ?? '',
    guestImageUrl: ep.guest_image_url ?? '',
    muxPlaybackId: ep.mux_playback_id ?? '',
    youtubeUrl: ep.youtube_url ?? '',
    audioUrl: ep.audio_url ?? '',
    thumbnailUrl: ep.thumbnail_url ?? '',
    duration,
    transcript: ep.transcript ?? '',
    showNotes: ep.show_notes ?? '',
    pillar,
    transistorEpisodeId: ep.transistor_episode_id ?? '',
    isMembersOnly: ep.is_members_only ?? false,
    isPublished: ep.is_published ?? false,
    pinned: ep.pinned ?? false,
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Edit Episode</h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          {ep.title}
        </p>
      </div>
      <EpisodeForm initialValues={initialValues} episodeId={params.episodeId} />

      {/* Guest Artwork Studio — restyle a reference photo into the house
          watercolour and publish it to guest_image_url. Preview reuses the
          real cover card (dbRowToEpisode built server-side to avoid a
          hydration mismatch from Date.now in the transform). */}
      <GuestArtworkPanel
        episodeId={params.episodeId}
        previewEpisode={dbRowToEpisode(ep as unknown as EpisodeRow)}
        initialGuestImageUrl={ep.guest_image_url ?? null}
      />
    </div>
  )
}
