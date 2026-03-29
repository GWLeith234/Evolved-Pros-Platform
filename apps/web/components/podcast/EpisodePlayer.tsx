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

function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // https://youtube.com/watch?v=ID or https://youtu.be/ID
    const id =
      parsed.searchParams.get('v') ??
      (parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : null)
    if (!id || BLOCKED_VIDEO_IDS.has(id)) return null
    return `https://www.youtube-nocookie.com/embed/${id}`
  } catch {
    return null
  }
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
