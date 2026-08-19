'use client'

import { useState } from 'react'
import type { PostMedia as PostMediaType } from '@/lib/community/media'

/**
 * The attached image on a post or comment card (SPRINT CM-1).
 *
 * Three things this has to get right:
 *  - No crop. object-fit:contain, so a 1080x1080 quote card shows whole.
 *  - No layout shift. Intrinsic width/height come from the DB (read
 *    server-side at upload), so the box is reserved before the bytes land.
 *  - No white letterbox in dark theme. The bars around a contained image are
 *    the frame background, which is a theme token — never a fixed light value.
 */

interface PostMediaProps {
  media: PostMediaType
  /** Accessible description. Falls back to a generic label. */
  alt?: string
  /** Comment cards get a shorter frame than stream cards. */
  maxHeight?: number
}

export function PostMedia({ media, alt, maxHeight = 560 }: PostMediaProps) {
  /* Bumping `attempt` re-mounts the <img> AND changes the src query so the
     browser refetches instead of serving the cached failure. */
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  if (media.kind !== 'image') return null

  const ratio =
    media.width && media.height && media.width > 0 && media.height > 0
      ? `${media.width} / ${media.height}`
      : undefined

  const src = attempt === 0 ? media.url : `${media.url}${media.url.includes('?') ? '&' : '?'}r=${attempt}`

  return (
    <div
      style={{
        marginTop: 14,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        aspectRatio: ratio,
        maxHeight,
        minHeight: ratio ? undefined : 160,
        background: 'var(--post-media-frame-bg)',
        border: '1px solid var(--post-media-frame-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {failed ? (
        /* A retry affordance, not a broken-image glyph. */
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p
            style={{
              margin: '0 0 10px',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 13,
              color: 'var(--post-media-fallback-text)',
            }}
          >
            This image didn&apos;t load.
          </p>
          <button
            type="button"
            onClick={() => { setFailed(false); setAttempt(a => a + 1) }}
            style={{
              minHeight: 40,
              padding: '8px 18px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: 'var(--attach-chip-text)',
              border: '1px solid var(--attach-chip-border)',
              borderRadius: 0,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        /* Plain <img>: dimensions can be null (a metadata read that failed, or
           a CM-2 video poster), and next/image needs both. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          src={src}
          alt={alt ?? 'Image attached to this post'}
          width={media.width ?? undefined}
          height={media.height ?? undefined}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}
