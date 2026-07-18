import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { YouTubeFacade } from '@/components/podcast/public/YouTubeFacade'
import {
  SITE_URL,
  SERIES_NAME,
  getEpisodeBySlug,
  getPublishedEpisodes,
  relatedEpisodes,
  episodeUrl,
  ytThumb,
  summaryText,
  transcriptParagraphs,
  hasSegments,
  isoDuration,
  formatDate,
  formatTimestamp,
  youtubeTimestampUrl,
  type PublicEpisode,
} from '@/lib/podcast/public'

// Public, server-rendered, indexable. The transcript is real DOM text in the
// SSR HTML (view-source shows it) — the whole point of the SEO sprint.
export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ep = await getEpisodeBySlug(params.slug)
  if (!ep) return { title: SERIES_NAME }
  const title = `${ep.title} — ${SERIES_NAME}`
  const description = summaryText(ep) || `${ep.title}${ep.guest_name ? ` with ${ep.guest_name}` : ''} on ${SERIES_NAME}.`
  const url = episodeUrl(ep.slug)
  const image = ytThumb(ep.youtube_id, 'max')
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SERIES_NAME,
      images: image ? [{ url: image, width: 1280, height: 720, alt: ep.title }] : undefined,
      publishedTime: ep.published_at ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

function jsonLd(ep: PublicEpisode) {
  const url = episodeUrl(ep.slug)
  const image = ytThumb(ep.youtube_id, 'max')
  const description = summaryText(ep)
  const duration = isoDuration(ep.duration_seconds)

  const podcastEpisode = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: ep.title,
    url,
    description,
    datePublished: ep.published_at ?? undefined,
    episodeNumber: ep.episode_number ?? undefined,
    duration,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: SERIES_NAME,
      url: `${SITE_URL}/podcast`,
    },
    ...(ep.youtube_id
      ? {
          associatedMedia: {
            '@type': 'MediaObject',
            contentUrl: `https://www.youtube.com/watch?v=${ep.youtube_id}`,
          },
        }
      : {}),
  }

  const video = ep.youtube_id
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: ep.title,
        description,
        thumbnailUrl: image ? [image] : undefined,
        uploadDate: ep.published_at ?? undefined,
        duration,
        embedUrl: `https://www.youtube-nocookie.com/embed/${ep.youtube_id}`,
        contentUrl: `https://www.youtube.com/watch?v=${ep.youtube_id}`,
        ...(ep.transcript_text && transcriptParagraphs(ep).length ? { transcript: ep.transcript_text } : {}),
      }
    : null

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Podcast', item: `${SITE_URL}/podcast` },
      { '@type': 'ListItem', position: 3, name: ep.title, item: url },
    ],
  }

  return [podcastEpisode, video, breadcrumb].filter(Boolean)
}

const IVORY = '#F5F0E8'
const DIM = 'rgba(245,240,232,0.55)'
const DIMMER = 'rgba(245,240,232,0.4)'

export default async function PublicEpisodePage({ params }: Props) {
  const ep = await getEpisodeBySlug(params.slug)
  if (!ep) notFound()

  const all = await getPublishedEpisodes()
  const related = relatedEpisodes(ep, all, 4)
  const paragraphs = transcriptParagraphs(ep)
  const segments = ep.transcript_segments
  const showSegments = hasSegments(ep)

  return (
    <div style={{ background: '#0A0F18', minHeight: '100%', color: IVORY }}>
      {/* JSON-LD: PodcastEpisode + VideoObject + BreadcrumbList */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(ep)) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 font-condensed text-[12px] uppercase tracking-[0.14em]" style={{ color: DIMMER }}>
          <Link href="/podcast" style={{ color: '#ef0e30', textDecoration: 'none' }}>Podcast</Link>
          <span aria-hidden> / </span>
          <span>{ep.episode_number != null ? `Ep ${String(ep.episode_number).padStart(3, '0')}` : 'Episode'}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="font-condensed text-[32px] font-bold leading-tight sm:text-[40px]" style={{ color: IVORY }}>
            {ep.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]" style={{ color: DIM }}>
            {ep.guest_name && <span style={{ color: IVORY }}>{ep.guest_name}</span>}
            {ep.published_at && <span>{formatDate(ep.published_at)}</span>}
            {ep.location && <span>· {ep.location}</span>}
          </p>
        </header>

        {/* Player */}
        {ep.youtube_id ? (
          <div className="mb-6">
            <YouTubeFacade youtubeId={ep.youtube_id} title={ep.title} />
          </div>
        ) : null}

        {/* Listen-on links */}
        {(ep.spotify_url || ep.apple_url || ep.youtube_id) && (
          <div className="mb-10 flex flex-wrap gap-3">
            {ep.youtube_id && (
              <ListenLink href={`https://www.youtube.com/watch?v=${ep.youtube_id}`} label="Watch on YouTube" />
            )}
            {ep.spotify_url && <ListenLink href={ep.spotify_url} label="Listen on Spotify" />}
            {ep.apple_url && <ListenLink href={ep.apple_url} label="Listen on Apple Podcasts" />}
          </div>
        )}

        {/* Summary */}
        {summaryText(ep) && (
          <p className="mb-10 text-[17px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.8)' }}>
            {summaryText(ep)}
          </p>
        )}

        {/* Chapters */}
        {ep.chapters.length > 0 && (
          <section className="mb-10" aria-labelledby="chapters-heading">
            <h2 id="chapters-heading" className="mb-4 font-condensed text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: '#ef0e30' }}>
              Chapters
            </h2>
            <ol className="space-y-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {ep.chapters.map((c, i) => {
                const yt = youtubeTimestampUrl(ep.youtube_id, c.ts)
                return (
                  <li key={i} className="flex gap-3 text-[15px]">
                    <a
                      href={yt ?? `#t-${c.ts}`}
                      className="shrink-0 font-condensed tabular-nums"
                      style={{ color: '#ef0e30', textDecoration: 'none', minWidth: 56 }}
                      {...(yt ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {formatTimestamp(c.ts)}
                    </a>
                    <span style={{ color: 'rgba(245,240,232,0.75)' }}>{c.title}</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* Pull-quotes */}
        {ep.pull_quotes.length > 0 && (
          <section className="mb-10" aria-labelledby="quotes-heading">
            <h2 id="quotes-heading" className="mb-4 font-condensed text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: '#ef0e30' }}>
              Highlights
            </h2>
            <div className="space-y-5">
              {ep.pull_quotes.map((qt, i) => (
                <blockquote
                  key={i}
                  className="rounded-lg p-5"
                  style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid #ef0e30' }}
                >
                  <p className="text-[18px] italic leading-snug" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', color: IVORY }}>
                    “{qt.text}”
                  </p>
                  {qt.speaker && (
                    <cite className="mt-2 block font-condensed text-[12px] uppercase not-italic tracking-[0.14em]" style={{ color: DIMMER }}>
                      {qt.speaker}
                    </cite>
                  )}
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Transcript */}
        <section className="mb-12" aria-labelledby="transcript-heading">
          <h2 id="transcript-heading" className="mb-4 font-condensed text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: '#ef0e30' }}>
            Transcript
          </h2>
          {showSegments ? (
            <div className="space-y-4">
              {segments.map((s, i) => {
                const yt = youtubeTimestampUrl(ep.youtube_id, s.ts)
                return (
                  <p key={i} id={`t-${s.ts}`} className="text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.82)' }}>
                    {s.speaker && <strong style={{ color: IVORY }}>{s.speaker}: </strong>}
                    {s.text}{' '}
                    {yt && (
                      <a href={yt} target="_blank" rel="noopener noreferrer" className="font-condensed text-[12px] tabular-nums" style={{ color: DIMMER, textDecoration: 'none' }}>
                        [{formatTimestamp(s.ts)}]
                      </a>
                    )}
                  </p>
                )
              })}
            </div>
          ) : paragraphs.length > 0 ? (
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[16px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.82)' }}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-[15px] italic" style={{ color: DIMMER }}>
              The full transcript for this episode is being finalized and will appear here shortly.
            </p>
          )}
        </section>

        {/* Guest block */}
        {ep.guest_name && ep.guest_bio && (
          <section className="mb-12 rounded-xl p-6" style={{ background: '#111926', border: '1px solid rgba(245,240,232,0.08)' }} aria-labelledby="guest-heading">
            <h2 id="guest-heading" className="font-condensed text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: '#ef0e30' }}>
              About {ep.guest_name}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: DIM }}>{ep.guest_bio}</p>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-4 font-condensed text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: '#ef0e30' }}>
              Related episodes
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {related.map(r => (
                <li key={r.slug}>
                  <Link href={`/podcast/${r.slug}`} className="flex gap-3 rounded-lg p-3 no-underline transition-colors" style={{ background: '#111926', border: '1px solid rgba(245,240,232,0.08)' }}>
                    {ytThumb(r.youtube_id, 'hq') && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ytThumb(r.youtube_id, 'hq')!} alt="" className="h-16 w-28 shrink-0 rounded object-cover" loading="lazy" />
                    )}
                    <span>
                      <span className="font-condensed text-[15px] font-bold leading-tight" style={{ color: IVORY }}>{r.title}</span>
                      {r.guest_name && <span className="mt-0.5 block text-[12px]" style={{ color: DIMMER }}>{r.guest_name}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function ListenLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg px-4 py-2 font-condensed text-[13px] font-bold uppercase tracking-[0.1em] no-underline transition-opacity hover:opacity-80"
      style={{ color: IVORY, border: '1px solid rgba(245,240,232,0.18)' }}
    >
      {label}
    </a>
  )
}
