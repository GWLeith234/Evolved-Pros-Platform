import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function FeaturedEpisode({ ep }: { ep: Episode }) {
  const duration = formatDuration(ep.duration_seconds)
  const desc = ep.description
    ? ep.description.length > 200
      ? ep.description.slice(0, 200).trimEnd() + '…'
      : ep.description
    : null

  return (
    <Link
      href={`/podcast/${ep.slug}`}
      className="group block rounded-xl overflow-hidden relative"
      style={{
        backgroundColor: '#112535',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: '320px',
      }}
    >
      {/* Background thumbnail */}
      {ep.thumbnail_url && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ep.thumbnail_url}
            alt={ep.title}
            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(13,28,39,0.97) 40%, rgba(13,28,39,0.6) 100%)' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between h-full" style={{ minHeight: '320px' }}>
        {/* Top: eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="font-condensed font-bold uppercase tracking-[0.22em] text-[9px] rounded px-2 py-0.5"
            style={{ backgroundColor: 'rgba(239,14,48,0.15)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.25)' }}
          >
            Latest Episode
          </span>
          {duration && (
            <span className="font-condensed text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {duration}
            </span>
          )}
        </div>

        {/* Middle: main content */}
        <div className="flex-1">
          {ep.episode_number != null && (
            <p
              className="font-display font-black leading-none mb-2"
              style={{ fontSize: '56px', color: '#C9A84C', opacity: 0.9, lineHeight: 1 }}
            >
              #{ep.episode_number}
            </p>
          )}
          <h2
            className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', color: 'white', maxWidth: '560px' }}
          >
            {ep.title}
          </h2>
          {ep.guest_name && (
            <p className="font-condensed font-semibold uppercase tracking-[0.14em] text-[12px] mb-4" style={{ color: '#68a2b9' }}>
              {ep.guest_name}
              {ep.guest_title && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · {ep.guest_title}</span>}
              {ep.guest_company && <span style={{ color: 'rgba(255,255,255,0.35)' }}>{ep.guest_title ? '' : ' · '}{ep.guest_company}</span>}
            </p>
          )}
          {desc && (
            <p className="font-body text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '500px' }}>
              {desc}
            </p>
          )}
        </div>

        {/* Bottom: CTA */}
        <div className="mt-8">
          <span
            className="inline-flex items-center gap-2 font-condensed font-bold uppercase tracking-[0.14em] text-[12px] rounded px-5 py-2.5 transition-all duration-150 group-hover:opacity-90"
            style={{ backgroundColor: '#ef0e30', color: 'white' }}
          >
            <PlayIcon />
            Watch Episode →
          </span>
        </div>
      </div>
    </Link>
  )
}

function EpisodeCard({ ep }: { ep: Episode }) {
  const duration = formatDuration(ep.duration_seconds)
  const date = formatDate(ep.published_at)

  return (
    <Link
      href={`/podcast/${ep.slug}`}
      className="group block rounded-lg overflow-hidden transition-all duration-150"
      style={{
        backgroundColor: '#112535',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      onMouseEnter={undefined}
    >
      {/* Thumbnail — 16:9 */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {ep.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ep.thumbnail_url}
            alt={ep.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-85"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: '#1b3c5a' }}
          >
            <span className="font-display font-black text-[40px]" style={{ color: 'rgba(255,255,255,0.08)' }}>
              {ep.episode_number ?? '?'}
            </span>
          </div>
        )}

        {/* Episode number badge — top left */}
        {ep.episode_number != null && (
          <span
            className="absolute top-2 left-2 font-display font-black text-[13px] leading-none px-1.5 py-0.5 rounded"
            style={{ color: '#C9A84C', backgroundColor: 'rgba(13,28,39,0.8)' }}
          >
            #{ep.episode_number}
          </span>
        )}

        {/* Duration badge — bottom right */}
        {duration && (
          <span
            className="absolute bottom-2 right-2 font-condensed font-bold text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.65)' }}
          >
            {duration}
          </span>
        )}

        {/* Play overlay on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#ef0e30' }}
          >
            <PlayIcon />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="font-body font-semibold text-[14px] leading-snug mb-1 line-clamp-2"
          style={{ color: 'white' }}
        >
          {ep.title}
        </h3>
        {ep.guest_name && (
          <p className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px] mb-1.5" style={{ color: '#68a2b9' }}>
            {ep.guest_name}
            {ep.guest_company && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {ep.guest_company}</span>}
          </p>
        )}
        {date && (
          <p className="font-condensed text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {date}
          </p>
        )}
      </div>
    </Link>
  )
}

export default async function PodcastPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await adminClient
    .from('episodes')
    .select('*')
    .eq('is_published', true)
    .order('episode_number', { ascending: false })

  const episodes: Episode[] = rows ?? []
  const featured = episodes[0] ?? null
  const rest = episodes.slice(1)

  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0d1c27', minHeight: '100%' }}>
      {/* Page header */}
      <div
        className="px-4 md:px-8 py-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-1" style={{ color: '#ef0e30' }}>
          Evolved Pros
        </p>
        <h1
          className="font-display font-black leading-tight"
          style={{ fontSize: '32px', color: 'white' }}
        >
          The Podcast
        </h1>
        <p className="font-body text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Real conversations with professionals who are evolving how they work, think, and lead.
        </p>
      </div>

      <div className="px-4 md:px-8 py-8 space-y-10">
        {episodes.length === 0 ? (
          <div
            className="rounded-xl px-8 py-16 text-center"
            style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-widest text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No episodes yet
            </p>
            <p className="font-body text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Check back soon — new episodes drop regularly.
            </p>
          </div>
        ) : (
          <>
            {/* Featured episode */}
            {featured && <FeaturedEpisode ep={featured} />}

            {/* Episode grid */}
            {rest.length > 0 && (
              <div>
                <p
                  className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-4"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  All Episodes
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(ep => (
                    <EpisodeCard key={ep.id} ep={ep} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
