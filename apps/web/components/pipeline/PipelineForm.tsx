'use client'

import { useState, useRef } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillars'
import { OutputCard } from './OutputCard'

const PILLARS = Object.entries(PILLAR_CONFIG).map(([key, val]) => ({ key, label: val.label, color: val.color }))
type InputMode = 'upload' | 'paste' | 'url'

const inputClass = 'w-full rounded px-3 py-2.5 text-[13px] font-body outline-none'

interface Outputs {
  community: string
  article: Record<string, unknown>
  email: Record<string, unknown>
  social: Record<string, unknown>
}

export function PipelineForm() {
  const [mode, setMode] = useState<InputMode>('paste')
  const [transcript, setTranscript] = useState('')
  const [title, setTitle] = useState('')
  const [pillar, setPillar] = useState('')
  const [generating, setGenerating] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [outputs, setOutputs] = useState<Outputs | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishingType, setPublishingType] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(file: File) {
    setTranscribing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/pipeline/transcribe', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed')
      setTranscript(data.transcript ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setTranscribing(false)
    }
  }

  async function handleGenerate() {
    if (!transcript.trim() || !title.trim() || !pillar) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title, pillar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setOutputs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(type: string, content: unknown) {
    setPublishingType(type)
    try {
      const res = await fetch('/api/admin/pipeline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, pillar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')
      if (type === 'social') {
        const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        const ta = document.createElement('textarea')
        ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishingType(null)
    }
  }

  const modeStyle = (m: InputMode) => ({
    backgroundColor: mode === m ? 'rgba(255,255,255,0.07)' : 'transparent',
    color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
    borderBottom: mode === m ? '2px solid #C9A84C' : '2px solid transparent',
  })

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded px-4 py-3 font-condensed text-[12px]" style={{ backgroundColor: 'rgba(239,14,48,0.08)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}>{error}</div>
      )}

      {/* Source card */}
      <div className="rounded-lg" style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Mode tabs */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {(['upload', 'paste', 'url'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className="flex-1 py-2.5 font-condensed font-semibold uppercase tracking-[0.12em] text-[10px] transition-colors"
              style={modeStyle(m)}>
              {m === 'upload' ? 'Upload file' : m === 'paste' ? 'Paste transcript' : 'Episode URL'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {mode === 'upload' && (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer py-8"
              style={{ border: '2px dashed rgba(255,255,255,0.12)' }}
            >
              <span className="font-condensed font-semibold text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {transcribing ? 'Transcribing...' : 'Drop audio/text file or click to browse'}
              </span>
              <span className="font-condensed text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>.mp3 .mp4 .m4a .txt</span>
              <input ref={fileRef} type="file" accept=".mp3,.mp4,.m4a,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
            </div>
          )}

          {mode === 'paste' && (
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={6}
              placeholder="Paste episode transcript here..."
              className={`${inputClass} resize-y`}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          )}

          {mode === 'url' && (
            <div>
              <input type="url" placeholder="https://youtube.com/watch?v=..." className={inputClass}
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <p className="font-condensed text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Paste transcript below after loading URL</p>
            </div>
          )}

          {transcript && (
            <p className="font-condensed text-[10px]" style={{ color: '#0ABFA3' }}>
              {transcript.split(/\s+/).length.toLocaleString()} words loaded
            </p>
          )}

          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Episode title" className={inputClass}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />

          <div className="flex flex-wrap gap-1.5">
            {PILLARS.map(p => (
              <button key={p.key} type="button" onClick={() => setPillar(p.key === pillar ? '' : p.key)}
                className="font-condensed font-semibold uppercase tracking-[0.1em] text-[9px] rounded-full px-3 py-1 transition-all"
                style={{
                  backgroundColor: pillar === p.key ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                  color: pillar === p.key ? p.color : 'rgba(255,255,255,0.35)',
                  border: `1px solid ${pillar === p.key ? p.color : 'rgba(255,255,255,0.08)'}`,
                }}>
                {p.label}
              </button>
            ))}
          </div>

          <button type="button" onClick={handleGenerate}
            disabled={generating || !transcript.trim() || !title.trim() || !pillar}
            className="w-full font-condensed font-bold uppercase tracking-[0.12em] text-[12px] py-3 rounded transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A84C', color: '#0A0F18', opacity: generating || !transcript.trim() || !title.trim() || !pillar ? 0.5 : 1 }}>
            {generating ? 'Generating all outputs...' : 'Generate all outputs \u2192'}
          </button>
        </div>
      </div>

      {/* Outputs */}
      {outputs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OutputCard type="community" content={outputs.community} accentColor="#0ABFA3" label="Community Post"
            actionLabel="Post to community \u2192" onPublish={() => handlePublish('community', { body: outputs.community })}
            onRegenerate={handleGenerate} publishing={publishingType === 'community'} />
          <OutputCard type="article" content={outputs.article} accentColor="#C9A84C" label="Media Article"
            actionLabel="Save as draft \u2192" onPublish={() => handlePublish('article', outputs.article)}
            onRegenerate={handleGenerate} publishing={publishingType === 'article'} />
          <OutputCard type="email" content={outputs.email} accentColor="#60A5FA" label="Email Blast"
            actionLabel="Copy email" onPublish={() => handlePublish('social', outputs.email)}
            onRegenerate={handleGenerate} publishing={publishingType === 'email'} />
          <OutputCard type="social" content={outputs.social} accentColor="#A78BFA" label="Social Copy"
            actionLabel="Copy to clipboard" onPublish={() => handlePublish('social', outputs.social)}
            onRegenerate={handleGenerate} publishing={publishingType === 'social'} />
        </div>
      )}
    </div>
  )
}
