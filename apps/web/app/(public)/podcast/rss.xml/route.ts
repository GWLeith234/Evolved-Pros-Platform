import {
  SITE_URL,
  SERIES_NAME,
  getPublishedEpisodes,
  ytThumb,
  summaryText,
  episodeUrl,
  isoDuration,
  type PublicEpisode,
} from '@/lib/podcast/public'

export const dynamic = 'force-dynamic'

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

/** ISO-8601 (PT#H#M#S) → HH:MM:SS for itunes:duration. */
function hms(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

function item(ep: PublicEpisode): string {
  const url = episodeUrl(ep.slug)
  const summary = summaryText(ep) || ep.title
  const image = ytThumb(ep.youtube_id, 'max')
  const duration = hms(ep.duration_seconds)
  return `    <item>
      <title>${esc(ep.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(ep.published_at)}</pubDate>
      <description>${esc(summary)}</description>
      <itunes:summary>${esc(summary)}</itunes:summary>
      <itunes:author>${esc(AUTHOR)}</itunes:author>
      <itunes:explicit>false</itunes:explicit>
${ep.episode_number != null ? `      <itunes:episode>${ep.episode_number}</itunes:episode>\n` : ''}${duration ? `      <itunes:duration>${duration}</itunes:duration>\n` : ''}${image ? `      <itunes:image href="${esc(image)}"/>\n` : ''}    </item>`
}

export async function GET() {
  const episodes = await getPublishedEpisodes()
  const feedUrl = `${SITE_URL}/podcast/rss.xml`
  const channelImage = ytThumb(episodes.find(e => e.youtube_id)?.youtube_id ?? null, 'max')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${channelImage ? `    <itunes:image href="${esc(channelImage)}"/>\n` : ''}${episodes.map(item).join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
