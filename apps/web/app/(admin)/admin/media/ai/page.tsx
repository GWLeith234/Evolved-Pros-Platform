'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PILLAR_CONFIG } from '@/lib/pillars'
import { ImagePicker } from '@/components/ui/ImagePicker'

const PILLARS = Object.entries(PILLAR_CONFIG).map(([key, val]) => ({
  key,
  label: val.label,
  color: val.color,
}))

const inputClass = 'w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none'
const inputStyle = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }
const labelClass = 'block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5'
const btnPrimary = 'font-condensed font-bold uppercase tracking-[0.1em] text-[12px] rounded px-6 py-2.5 transition-opacity hover:opacity-90'

interface ResearchData {
  summary: string
  stats: string[]
  angles: { title: string; hook: string; wordCount: number }[]
}

interface DraftData {
  title: string
  body: string
  slug: string
  metaDescription: string
}

export default function ContentEnginePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [topic, setTopic] = useState('')
  const [pillar, setPillar] = useState('')

  // Step 2
  const [researching, setResearching] = useState(false)
  const [research, setResearch] = useState<ResearchData | null>(null)
  const [selectedAngle, setSelectedAngle] = useState(0)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)

  // Step 3
  const [drafting, setDrafting] = useState(false)
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editMeta, setEditMeta] = useState('')

  // Step 4
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResearch() {
    setResearching(true)
    setError(null)
    try {
      const resRes = await fetch('/api/admin/media/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const resData = await resRes.json()
      if (!resRes.ok) throw new Error(resData.error ?? 'Research failed')
      setResearch(resData.research)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed')
    } finally {
      setResearching(false)
    }
  }

  async function handleDraft() {
    if (!research) return
    setDrafting(true)
    setError(null)
    try {
      const angle = research.angles[selectedAngle]
      const res = await fetch('/api/admin/media/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, angle: angle?.title ?? topic, researchBrief: research.summary, pillar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Draft generation failed')
      const d = data.draft as DraftData
      setDraft(d)
      setEditTitle(d.title)
      setEditBody(d.body)
      setEditSlug(d.slug)
      setEditMeta(d.metaDescription)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft failed')
    } finally {
      setDrafting(false)
    }
  }

  async function handlePublish(status: 'draft' | 'published') {
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle, slug: editSlug, body: editBody, pillar: pillar || null,
          excerpt: editMeta, seo_description: editMeta, seo_title: editTitle,
          featured_image_url: heroImageUrl ?? null, story_type: 'original',
          author: 'George Leith', is_published: status === 'published', is_featured: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      router.push('/admin/media')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <a href="/admin/media" className="font-condensed text-[11px] uppercase tracking-wide" style={{ color: '#7a8a96' }}>← Back to Media</a>
        <h1 className="font-display font-black text-[28px] mt-2" style={{ color: '#1b3c5a' }}>AI Content Engine</h1>
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-bold text-[11px]"
                style={{ backgroundColor: s <= step ? '#1b3c5a' : 'rgba(27,60,90,0.08)', color: s <= step ? '#fff' : '#7a8a96' }}>
                {s}
              </div>
              {s < 4 && <div style={{ width: 24, height: 2, backgroundColor: s < step ? '#1b3c5a' : 'rgba(27,60,90,0.1)' }} />}
            </div>
          ))}
          <span className="font-condensed text-[11px] ml-2" style={{ color: '#7a8a96' }}>
            {step === 1 ? 'Seed' : step === 2 ? 'Research' : step === 3 ? 'Draft' : 'Publish'}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded px-4 py-3 mb-6 font-condensed text-[12px]" style={{ backgroundColor: 'rgba(239,14,48,0.08)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}>{error}</div>
      )}

      {/* STEP 1: Seed */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Why top sellers treat objections as intel" />
          </div>
          <div>
            <label className={labelClass}>Pillar</label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map(p => (
                <button key={p.key} type="button" onClick={() => setPillar(p.key === pillar ? '' : p.key)}
                  className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px] rounded-full px-4 py-1.5 transition-all"
                  style={{ backgroundColor: pillar === p.key ? `${p.color}20` : 'rgba(27,60,90,0.04)', color: pillar === p.key ? p.color : '#7a8a96', border: `1px solid ${pillar === p.key ? p.color : 'rgba(27,60,90,0.1)'}` }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={handleResearch} disabled={!topic.trim() || researching} className={btnPrimary}
            style={{ backgroundColor: '#1b3c5a', color: '#fff', opacity: !topic.trim() || researching ? 0.5 : 1 }}>
            {researching ? 'Researching...' : 'Research Topic \u2192'}
          </button>
        </div>
      )}

      {/* STEP 2: Research */}
      {step === 2 && research && (
        <div className="space-y-6">
          <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(27,60,90,0.03)', border: '1px solid rgba(27,60,90,0.08)' }}>
            <p className={labelClass}>Research Brief</p>
            <p className="font-body text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: '#1b3c5a' }}>{research.summary}</p>
            {research.stats.length > 0 && (
              <div className="mt-3 space-y-1">
                {research.stats.map((stat, i) => (
                  <p key={i} className="font-condensed text-[11px]" style={{ color: '#68a2b9' }}>\u2022 {stat}</p>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className={labelClass}>Choose an angle</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {research.angles.map((a, i) => (
                <button key={i} type="button" onClick={() => setSelectedAngle(i)} className="text-left rounded-lg p-4 transition-all"
                  style={{ backgroundColor: selectedAngle === i ? 'rgba(104,162,185,0.08)' : '#fff', border: `2px solid ${selectedAngle === i ? '#68a2b9' : 'rgba(27,60,90,0.08)'}` }}>
                  <p className="font-condensed font-bold text-[13px] mb-1" style={{ color: '#1b3c5a' }}>{a.title}</p>
                  <p className="font-body text-[11px] leading-relaxed" style={{ color: '#7a8a96' }}>{a.hook}</p>
                  <p className="font-condensed text-[9px] mt-2" style={{ color: '#68a2b9' }}>\u2248{a.wordCount} words</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={labelClass}>Featured Image</p>
            <ImagePicker
              mode="full"
              aspectRatio="16/9"
              aiPrompt={research.summary?.slice(0, 200) || topic}
              bucket="Branding"
              onSelect={url => setHeroImageUrl(url)}
              currentUrl={heroImageUrl ?? undefined}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="font-condensed font-semibold text-[11px] uppercase tracking-wide" style={{ color: '#7a8a96' }}>← Back</button>
            <button type="button" onClick={handleDraft} disabled={drafting} className={btnPrimary}
              style={{ backgroundColor: '#1b3c5a', color: '#fff', opacity: drafting ? 0.5 : 1 }}>
              {drafting ? 'Generating Draft...' : 'Generate Draft \u2192'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Draft */}
      {step === 3 && draft && (
        <div className="space-y-5">
          <div><label className={labelClass}>Title</label><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputClass} style={inputStyle} /></div>
          <div><label className={labelClass}>Slug</label><input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value)} className={inputClass} style={inputStyle} /></div>
          <div>
            <label className={labelClass}>SEO Meta Description</label>
            <input type="text" value={editMeta} onChange={e => setEditMeta(e.target.value)} maxLength={160} className={inputClass} style={inputStyle} />
            <p className="font-condensed text-[9px] mt-1" style={{ color: '#7a8a96' }}>{editMeta.length}/160</p>
          </div>
          <div>
            <label className={labelClass}>Article Body (Markdown)</label>
            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={20}
              className={`${inputClass} resize-y`} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }} />
          </div>
          {heroImageUrl && (
            <div>
              <label className={labelClass}>Featured Image</label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImageUrl} alt="" className="w-full rounded max-h-60 object-cover" />
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="font-condensed font-semibold text-[11px] uppercase tracking-wide" style={{ color: '#7a8a96' }}>← Back</button>
            <button type="button" onClick={() => setStep(4)} className={btnPrimary} style={{ backgroundColor: '#1b3c5a', color: '#fff' }}>Review & Publish \u2192</button>
          </div>
        </div>
      )}

      {/* STEP 4: Publish */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)' }}>
            {heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-5">
              {pillar && (
                <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1" style={{ color: PILLAR_CONFIG[pillar]?.color ?? '#7a8a96' }}>
                  {PILLAR_CONFIG[pillar]?.label ?? pillar}
                </p>
              )}
              <h2 className="font-body font-bold text-[18px] mb-2" style={{ color: '#1b3c5a' }}>{editTitle}</h2>
              <p className="font-body text-[13px] leading-relaxed" style={{ color: '#7a8a96' }}>{editMeta}</p>
              <p className="font-condensed text-[10px] mt-3" style={{ color: 'rgba(27,60,90,0.3)' }}>
                By George Leith &middot; {Math.ceil(editBody.split(/\s+/).length / 200)} min read
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="font-condensed font-semibold text-[11px] uppercase tracking-wide" style={{ color: '#7a8a96' }}>← Edit Draft</button>
            <button type="button" onClick={() => handlePublish('draft')} disabled={publishing} className={btnPrimary}
              style={{ backgroundColor: '#7a8a96', color: '#fff', opacity: publishing ? 0.5 : 1 }}>Save Draft</button>
            <button type="button" onClick={() => handlePublish('published')} disabled={publishing} className={btnPrimary}
              style={{ backgroundColor: '#ef0e30', color: '#fff', opacity: publishing ? 0.5 : 1 }}>
              {publishing ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
