'use client'

import { useState, useEffect, useRef } from 'react'

// ── Types ────────────────────────────────────────────────────────────

interface ImagePickerProps {
  mode: 'full' | 'upload-only' | 'avatar'
  aiPrompt?: string
  aspectRatio?: '16/9' | '1/1' | '3/1'
  bucket?: string
  onSelect: (url: string) => void
  currentUrl?: string
}

type Tab = 'unsplash' | 'ai' | 'upload'

interface UnsplashPhoto {
  id: string
  url: string
  thumb: string
  credit: string
  profileUrl: string | null
}

const STYLES = ['Cinematic', 'Editorial', 'Abstract', 'Bold graphic', 'Minimal'] as const

const GOLD = '#C9A84C'
const PURPLE = '#A78BFA'

// ── Component ────────────────────────────────────────────────────────

export function ImagePicker({
  mode,
  aiPrompt,
  aspectRatio = '16/9',
  bucket = 'Branding',
  onSelect,
  currentUrl,
}: ImagePickerProps) {
  const tabs: Tab[] = mode === 'upload-only' ? ['upload'] : mode === 'avatar' ? ['upload', 'unsplash'] : ['unsplash', 'ai', 'upload']
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0])

  // Unsplash
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)

  // AI Generate
  const [aiImages, setAiImages] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStyle, setAiStyle] = useState<string>('Cinematic')
  const [aiPromptText, setAiPromptText] = useState(aiPrompt ?? '')

  // Upload
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Shared
  const [selected, setSelected] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  // Auto-load Unsplash on mount if in full mode
  useEffect(() => {
    if (mode !== 'upload-only' && activeTab === 'unsplash') loadUnsplash()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Unsplash ─────────────────────────────────────────────────────

  async function loadUnsplash() {
    setPhotosLoading(true)
    setError(null)
    try {
      const q = aiPrompt || 'professional business sales'
      const res = await fetch(`/api/admin/images/unsplash?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      setPhotos(data.photos ?? [])
    } catch {
      setError('Failed to load photos')
    } finally {
      setPhotosLoading(false)
    }
  }

  // ── AI Generate ──────────────────────────────────────────────────

  async function handleGenerate() {
    setAiLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPromptText, style: aiStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setAiImages(data.images ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Upload ───────────────────────────────────────────────────────

  async function handleFileUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('folder', mode === 'avatar' ? 'avatars' : 'uploads')
      const res = await fetch('/api/admin/images/upload', { method: 'POST', body: formData })
      let data: { url?: string; error?: string }
      try {
        const text = await res.text()
        data = JSON.parse(text)
      } catch {
        throw new Error(`Upload failed (status ${res.status})`)
      }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      if (data.url) {
        setSelected(data.url)
        onSelect(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFileUpload(file)
  }

  function handleSelect(url: string) {
    setSelected(url)
  }

  function handleConfirm() {
    if (selected) onSelect(selected)
  }

  // ── Render ───────────────────────────────────────────────────────

  const tabLabels: Record<Tab, string> = { unsplash: 'Stock Photos', ai: 'AI Generate', upload: 'Upload' }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setError(null); if (tab === 'unsplash' && photos.length === 0) loadUnsplash() }}
              className="flex-1 py-2.5 font-condensed font-semibold uppercase tracking-[0.12em] text-[10px] transition-colors"
              style={{
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderBottom: activeTab === tab ? `2px solid ${tab === 'ai' ? PURPLE : GOLD}` : '2px solid transparent',
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        {error && (
          <p className="font-condensed text-[11px] mb-3" style={{ color: '#ef0e30' }}>{error}</p>
        )}

        {/* ── UNSPLASH TAB ─────────────────────────────────────── */}
        {activeTab === 'unsplash' && (
          <>
            {photosLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="font-condensed text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading photos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.url)}
                    className="rounded overflow-hidden text-left transition-all"
                    style={{
                      border: selected === p.url ? `2px solid ${GOLD}` : '2px solid transparent',
                      aspectRatio,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb} alt={p.credit} className="w-full h-full object-cover" />
                    <p className="font-condensed text-[8px] px-1 py-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {p.credit}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── AI GENERATE TAB ──────────────────────────────────── */}
        {activeTab === 'ai' && (
          <>
            <textarea
              value={aiPromptText}
              onChange={e => setAiPromptText(e.target.value)}
              rows={2}
              placeholder="Describe the image you want..."
              className="w-full rounded px-3 py-2 text-[13px] font-body resize-none focus:outline-none mb-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {STYLES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAiStyle(s)}
                  className="font-condensed font-semibold uppercase tracking-[0.1em] text-[9px] px-3 py-1 rounded-full transition-all"
                  style={{
                    backgroundColor: aiStyle === s ? `${PURPLE}25` : 'rgba(255,255,255,0.04)',
                    color: aiStyle === s ? PURPLE : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${aiStyle === s ? PURPLE : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiLoading || !aiPromptText.trim()}
              className="w-full font-condensed font-bold uppercase tracking-[0.12em] text-[11px] py-2.5 rounded transition-opacity"
              style={{
                backgroundColor: PURPLE,
                color: '#fff',
                opacity: aiLoading || !aiPromptText.trim() ? 0.5 : 1,
              }}
            >
              {aiLoading ? 'Generating (10-20s)...' : 'Generate 3 images \u2192'}
            </button>
            {aiImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {aiImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(url)}
                    className="rounded overflow-hidden relative transition-all"
                    style={{
                      border: selected === url ? `2px solid ${GOLD}` : '2px solid transparent',
                      aspectRatio,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`AI generated ${i + 1}`} className="w-full h-full object-cover" />
                    <span
                      className="absolute top-1 left-1 font-condensed font-bold text-[7px] uppercase rounded px-1 py-0.5"
                      style={{ backgroundColor: `${PURPLE}cc`, color: '#fff' }}
                    >
                      AI
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── UPLOAD TAB ───────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer py-10 transition-colors"
            style={{
              border: '2px dashed rgba(255,255,255,0.12)',
              backgroundColor: uploading ? 'rgba(255,255,255,0.03)' : 'transparent',
            }}
          >
            {uploading ? (
              <span className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Uploading...</span>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="font-condensed font-semibold text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {mode === 'avatar' ? 'Upload avatar' : 'Drop image here or click to browse'}
                </span>
                <span className="font-condensed text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  JPG, PNG, WebP &middot; Max 10 MB
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
            />
          </div>
        )}

        {/* ── Selected preview + confirm ────────────────────── */}
        {selected && activeTab !== 'upload' && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected}
              alt="Selected"
              className="rounded object-cover flex-shrink-0"
              style={{ width: 48, height: 48, border: `2px solid ${GOLD}` }}
            />
            <button
              type="button"
              onClick={handleConfirm}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD, color: '#0A0F18' }}
            >
              Use this \u2192
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
