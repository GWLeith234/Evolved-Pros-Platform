'use client'

import { useRef, useState } from 'react'

type Tab = 'upload' | 'stock' | 'generate'

const STYLES = ['Photorealistic', 'Cinematic', 'Dark editorial'] as const
type Style = typeof STYLES[number]

interface UnsplashResult {
  id: string
  urls: { regular: string; small: string; thumb: string }
  user: { name: string; username: string; link: string }
}

interface ImagePickerProps {
  value: string | null
  onChange: (url: string) => void
  label?: string
  uploadEndpoint?: string
}

export function ImagePicker({ value, onChange, label, uploadEndpoint }: ImagePickerProps) {
  const [tab, setTab] = useState<Tab>('upload')

  return (
    <div className="rounded-lg border border-[#1E2535] bg-[#111926] text-slate-100">
      {label && (
        <div className="border-b border-[#1E2535] px-4 py-3 text-sm font-medium text-slate-200">
          {label}
        </div>
      )}

      {value && (
        <div className="border-b border-[#1E2535] p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Current</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Current selection"
            className="h-32 w-full rounded object-cover"
          />
        </div>
      )}

      <div className="flex border-b border-[#1E2535]">
        <TabButton active={tab === 'upload'} onClick={() => setTab('upload')}>Upload</TabButton>
        <TabButton active={tab === 'stock'} onClick={() => setTab('stock')}>Stock</TabButton>
        <TabButton active={tab === 'generate'} onClick={() => setTab('generate')}>Generate</TabButton>
      </div>

      <div className="p-4">
        {tab === 'upload' && <UploadTab onChange={onChange} endpoint={uploadEndpoint} />}
        {tab === 'stock' && <StockTab onChange={onChange} />}
        {tab === 'generate' && <GenerateTab onChange={onChange} />}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 px-4 py-3 text-sm font-medium transition ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9302A]" />
      )}
    </button>
  )
}

// ── Upload ──────────────────────────────────────────────────────────

function UploadTab({ onChange, endpoint }: { onChange: (url: string) => void; endpoint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'Branding')
      fd.append('folder', 'uploads')

      const res = await fetch(endpoint ?? '/api/admin/images/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      setPreview(data.url)
      onChange(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full rounded border border-dashed border-[#2A3344] bg-[#0B1220] px-4 py-8 text-sm text-slate-300 hover:border-[#C9302A] hover:text-white disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Click to choose an image'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Uploaded" className="h-40 w-full rounded object-cover" />
      )}
    </div>
  )
}

// ── Stock (Unsplash) ────────────────────────────────────────────────

function StockTab({ onChange }: { onChange: (url: string) => void }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<UnsplashResult[]>([])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/image/unsplash?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      setResults(data.results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Unsplash…"
          className="flex-1 rounded border border-[#1E2535] bg-[#0B1220] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#C9302A] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="rounded bg-[#C9302A] px-4 py-2 text-sm font-medium text-white hover:bg-[#A82822] disabled:opacity-50"
        >
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {results.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onChange(photo.urls.regular)}
              className="group overflow-hidden rounded border border-[#1E2535] bg-[#0B1220] text-left hover:border-[#C9302A]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.urls.small}
                alt={`Photo by ${photo.user.name}`}
                className="h-24 w-full object-cover"
              />
              <div className="px-2 py-1 text-[11px] text-slate-400 group-hover:text-slate-200">
                by {photo.user.name}
              </div>
            </button>
          ))}
        </div>
      )}

      {!busy && !error && results.length === 0 && (
        <p className="text-xs text-slate-500">Enter a query (e.g. "sales conference") to search Unsplash.</p>
      )}
    </div>
  )
}

// ── Generate (Grok) ─────────────────────────────────────────────────

function GenerateTab({ onChange }: { onChange: (url: string) => void }) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<Style>('Cinematic')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<string | null>(null)

  async function generate() {
    if (!prompt.trim()) {
      setError('Describe the image first')
      return
    }
    setBusy(true)
    setError(null)
    setGenerated(null)
    try {
      const res = await fetch('/api/admin/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Generation failed')
      setGenerated(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image…"
        rows={3}
        className="w-full rounded border border-[#1E2535] bg-[#0B1220] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#C9302A] focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStyle(s)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              style === s
                ? 'border-[#C9302A] bg-[#C9302A]/10 text-white'
                : 'border-[#1E2535] text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={busy || !prompt.trim()}
        className="w-full rounded bg-[#C9302A] px-4 py-2 text-sm font-medium text-white hover:bg-[#A82822] disabled:opacity-50"
      >
        {busy ? 'Generating…' : 'Generate'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {generated && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={generated} alt="Generated" className="h-48 w-full rounded object-cover" />
          <button
            type="button"
            onClick={() => onChange(generated)}
            className="w-full rounded border border-[#C9302A] bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-[#C9302A]/10"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
