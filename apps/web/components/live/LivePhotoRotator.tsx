'use client'

import { useEffect, useState } from 'react'
import { ROTATOR_PHOTOS } from '@/lib/live/photo-rotator'

const FBC = 'Barlow Condensed, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

export function LivePhotoRotator() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ROTATOR_PHOTOS.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '21 / 9',
          background: '#0A0F18',
          border: '1px solid var(--border-soft2)',
          borderTop: '3px solid #C9A84C',
          overflow: 'hidden',
        }}
      >
        {ROTATOR_PHOTOS.map((p, i) => (
          <div
            key={p.src}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${p.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              opacity: i === idx ? 1 : 0,
              transition: 'opacity 1200ms ease',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 55%, rgba(10,15,24,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 32,
            bottom: 28,
            right: 32,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.42em',
                textTransform: 'uppercase',
                color: '#C9A84C',
              }}
            >
              On Stage
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: FP,
                fontWeight: 700,
                fontSize: 'clamp(24px, 3vw, 36px)',
                lineHeight: 1.1,
                color: '#fff',
              }}
            >
              {ROTATOR_PHOTOS[idx].caption}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {ROTATOR_PHOTOS.map((p, i) => (
              <button
                key={p.src}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 32 : 12,
                  height: 4,
                  background: i === idx ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 240ms ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
