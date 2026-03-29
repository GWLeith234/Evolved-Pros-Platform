import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { EpisodePlayer } from '@/components/podcast/EpisodePlayer'
import { TranscriptSection } from '@/components/podcast/TranscriptSection'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const { data } = await adminClient
    .from('episodes')
    .select('title')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()
  return {
    title: data?.title ? `${data.title} — Evolved Pros Podcast` : 'Evolved Pros Podcast',
  }
}

interface Episode {
  id: string
  episode_number: number | null
  season: number | null
  title: string
  slug: string
  description: string | null
  guest_name: string | null
  guest_title: string | null
  guest_company: string | null
  mux_playback_id: string | null
  youtube_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  published_at: string | null
  transcript?: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Deterministic color from guest name
function guestAvatarColor(name: string): string {
  const colors = ['#1b3c5a', '#2a5a7c', '#1a4a6e', '#234d6b', '#0f3251']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default async function EpisodePage({ params }: Props) {
  // Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: episode } = await adminClient
    .from('episodes')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!episode) notFound()

  const ep = episode as Episode
  const duration = formatDuration(ep.duration_seconds)
  const date = formatDate(ep.published_at)

  const episodeLabel = [
    ep.episode_number != null ? `EP. ${ep.episode_number}` : null,
    ep.season != null ? `S${ep.season}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0d1c27', minHeight: '100%' }}>
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/podcast"
          className="inline-flex items-center gap-1.5 font-condensed font-semibold uppercase tracking-[0.14em] text-[11px] mb-6 transition-colors hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Back to Podcast
        </Link>

        {/* Video player */}
        <EpisodePlayer
          muxPlaybackId={ep.mux_playback_id}
          youtubeUrl={ep.youtube_url}
          title={ep.title}
        />

        {/* Two-column metadata */}
        <div className="flex flex-col md:flex-row gap-8 mt-8">
          {/* LEFT — episode info */}
          <div className="flex-1 min-w-0">
            {episodeLabel && (
              <p
                className="font-condensed font-bold uppercase tracking-[0.2em] text-[11px] mb-2"
                style={{ color: '#C9A84C' }}
              >
                {episodeLabel}
              </p>
            )}
            <h1
              className="font-display font-black leading-tight mb-3"
              style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'white' }}
            >
              {ep.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {date && (
                <span className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {date}
                </span>
              )}
              {duration && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {duration}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {ep.description && (
              <div>
                <p
                  className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] mb-2"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  About This Episode
                </p>
                <p
                  className="font-body text-[14px] leading-[1.8] whitespace-pre-wrap"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {ep.description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — guest card */}
          {ep.guest_name && (
            <div className="md:w-64 flex-shrink-0">
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: '#112535',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p
                  className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-4"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Featured Guest
                </p>

                {/* Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: guestAvatarColor(ep.guest_name) }}
                  >
                    <span
                      className="font-display font-black !text-white"
                      style={{ fontSize: '18px' }}
                    >
                      {getInitials(ep.guest_name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-bold text-[15px] text-white leading-snug">
                      {ep.guest_name}
                    </p>
                    {ep.guest_title && (
                      <p className="font-condensed text-[11px] mt-0.5" style={{ color: '#68a2b9' }}>
                        {ep.guest_title}
                      </p>
                    )}
                    {ep.guest_company && (
                      <p className="font-condensed text-[11px]" style={{ color: '#68a2b9', opacity: 0.75 }}>
                        {ep.guest_company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div className="mt-8">
          <TranscriptSection transcript={(ep as { transcript?: string | null }).transcript ?? null} />
        </div>
      </div>
    </main>
  )
}
