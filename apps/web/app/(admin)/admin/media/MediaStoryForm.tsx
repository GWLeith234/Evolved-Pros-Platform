'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StoryData {
  id?: string
  title: string
  slug: string
  excerpt: string
  body: string
  pillar: string
  tags: string
  story_type: string
  source_url: string
  source_name: string
  featured_image_url: string
  author: string
  seo_title: string
  seo_description: string
  is_featured: boolean
}

const PILLARS = [
  { value: '', label: 'Select pillar...' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'identity', label: 'Identity' },
  { value: 'mental-toughness', label: 'Mental Toughness' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'execution', label: 'Execution' },
]

const STORY_TYPES = [
  { value: 'original', label: 'Original' },
  { value: 'pioneer_spin', label: 'Pioneer Spin' },
  { value: 'redirect', label: 'Redirect' },
]

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

const inputClass = 'w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all'
const inputStyle: React.CSSProperties = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }
const labelClass = 'block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5'

export function MediaStoryForm({ initial, isEdit }: { initial?: Partial<StoryData>; isEdit?: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [storyType, setStoryType] = useState(initial?.story_type ?? 'original')
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? '')
  const [sourceName, setSourceName] = useState(initial?.source_name ?? '')
  const [pillar, setPillar] = useState(initial?.pillar ?? '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.featured_image_url ?? '')
  const [author, setAuthor] = useState(initial?.author ?? 'George Leith')
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(initial?.seo_description ?? '')
  const [tags, setTags] = useState(initial?.tags ?? '')
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false)

  const showSource = storyType === 'pioneer_spin' || storyType === 'redirect'

  async function handleSave(publish: boolean) {
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      body: body.trim() || null,
      pillar: pillar || null,
      story_type: storyType,
      source_url: sourceUrl.trim() || null,
      source_name: sourceName.trim() || null,
      featured_image_url: imageUrl.trim() || null,
      author: author.trim() || 'George Leith',
      seo_title: seoTitle.trim() || null,
      seo_description: seoDesc.trim() || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      is_featured: isFeatured,
      is_published: publish,
    }

    try {
      const url = isEdit ? `/api/admin/media/${initial?.id}` : '/api/admin/media'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Save failed')
        return
      }
      router.push('/admin/media')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initial?.id) return
    if (!window.confirm('Delete this story? This cannot be undone.')) return
    setSaving(true)
    await fetch(`/api/admin/media/${initial.id}`, { method: 'DELETE' })
    router.push('/admin/media')
    router.refresh()
  }

  return (
    <div className="max-w-3xl">
      {error && (
        <div className="mb-4 px-4 py-3 rounded text-[13px] font-body" style={{ backgroundColor: 'rgba(239,14,48,0.06)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.15)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Title <span className="text-[#ef0e30]">*</span></label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            onBlur={() => { if (!slug) setSlug(slugify(title)) }}
            className={inputClass} style={inputStyle} placeholder="Story title..."
          />
        </div>
        <div>
          <label className={labelClass}>Slug <span className="text-[#ef0e30]">*</span></label>
          <input
            type="text" value={slug} onChange={e => setSlug(e.target.value)}
            className={inputClass} style={inputStyle} placeholder="story-slug"
          />
          {pillar && slug && (
            <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">/media/{pillar}/{slug}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Story Type</label>
          <select value={storyType} onChange={e => setStoryType(e.target.value)} className={inputClass} style={inputStyle}>
            {STORY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Pillar</label>
          <select value={pillar} onChange={e => setPillar(e.target.value)} className={inputClass} style={inputStyle}>
            {PILLARS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {showSource && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Source URL</label>
            <input type="text" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className={inputClass} style={inputStyle} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Source Name</label>
            <input type="text" value={sourceName} onChange={e => setSourceName(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Harvard Business Review" />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className={labelClass}>Excerpt <span className="text-[#7a8a96]">(160 chars max)</span></label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value.slice(0, 160))} rows={2} className={inputClass} style={inputStyle} placeholder="Short summary for cards and meta description..." />
        <p className="font-condensed text-[10px] text-[#7a8a96] mt-0.5 text-right">{excerpt.length}/160</p>
      </div>

      <div className="mb-4">
        <label className={labelClass}>Article Body <span className="text-[#7a8a96]">(markdown)</span></label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={16} className={inputClass} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13 }} placeholder="# Article content in markdown..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Featured Image URL</label>
          <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClass} style={inputStyle} placeholder="https://..." />
        </div>
        <div>
          <label className={labelClass}>Author</label>
          <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>SEO Title <span className="text-[#7a8a96]">(defaults to title)</span></label>
          <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass}>SEO Description <span className="text-[#7a8a96]">(defaults to excerpt)</span></label>
          <input type="text" value={seoDesc} onChange={e => setSeoDesc(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>Tags <span className="text-[#7a8a96]">(comma-separated)</span></label>
        <input type="text" value={tags} onChange={e => setTags(e.target.value)} className={inputClass} style={inputStyle} placeholder="leadership, strategy, mindset" />
      </div>

      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-[#1b3c5a]" />
        <span className="font-condensed font-semibold text-[12px] text-[#1b3c5a]">Featured story</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button" onClick={() => handleSave(false)} disabled={saving}
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-6 py-2.5 rounded transition-all disabled:opacity-40"
          style={{ backgroundColor: 'rgba(27,60,90,0.08)', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.15)' }}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button" onClick={() => handleSave(true)} disabled={saving}
          className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-6 py-2.5 rounded transition-all disabled:opacity-40"
          style={{ backgroundColor: '#1b3c5a', color: '#fff' }}
        >
          {saving ? 'Publishing...' : 'Publish Now'}
        </button>
        {isEdit && (
          <button
            type="button" onClick={handleDelete} disabled={saving}
            className="font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-4 py-2.5 rounded ml-auto transition-all disabled:opacity-40"
            style={{ color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
