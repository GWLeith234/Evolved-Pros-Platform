'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FIT_VIDEO_UNAVAILABLE } from '@/lib/fit/copy'
import { fitPreferPlayback } from '@/lib/fit/playback'

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

/**
 * Loads a 15 minute signed playback token, then mounts Mux Player.
 * The playback id arrives with the token. This component is not rendered
 * for members who fail the Fit gate.
 */
export function FitMuxPlayer({
  moveId,
  title,
  poster,
}: {
  moveId: string
  title: string
  /** Signed thumbnail. Shown before the player mounts and as its poster. */
  poster?: string | null
}) {
  const [playback, setPlayback] = useState<{
    token: string
    thumbnailToken: string | null
    playbackId: string
  } | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    fetch(`/api/fit/${encodeURIComponent(moveId)}/mux-token`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('token')
        const body = (await res.json()) as {
          token?: string
          thumbnailToken?: string | null
          playbackId?: string
        }
        if (!body.token || !body.playbackId) throw new Error('token')
        setPlayback({
          token: body.token,
          thumbnailToken: typeof body.thumbnailToken === 'string' ? body.thumbnailToken : null,
          playbackId: body.playbackId,
        })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setUnavailable(true)
      })
    return () => ac.abort()
  }, [moveId])

  if (unavailable) {
    return (
      <>
        <FitPoster poster={poster} />
        <p className="ep-fit-player-note">{FIT_VIDEO_UNAVAILABLE}</p>
      </>
    )
  }

  if (!playback) {
    return <FitPoster poster={poster} />
  }

  // Poster time lives in the thumbnail JWT. Mux Player rejects a separate
  // time prop when a thumbnail token is already set.
  const tokens = playback.thumbnailToken
    ? { playback: playback.token, thumbnail: playback.thumbnailToken }
    : { playback: playback.token }

  const preferPlayback = fitPreferPlayback(
    typeof navigator === 'undefined' ? '' : navigator.userAgent,
  )

  return (
    <MuxPlayer
      playbackId={playback.playbackId}
      tokens={tokens}
      poster={poster || undefined}
      streamType="on-demand"
      playsInline
      preload="metadata"
      {...(preferPlayback ? { preferPlayback } : {})}
      metadata={{ video_title: title }}
      style={{ width: '100%', aspectRatio: '16 / 9', display: 'block' }}
    />
  )
}

function FitPoster({ poster }: { poster?: string | null }) {
  if (!poster) return <span className="ep-fit-play" aria-hidden="true" />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="ep-fit-poster" src={poster} alt="" />
  )
}
