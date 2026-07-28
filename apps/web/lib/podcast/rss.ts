import 'server-only'
import {
  SITE_URL,
  SERIES_NAME,
  ytThumb,
  summaryText,
  episodeUrl,
  type PublicEpisode,
} from '@/lib/podcast/public'

// Shared RSS 2.0 + iTunes podcast feed builder. Rendered at both /feed.xml
// (the canonical feed URL) and /podcast/rss.xml (legacy alias, still linked
// from the podcast index JSON-LD). One builder so the two never drift.

const AUTHOR = 'George Leith'
const OWNER_EMAIL = 'support@evolvedpros.com'
const SERIES_DESCRIPTION =
  'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests.'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RSS pubDate must be RFC-822. */
function rfc822(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return (Number.isNaN(d.getTime()) ? new Date() : d).toUTCString()
}

/** seconds → HH:MM:SS for itunes:duration. */
function hms(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

/** Best-effort audio MIME from the file extension; default to audio/mpeg. */
function audioMime(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4'
  if (ext === 'aac') return 'audio/aac'
  if (ext === 'wav') return 'audio/wav'
  if (ext === 'ogg' || ext === 'oga') return 'audio/ogg'
  return 'audio/mpeg'
}

function item(ep: PublicEpisode): string {
  const url = episodeUrl(ep.slug)
  const summary = summaryText(ep) || ep.title
  const image = ytThumb(ep.youtube_id, 'max')
  const duration = hms(ep.duration_seconds)
  // Enclosure only when a real audio file exists (spec: "where an audio URL
  // exists"). length is unknown until the file is probed, so 0 per RSS spec.
  const enclosure = ep.audio_url
    ? `      <enclosure url="${esc(ep.audio_url)}" length="0" type="${audioMime(ep.audio_url)}"/>\n`
    : ''
  return `    <item>
      <title>${esc(ep.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(ep.published_at)}</pubDate>
      <description>${esc(summary)}</description>
      <itunes:summary>${esc(summary)}</itunes:summary>
      <itunes:author>${esc(AUTHOR)}</itunes:author>
      <itunes:explicit>false</itunes:explicit>
${enclosure}${ep.episode_number != null ? `      <itunes:episode>${ep.episode_number}</itunes:episode>\n` : ''}${duration ? `      <itunes:duration>${duration}</itunes:duration>\n` : ''}${image ? `      <itunes:image href="${esc(image)}"/>\n` : ''}    </item>`
}

/** Build the full feed XML. `feedUrl` is the absolute URL this feed is served
 *  at (used for atom:self). */
export function buildPodcastRssXml(episodes: PublicEpisode[], feedUrl: string): string {
  const channelImage = ytThumb(episodes.find(e => e.youtube_id)?.youtube_id ?? null, 'max')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SERIES_NAME)}</title>
    <link>${esc(`${SITE_URL}/podcast`)}</link>
    <atom:link href="${esc(feedUrl)}" rel="self" type="application/rss+xml"/>
    <description>${esc(SERIES_DESCRIPTION)}</description>
    <language>en-us</language>
    <itunes:author>${esc(AUTHOR)}</itunes:author>
    <itunes:summary>${esc(SERIES_DESCRIPTION)}</itunes:summary>
    <itunes:owner>
      <itunes:name>${esc(AUTHOR)}</itunes:name>
      <itunes:email>${esc(OWNER_EMAIL)}</itunes:email>
    </itunes:owner>
    <itunes:category text="Business">
      <itunes:category text="Marketing"/>
    </itunes:category>
    <itunes:category text="Technology"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${channelImage ? `    <itunes:image href="${esc(channelImage)}"/>\n` : ''}${episodes.map(item).join('\n')}
  </channel>
</rss>`
}

export const RSS_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
} as const
