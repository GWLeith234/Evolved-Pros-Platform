'use client'

import { useState } from 'react'

export interface AIStoryFields {
  title: string
  excerpt: string
  body: string
  pillar: string
  read_time: number
  image_prompt: string
}

interface Props {
  onPrefill: (fields: AIStoryFields) => void
}

const PILLAR_OPTIONS = [
  { value: '',                label: '— optional —' },
  { value: 'foundation',      label: 'Foundation' },
  { value: 'identity',        label: 'Identity' },
  { value: 'mental',          label: 'Mental Toughness' },
  { value: 'strategy',        label: 'Strategy' },
  { value: 'accountability',  label: 'Accountability' },
  { value: 'execution',       label: 'Execution' },
]

const TEAL = '#0ABFA3'
const RED = '#C9302A'

const inputClass = 'w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all'
const inputStyle: React.CSSProperties = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }
const labelClass = 'block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5'

export function StoryAIWriter({ onPrefill }: Props) {
  const [topic, setTopic] = useState('')
  const [pillar, setPillar] = useState('')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTitle, setLastTitle] = useState<string | null>(null)
  const [lastImagePrompt, setLastImagePrompt] = useState<string | null>(null)

  async function handleWrite() {
    const trimmed = topic.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setLastTitle(null)

    try {
      const res = await fetch('/api/admin/ai/write-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          pillar: pillar || undefined,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      })
      const data = await res.json().catch(() => ({})) as { story?: AIStoryFields; error?: string }
      if (!res.ok || !data.story) {
        setError(data.error ?? 'AI write failed')
        return
      }
      onPrefill(data.story)
      setLastTitle(data.story.title)
      setLastImagePrompt(data.story.image_prompt || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI write failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mb-6 p-5 rounded-lg"
      style={{
        backgroundColor: 'rgba(10,191,163,0.04)',
        border: '1px solid rgba(10,191,163,0.18)',
      }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.22em] text-[10px] mb-1"
        style={{ color: TEAL }}
      >
        Write with AI
      </p>
      <h2 className="font-display font-bold text-[18px] mb-4" style={{ color: '#1b3c5a' }}>
        Draft an article in George&apos;s voice
      </h2>

      <div className="mb-3">
        <label className={labelClass}>Topic</label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          disabled={loading}
          className={inputClass}
          style={inputStyle}
          placeholder="What's this article about? e.g. Why top operators block their calendar differently"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelClass}>Pillar (optional)</label>
          <select
            value={pillar}
            onChange={e => setPillar(e.target.value)}
            disabled={loading}
            className={inputClass}
            style={inputStyle}
          >
            {PILLAR_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Keywords (optional, comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            disabled={loading}
            className={inputClass}
            style={inputStyle}
            placeholder="time-blocking, focus, calendar discipline"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleWrite}
        disabled={!topic.trim() || loading}
        className="w-full font-condensed font-bold uppercase tracking-[0.14em] text-[12px] py-3 rounded transition-all disabled:opacity-40"
        style={{
          backgroundColor: RED,
          color: '#fff',
          letterSpacing: '0.14em',
        }}
      >
        {loading ? 'Writing in George’s voice…' : 'Write with AI'}
      </button>

      {loading && (
        <div
          className="mt-3 h-1 rounded overflow-hidden"
          style={{ backgroundColor: 'rgba(201,48,42,0.08)' }}
          aria-hidden="true"
        >
          <div
            className="h-full"
            style={{
              width: '40%',
              background: `linear-gradient(90deg, ${RED}00, ${RED}, ${RED}00)`,
              animation: 'storyAIWriterPulse 1.4s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes storyAIWriterPulse {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(250%); }
            }
          `}</style>
        </div>
      )}

      {error && (
        <p className="mt-3 font-body text-[12px]" style={{ color: '#ef0e30' }}>
          {error}
        </p>
      )}

      {lastTitle && !loading && !error && (
        <div
          className="mt-4 px-3 py-2.5 rounded font-body text-[12px]"
          style={{
            backgroundColor: 'rgba(10,191,163,0.08)',
            border: '1px solid rgba(10,191,163,0.25)',
            color: '#1b3c5a',
          }}
        >
          <span style={{ color: TEAL, fontWeight: 700 }}>Drafted:</span>{' '}
          {lastTitle}
          {lastImagePrompt && (
            <p className="mt-1 font-condensed text-[10px] uppercase tracking-[0.14em] text-[#7a8a96]">
              Image prompt copied to the form&apos;s featured-image picker.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
