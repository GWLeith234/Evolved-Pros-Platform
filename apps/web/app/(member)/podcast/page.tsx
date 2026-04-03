import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Podcast — Evolved Pros' }

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
  guest_image_url: string | null
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

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
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
      className="group block rounded-xl overflow-hidden relative transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
      style={{ backgroundColor: '#0d1e2c', minHeight: '220px' }}
    >
      {/* Guest photo zone — right 52% */}
      <div
        className="absolute right-0 top-0 bottom-0"
        style={{ width: '52%', zIndex: 0 }}
      >
        {ep.guest_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ep.guest_image_url}
            alt={ep.guest_name ?? ''}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(160deg, #1a3040 0%, #0d1e2c 100%)' }}
          />
        )}
      </div>

      {/* Gradient fade overlay */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: 'linear-gradient(to right, #0d1e2c 0%, #0d1e2c 35%, rgba(13,30,44,0.85) 52%, rgba(13,30,44,0.25) 72%, rgba(13,30,44,0) 100%)',
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col"
        style={{ zIndex: 2, maxWidth: '58%', padding: '28px 32px', minHeight: '220px' }}
      >
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-5">
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

        {/* Main content */}
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
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', color: 'white' }}
          >
            {ep.title}
          </h2>

          {/* Guest line */}
          {ep.guest_name && (
            <p className="font-condensed font-semibold uppercase tracking-[0.14em] text-[12px] mb-4">
              <span style={{ color: 'white', fontWeight: 700 }}>{ep.guest_name}</span>
              {(ep.guest_title || ep.guest_company) && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}> | </span>
                  <span style={{ color: '#C9A84C' }}>
                    {ep.guest_title}
                    {ep.guest_title && ep.guest_company && ' · '}
                    {ep.guest_company}
                  </span>
                </>
              )}
            </p>
          )}

          {desc && (
            <p className="font-body text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '500px' }}>
              {desc}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8">
          <span
            className="inline-flex items-center gap-2 font-condensed font-bold uppercase tracking-[0.14em] text-[12px] rounded px-5 py-2.5 transition-colors duration-150 group-hover:bg-[#cc0a28]"
            style={{ backgroundColor: '#ef0e30', color: 'white' }}
          >
            <PlayIcon />
            Watch Episode →
          </span>
        </div>
      </div>

      {/* Guest name tag — bottom right */}
      {ep.guest_name && (
        <div className="absolute" style={{ bottom: '16px', right: '20px', zIndex: 3 }}>
          <p
            className="font-condensed font-bold text-[13px] leading-tight"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            {ep.guest_name}
          </p>
          {(ep.guest_title || ep.guest_company) && (
            <p className="font-condensed font-semibold text-[11px]" style={{ color: '#C9A84C' }}>
              {ep.guest_title}
              {ep.guest_title && ep.guest_company && ' | '}
              {ep.guest_company}
            </p>
          )}
        </div>
      )}
    </Link>
  )
}

function EpisodeCard({ ep }: { ep: Episode }) {
  const duration = formatDuration(ep.duration_seconds)
  const date = formatDate(ep.published_at)

  return (
    <Link
      href={`/podcast/${ep.slug}`}
      className="group block rounded-[10px] overflow-hidden relative transition-all duration-150 hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
      style={{
        backgroundColor: '#0d1e2c',
        border: '1px solid rgba(255,255,255,0.05)',
        height: '110px',
      }}
    >
      {/* Guest photo zone — right 35% */}
      <div
        className="absolute right-0 top-0 bottom-0"
        style={{ width: '35%', zIndex: 0 }}
      >
        {ep.guest_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ep.guest_image_url}
            alt={ep.guest_name ?? ''}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(160deg, #1a3040 0%, #0d1e2c 100%)' }}
          />
        )}
      </div>

      {/* Gradient fade overlay */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: 'linear-gradient(to right, #0d1e2c 0%, #0d1e2c 50%, rgba(13,30,44,0.8) 65%, rgba(13,30,44,0.15) 85%, rgba(13,30,44,0) 100%)',
        }}
      />

      {/* Content */}
      <div
        className="relative"
        style={{ zIndex: 2, maxWidth: '68%', padding: '16px 20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        {ep.episode_number != null && (
          <p
            className="font-display font-black text-[13px] leading-none mb-1"
            style={{ color: '#C9A84C' }}
          >
            #{ep.episode_number}
          </p>
        )}
        <h3
          className="font-body font-semibold text-[13px] leading-snug line-clamp-2 mb-1"
          style={{ color: 'white' }}
        >
          {ep.title}
        </h3>

        {/* Guest line */}
        {ep.guest_name && (
          <p className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px]">
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{ep.guest_name}</span>
            {(ep.guest_title || ep.guest_company) && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
                <span style={{ color: '#C9A84C' }}>
                  {ep.guest_title}
                  {ep.guest_title && ep.guest_company && ' · '}
                  {ep.guest_company}
                </span>
              </>
            )}
          </p>
        )}

        {!ep.guest_name && date && (
          <p className="font-condensed text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {date}
          </p>
        )}

        {duration && (
          <p className="font-condensed text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {duration}
          </p>
        )}
      </div>

      {/* Play button — vertically centered, right side */}
      <div
        className="absolute flex items-center justify-center"
        style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 group-hover:bg-[rgba(239,14,48,0.3)]"
          style={{ backgroundColor: 'rgba(239,14,48,0.15)', border: '1px solid rgba(239,14,48,0.3)' }}
        >
          <PlayIcon size={10} />
        </div>
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
      {/* Page header — parchment */}
      <div
        className="px-4 md:px-8 py-6"
        style={{ backgroundColor: '#F5F0E8', borderBottom: '1px solid rgba(27,42,74,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] mb-1" style={{ color: '#C9302A' }}>
          EVOLVED PROS
        </p>
        <h1
          className="font-display font-black leading-tight mb-1"
          style={{ fontSize: '32px', color: '#1B2A4A' }}
        >
          The Podcast
        </h1>
        <p className="font-body text-[14px]" style={{ color: '#6B7A8D', maxWidth: '540px' }}>
          Real conversations with professionals who are crushing it from the field, from the trenches, and in real life.
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

            {/* Episode list or coming-soon state */}
            {rest.length > 0 ? (
              <div>
                <p
                  className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-4"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  All Episodes
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rest.map(ep => (
                    <EpisodeCard key={ep.id} ep={ep} />
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl px-8 py-12 text-center"
                style={{ border: '1px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(239,14,48,0.1)', border: '1px solid rgba(239,14,48,0.2)' }}
                >
                  <PlayIcon />
                </div>
                <p
                  className="font-condensed font-bold uppercase tracking-[0.2em] text-[11px] mb-1"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  More episodes coming soon
                </p>
                <p
                  className="font-body text-[13px]"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  New conversations drop regularly — check back soon.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
