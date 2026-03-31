'use client'

import { useState } from 'react'

const MOODS = ['Professional', 'Energetic', 'Intimate', 'Epic', 'Tech-Forward', 'Community'] as const
type Mood = typeof MOODS[number]

interface EventImageGeneratorProps {
  eventTitle: string
  onSelect: (url: string) => void
}

export function EventImageGenerator({ eventTitle, onSelect }: EventImageGeneratorProps) {
  const [mood, setMood] = useState<Mood>('Professional')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!eventTitle.trim()) {
      setError('Enter an event title first')
      return
    }
    setLoading(true)
    setError(null)
    setImages([])
    setSelected(null)

    try {
      const res = await fetch('/api/admin/generate-event-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: eventTitle, mood }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setImages(data.images ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(url: string) {
    setSelected(url)
    onSelect(url)
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: 'rgba(27,60,90,0.03)', border: '1px solid rgba(27,60,90,0.1)' }}
    >
      <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-3" style={{ color: '#7a8a96' }}>
        AI Image Generator
      </p>

      {/* Mood pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MOODS.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMood(m)}
            className="font-condensed font-semibold text-[11px] rounded-full px-3 py-1 transition-all"
            style={{
              backgroundColor: mood === m ? '#1b3c5a' : 'transparent',
              color: mood === m ? 'white' : '#7a8a96',
              border: `1px solid ${mood === m ? '#1b3c5a' : 'rgba(27,60,90,0.18)'}`,
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] rounded px-5 py-2 transition-all"
        style={{
          backgroundColor: loading ? 'rgba(27,60,90,0.3)' : '#1b3c5a',
          color: 'white',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Generating 3 variants…
          </span>
        ) : (
          '✦ Generate Images'
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="font-condensed text-[11px] mt-2" style={{ color: '#ef0e30' }}>{error}</p>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="mt-4">
          <p className="font-condensed text-[10px] mb-2" style={{ color: '#7a8a96' }}>
            Click a variant to use it as the cover image
          </p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(url)}
                className="relative rounded overflow-hidden aspect-video transition-all"
                style={{
                  border: selected === url ? '2px solid #1b3c5a' : '2px solid transparent',
                  outline: selected === url ? '2px solid rgba(27,60,90,0.3)' : 'none',
                  outlineOffset: '2px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Variant ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {selected === url && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(27,60,90,0.25)' }}
                  >
                    <span
                      className="font-condensed font-bold text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5"
                      style={{ backgroundColor: '#1b3c5a', color: 'white' }}
                    >
                      ✓ Selected
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
