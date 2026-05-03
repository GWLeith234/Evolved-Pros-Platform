'use client'

import MuxPlayer from '@mux/mux-player-react'

interface EpisodePlayerProps {
  muxPlaybackId: string | null
  youtubeUrl: string | null
  title: string
}

// Known test/placeholder video IDs that should never be shown to members
const BLOCKED_VIDEO_IDS = new Set([
  'dQw4w9WgXcQ', // Rick Astley — Never Gonna Give You Up (common test placeholder)
])

const YOUTUBE_HOSTS = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
])

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{8,15}$/

function extractYouTubeId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase()
  if (!YOUTUBE_HOSTS.has(host)) return null

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0]
    return id || null
  }

  // youtube.com/watch?v=<id>
  const v = parsed.searchParams.get('v')
  if (v) return v

  // youtube.com/embed/<id>, /shorts/<id>, /v/<id>, /live/<id>
  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const [first, second] = segments
    if (['embed', 'shorts', 'v', 'live'].includes(first)) return second
  }

  return null
}

function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null
  // Accept both protocol-qualified URLs and bare hostnames (admins often
  // paste "youtu.be/abc123" without the https://).
  const candidates = /^https?:\/\//i.test(url) ? [url] : [`https://${url}`, url]

  for (const candidate of candidates) {
    let parsed: URL
    try {
      parsed = new URL(candidate)
    } catch {
      continue
    }
    const id = extractYouTubeId(parsed)
    if (!id || !VIDEO_ID_RE.test(id)) continue
    if (BLOCKED_VIDEO_IDS.has(id)) return null
    return `https://www.youtube-nocookie.com/embed/${id}`
  }
  return null
}


export function EpisodePlayer({ muxPlaybackId, youtubeUrl, title }: EpisodePlayerProps) {
  if (muxPlaybackId) {
    return (
      <div className="w-full rounded-xl overflow-hidden" style={{ backgroundColor: '#000', aspectRatio: '16/9' }}>
        <MuxPlayer
          playbackId={muxPlaybackId}
          metadata={{ video_title: title }}
          streamType="on-demand"
          style={{ width: '100%', height: '100%' }}
          accentColor="#ef0e30"
        />
      </div>
    )
  }

  if (youtubeUrl) {
    const embedUrl = youtubeEmbedUrl(youtubeUrl)
    if (embedUrl) {
      return (
        <div className="w-full rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
  }

  // No media available
  return (
    <div
      className="w-full rounded-xl flex items-center justify-center"
      style={{ aspectRatio: '16/9', backgroundColor: '#112535', border: '1px dashed rgba(255,255,255,0.1)' }}
    >
      <p className="font-condensed font-bold uppercase tracking-widest text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Video coming soon
      </p>
    </div>
  )
}
