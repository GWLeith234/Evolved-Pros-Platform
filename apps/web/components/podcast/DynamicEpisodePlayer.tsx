'use client'

import dynamic from 'next/dynamic'

interface EpisodePlayerProps {
  muxPlaybackId: string | null
  youtubeUrl: string | null
  title: string
}

// Lazy-load the player so @mux/mux-player-react (≈200 kB) doesn't ship in
// the initial /podcast/[slug] bundle. ssr:false because the player relies
// on browser APIs (MediaSource, Web Audio, etc.).
const DynamicEpisodePlayerInner = dynamic<EpisodePlayerProps>(
  () => import('./EpisodePlayer').then(m => ({ default: m.EpisodePlayer })),
  {
    loading: () => (
      <div
        className="w-full rounded-xl overflow-hidden"
        style={{ backgroundColor: '#000', aspectRatio: '16/9' }}
        aria-label="Loading player"
      />
    ),
    ssr: false,
  },
)

export function DynamicEpisodePlayer(props: EpisodePlayerProps) {
  return <DynamicEpisodePlayerInner {...props} />
}
