'use client'

import { useEffect, useState } from 'react'
import {
  HERO_KEY_MISSING_MESSAGE,
  isOwnedFeaturedImage,
} from '@/lib/media/heroPublishGuard'
import { HERO_IMAGE_CREDIT } from '@/lib/media/heroPrompt'

interface HeroOption {
  id: string
  url: string
}

export function HeroArtPanel({
  storyId,
  imageUrl,
  heroStatus,
  onImage,
}: {
  storyId?: string
  imageUrl: string
  heroStatus?: string | null
  onImage: (url: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [options, setOptions] = useState<HeroOption[]>([])
  const owned = isOwnedFeaturedImage(imageUrl)

  useEffect(() => {
    if (heroStatus !== 'queued' || !storyId || imageUrl.trim()) return
    let stopped = false
    const started = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - started > 120000) {
        clearInterval(timer)
        if (!stopped) {
          setInfo('House hero art has not landed yet. Use Generate house hero to try again.')
        }
        return
      }
      void (async () => {
        try {
          const res = await fetch(`/api/admin/media/${storyId}`)
          if (!res.ok) return
          const data = await res.json() as { featured_image_url?: unknown }
          const url = typeof data.featured_image_url === 'string' ? data.featured_image_url : ''
          if (url && !stopped) onImage(url)
        } catch {
          // Keep checking. A single miss does not mean generation failed.
        }
      })()
    }, 4000)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [heroStatus, storyId, imageUrl, onImage])

  async function postHero(payload: Record<string, unknown>) {
    if (!storyId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/media/${storyId}/hero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({})) as {
        error?: string
        featured_image_url?: string
        options?: HeroOption[]
      }
      if (!res.ok) {
        setError(data.error ?? 'Hero art failed')
        return
      }
      if (data.featured_image_url) {
        onImage(data.featured_image_url)
        setOptions([])
        setInfo('Proposed hero art is stored on this story.')
        return
      }
      setOptions(Array.isArray(data.options) ? data.options : [])
      if (!data.options?.length) setError('No hero options came back. Try again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hero art failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4 rounded px-4 py-3" style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-card)' }}>
      <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)] mb-2">
        House hero art
      </p>
      <p className="font-body text-[13px] text-[color:var(--admin-text)] mb-3">
        Saving a draft with no image proposes one hero. Regenerate gives you two or three options to accept. {HERO_IMAGE_CREDIT}
      </p>

      {heroStatus === 'skipped' && !owned && (
        <p role="status" className="font-body text-[13px] mb-3" style={{ color: 'var(--admin-red)' }}>
          {HERO_KEY_MISSING_MESSAGE}
        </p>
      )}
      {heroStatus === 'queued' && !imageUrl.trim() && (
        <p role="status" className="font-body text-[13px] text-[color:var(--admin-text-2)] mb-3">
          House hero art is generating. This page will show the proposed image when it is ready.
        </p>
      )}
      {owned && (
        <p className="font-body text-[13px] text-[color:var(--admin-text-2)] mb-3">
          This featured image is on project storage, so it can publish.
        </p>
      )}
      {info && (
        <p role="status" className="font-body text-[13px] text-[color:var(--admin-text-2)] mb-3">{info}</p>
      )}
      {error && (
        <p role="alert" className="font-body text-[13px] mb-3" style={{ color: 'var(--admin-red)' }}>{error}</p>
      )}

      {!storyId ? (
        <p className="font-body text-[13px] text-[color:var(--admin-text-2)]">
          Save as draft to generate house hero art.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="ep-admin-el-btn"
            disabled={busy}
            onClick={() => void postHero({ count: 1 })}
          >
            {busy ? 'Working...' : 'Generate house hero'}
          </button>
          <button
            type="button"
            className="ep-admin-el-btn ep-admin-el-btn--ghost"
            disabled={busy}
            onClick={() => void postHero({ count: 3 })}
          >
            {busy ? 'Working...' : 'Regenerate options'}
          </button>
        </div>
      )}

      {options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {options.map((option) => (
            <div key={option.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={option.url} alt="Proposed hero option" className="w-full rounded object-cover" style={{ aspectRatio: '16 / 9' }} />
              <button
                type="button"
                className="ep-admin-el-btn ep-admin-el-btn--primary mt-2 w-full"
                disabled={busy}
                onClick={() => void postHero({ acceptUrl: option.url })}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
