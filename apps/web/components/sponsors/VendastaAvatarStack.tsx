'use client'

/**
 * Vendasta AI workforce creative — four avatars from Supabase Branding
 * (Avatar 1–4). Falls back to numbered placeholders if a file is missing.
 */

import { useState } from 'react'
import { VENDASTA_ASSETS } from '@/lib/sponsors/partners'

const LABELS = ['AI SDR', 'AI SEO', 'AI Support', 'AI Ops'] as const

interface VendastaAvatarStackProps {
  size?: number
  className?: string
}

export function VendastaAvatarStack({ size = 48, className }: VendastaAvatarStackProps) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Vendasta AI workforce — four AI employees"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {VENDASTA_ASSETS.avatars.map((src, i) => (
        <AvatarFace
          key={src}
          src={src}
          index={i}
          size={size}
          label={LABELS[i] ?? `Avatar ${i + 1}`}
        />
      ))}
    </div>
  )
}

function AvatarFace({
  src,
  index,
  size,
  label,
}: {
  src: string
  index: number
  size: number
  label: string
}) {
  // Try .png first (canonical Supabase Branding/Avatar N.png), then .jpg
  const [srcIdx, setSrcIdx] = useState(0)
  const candidates = [
    src,
    src.replace(/\.png$/i, '.jpg'),
    src.replace(/Avatar%20/g, 'Avatar%20').replace(/\.png$/i, '.webp'),
  ]
  const current = candidates[Math.min(srcIdx, candidates.length - 1)]
  const failed = srcIdx >= candidates.length
  const overlap = Math.round(size * 0.28)
  const ring = '2px solid rgba(255,255,255,0.85)'

  return (
    <div
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        marginLeft: index === 0 ? 0 : -overlap,
        zIndex: 4 - index,
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        border: ring,
        overflow: 'hidden',
        background: failed
          ? 'linear-gradient(145deg, #0ABFA3 0%, #0A2F38 100%)'
          : '#0A2530',
        flexShrink: 0,
      }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setSrcIdx(i => i + 1)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: size * 0.38,
            color: '#fff',
            letterSpacing: '0.04em',
          }}
        >
          {index + 1}
        </span>
      )}
    </div>
  )
}
