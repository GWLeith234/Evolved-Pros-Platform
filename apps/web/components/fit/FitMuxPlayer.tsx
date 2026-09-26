'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FIT_VIDEO_UNAVAILABLE } from '@/lib/fit/copy'

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

/**
 * Loads a 15 minute signed playback token, then mounts Mux Player.
 * The playback id arrives with the token. This component is not rendered
 * for members who fail the Fit gate.
 */
export function FitMuxPlayer({
  moveId,
  title,
}: {
  moveId: string
  title: string
}) {
  const [playback, setPlayback] = useState<{ token: string; playbackId: string } | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    fetch(`/api/fit/${encodeURIComponent(moveId)}/mux-token`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('token')
        const body = (await res.json()) as { token?: string; playbackId?: string }
        if (!body.token || !body.playbackId) throw new Error('token')
        setPlayback({ token: body.token, playbackId: body.playbackId })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setUnavailable(true)
      })
    return () => ac.abort()
  }, [moveId])

  if (unavailable) {
    return <p className="ep-fit-player-note">{FIT_VIDEO_UNAVAILABLE}</p>
  }

  if (!playback) {
    return <span className="ep-fit-play" aria-hidden="true" />
  }

  return (
    <MuxPlayer
      playbackId={playback.playbackId}
      tokens={{ playback: playback.token }}
      streamType="on-demand"
      metadata={{ video_title: title }}
      style={{ width: '100%', aspectRatio: '16 / 9' }}
    />
  )
}
