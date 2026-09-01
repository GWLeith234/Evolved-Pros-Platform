'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PodcastCoverCard } from '@/components/podcast/PodcastCoverCard'
import type { PodcastEpisode } from '@/lib/podcast/transforms'

interface Candidate {
  url: string
  path: string
}

interface GuestArtworkPanelProps {
  episodeId: string
  /** Pre-built on the server (dbRowToEpisode) so the preview uses the REAL
   *  cover card and cannot drift from production. We override `.cover` per
   *  candidate. */
  previewEpisode: PodcastEpisode
  initialGuestImageUrl: string | null
}

const CARD_WIDTH = 190

export function GuestArtworkPanel({
  episodeId,
  previewEpisode,
  initialGuestImageUrl,
}: GuestArtworkPanelProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [referencePath, setReferencePath] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [generating, setGenerating] = useState(false)
  const [publishingPath, setPublishingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(initialGuestImageUrl)

  const busy = generating || publishingPath !== null

  const onPickFile = useCallback((f: File | null) => {
    if (!f) return
    setError(null)
    setFile(f)
    // New reference → fresh session. Any prior candidates/reference are
    // abandoned (best-effort; the server also cleans up on publish).
    setCandidates([])
    setReferencePath(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
  }, [])

  const generate = useCallback(async () => {
    setError(null)
    setGenerating(true)
    try {
      const fd = new FormData()
      if (referencePath && !file) {
        // "Generate another" — reuse the stored square reference.
        fd.append('referencePath', referencePath)
      } else if (file) {
        fd.append('file', file)
      } else {
        setError('Upload a reference photo first.')
        setGenerating(false)
        return
      }

      const res = await fetch(`/api/admin/episodes/${episodeId}/guest-portrait`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || `Generation failed (HTTP ${res.status}).`)
        return
      }
      setCandidates((prev) => [...prev, { url: data.candidateUrl, path: data.candidatePath }])
      if (data.referencePath) setReferencePath(data.referencePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }, [episodeId, file, referencePath])

  const publishCandidate = useCallback(
    async (chosen: Candidate) => {
      setError(null)
      setPublishingPath(chosen.path)
      try {
        const res = await fetch(`/api/admin/episodes/${episodeId}/guest-portrait/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chosenPath: chosen.path,
            candidatePaths: candidates.map((c) => c.path),
            referencePath: referencePath ?? undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data?.error || `Publish failed (HTTP ${res.status}).`)
          return
        }
        // Reset the studio and refresh so the form reflects the new art layer.
        setPublishedUrl(data.url)
        setCandidates([])
        setReferencePath(null)
        setFile(null)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Publish failed.')
      } finally {
        setPublishingPath(null)
      }
    },
    [episodeId, candidates, referencePath, router],
  )

  return (
    <section
      style={{
        marginTop: 32,
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-bebas)',
          fontSize: 22,
          letterSpacing: '0.02em',
          color: 'var(--text-primary)',
        }}
      >
        Guest artwork
      </h2>
      <p
        style={{
          margin: '4px 0 16px',
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        Upload a reference photo of the guest. The server restyles it into the house
        watercolour and you pick the one that publishes to the cover.
      </p>

      {/* Current published art */}
      {publishedUrl && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publishedUrl}
            alt="Current guest artwork"
            style={{
              width: 64,
              height: 96,
              objectFit: 'cover',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Current guest artwork is set.
          </span>
        </div>
      )}

      {/* Drop zone / file picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (busy) return
          const f = e.dataTransfer.files?.[0] ?? null
          onPickFile(f)
        }}
        onClick={() => !busy && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !busy) fileInputRef.current?.click()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 16,
          borderRadius: 10,
          border: '1px dashed var(--border-color)',
          background: 'var(--bg-elevated)',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Reference preview"
            style={{
              width: 72,
              height: 72,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
            }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              color: 'var(--text-tertiary)',
              fontSize: 24,
            }}
            aria-hidden="true"
          >
            ⬆
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
            {file ? file.name : 'Drop a reference photo, or click to choose'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
            JPEG, PNG or WEBP · up to 10MB · auto-cropped square
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Generate action */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={generate}
          disabled={busy || (!file && !referencePath)}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--brand-gold)',
            color: '#0A0F18',
            fontWeight: 700,
            fontSize: 13,
            cursor: busy || (!file && !referencePath) ? 'not-allowed' : 'pointer',
            opacity: busy || (!file && !referencePath) ? 0.5 : 1,
          }}
        >
          {candidates.length > 0 ? 'Generate another' : 'Generate portrait'}
        </button>
        {generating && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid var(--border-color)',
                borderTopColor: 'var(--brand-gold)',
                display: 'inline-block',
                animation: 'ep-spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              This takes 20–40 seconds…
            </span>
          </span>
        )}
      </div>

      {/* Error surface */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid color-mix(in srgb, var(--brand-red) 45%, transparent)',
            background: 'color-mix(in srgb, var(--brand-red) 12%, transparent)',
            color: 'var(--text-primary)',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error}
        </div>
      )}

      {/* Candidates — rendered inside the REAL cover card so George judges them
          in the frame they will actually appear in. */}
      {candidates.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--text-tertiary)',
            }}
          >
            Candidates
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {candidates.map((c) => (
              <div key={c.path} style={{ width: CARD_WIDTH }}>
                {/* The REAL production cover card, inert (no navigation), with
                    the candidate as the art layer (guest.photo = guest_image_url)
                    so the preview cannot drift from what publishes. */}
                <PodcastCoverCard
                  episode={{ ...previewEpisode, guest: { ...previewEpisode.guest, photo: c.url } }}
                  interactive={false}
                />
                <button
                  type="button"
                  onClick={() => publishCandidate(c)}
                  disabled={busy}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--brand-teal)',
                    background: 'transparent',
                    color: 'var(--brand-teal)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {publishingPath === c.path ? 'Publishing…' : 'Use this one'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes ep-spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  )
}
