'use client'

import { useState } from 'react'

// Click-to-load YouTube facade: renders only the thumbnail + a play button
// until clicked, so the ~1 MB YouTube iframe never blocks first paint and the
// transcript (the SEO body) renders fast. Loads the real iframe on click.
//
// Poster priority: optional branded/episode posterUrl → maxresdefault →
// hqdefault (onError). Without a loadable image the button still works on
// the dark fallback — CSP must allow i.ytimg.com (see next.config.mjs).
export function YouTubeFacade({
  youtubeId,
  title,
  posterUrl,
}: {
  youtubeId: string
  title: string
  /** Episode thumbnail_url / guest art — preferred over YouTube CDN. */
  posterUrl?: string | null
}) {
  const [active, setActive] = useState(false)
  const ytMax = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`
  const ytHq = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
  const [thumb, setThumb] = useState(posterUrl?.trim() || ytMax)

  if (active) {
    return (
      <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9', background: '#000' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          className="h-full w-full"
          style={{ border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play video: ${title}`}
      className="group relative block w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: '16 / 9', background: '#0A0F18', border: 0, cursor: 'pointer', padding: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
        loading="eager"
        decoding="async"
        onError={() => {
          // Cascade: custom poster → maxres → hq → leave dark fallback.
          if (thumb === posterUrl?.trim()) setThumb(ytMax)
          else if (thumb === ytMax) setThumb(ytHq)
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, rgba(10,15,24,0.05), rgba(10,15,24,0.35))' }}
      >
        <span
          className="flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
          style={{ width: 72, height: 72, background: '#ef0e30', boxShadow: '0 8px 30px rgba(239,14,48,0.4)' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  )
}
