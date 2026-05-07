'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const SURFACES = [
  { value: 'home',    label: 'Home' },
  { value: 'rail',    label: 'Right rail' },
  { value: 'events',  label: 'Events' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'academy', label: 'Academy' },
] as const
type Surface = typeof SURFACES[number]['value']

export interface PartnerFormValues {
  id?: string
  name: string
  url: string
  logo_url: string
  brand_color: string
  type: 'sponsor' | 'affiliate'
  tagline: string
  body_copy: string
  cta_text: string
  cta_url: string
  status: 'active' | 'paused' | 'expired'
  contract_start: string
  contract_end: string
  impression_cap: string
  commission_pct: string
  tracking_id: string
  surfaces: Surface[]
}

const EMPTY: PartnerFormValues = {
  name: '',
  url: '',
  logo_url: '',
  brand_color: '#1b3c5a',
  type: 'sponsor',
  tagline: '',
  body_copy: '',
  cta_text: 'Learn more',
  cta_url: '',
  status: 'active',
  contract_start: '',
  contract_end: '',
  impression_cap: '',
  commission_pct: '',
  tracking_id: '',
  surfaces: ['home'],
}

const inputClass = 'w-full rounded px-3 py-2 font-body text-[13px] text-[#1b3c5a] outline-none transition-all'
const inputStyle: React.CSSProperties = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }
const labelClass = 'block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5'

export function PartnerForm({ initial }: { initial?: Partial<PartnerFormValues> & { id?: string } }) {
  const router = useRouter()
  const [values, setValues] = useState<PartnerFormValues>({ ...EMPTY, ...initial })
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isEdit = !!initial?.id

  function set<K extends keyof PartnerFormValues>(k: K, v: PartnerFormValues[K]) {
    setValues(prev => ({ ...prev, [k]: v }))
  }

  function toggleSurface(s: Surface) {
    setValues(prev => ({
      ...prev,
      surfaces: prev.surfaces.includes(s)
        ? prev.surfaces.filter(x => x !== s)
        : [...prev.surfaces, s],
    }))
  }

  async function handleExtract() {
    if (!values.url.trim()) {
      setExtractError('Enter a URL first.')
      return
    }
    setExtracting(true)
    setExtractError(null)
    try {
      const res = await fetch('/api/admin/partners/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: values.url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Extract failed')
      setValues(prev => ({
        ...prev,
        name:        prev.name        || (data.brand_name as string ?? ''),
        logo_url:    prev.logo_url    || (data.logo_url as string ?? ''),
        brand_color: data.brand_color || prev.brand_color,
        tagline:     data.tagline   ?? prev.tagline,
        body_copy:   data.body_copy ?? prev.body_copy,
        cta_text:    data.cta_text  || prev.cta_text,
        cta_url:     prev.cta_url   || prev.url,
      }))
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extract failed')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    if (!values.name.trim()) {
      setSaveError('Name is required.')
      return
    }
    setSaving(true)
    setSaveError(null)

    const payload = {
      name: values.name.trim(),
      url: values.url.trim() || null,
      logo_url: values.logo_url.trim() || null,
      brand_color: values.brand_color.trim() || null,
      type: values.type,
      tagline: values.tagline.trim() || null,
      body_copy: values.body_copy.trim() || null,
      cta_text: values.cta_text.trim() || null,
      cta_url: values.cta_url.trim() || values.url.trim() || null,
      status: values.status,
      contract_start: values.contract_start || null,
      contract_end: values.contract_end || null,
      impression_cap: values.impression_cap ? parseInt(values.impression_cap, 10) : null,
      commission_pct: values.commission_pct ? parseFloat(values.commission_pct) : null,
      tracking_id: values.tracking_id.trim() || null,
      surfaces: values.surfaces,
    }

    try {
      const res = isEdit
        ? await fetch(`/api/admin/partners/${initial!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Save failed')
      router.push('/admin/partners')
      router.refresh()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!window.confirm('Set this partner to expired? This is reversible from the edit page.')) return
    setSaving(true)
    try {
      await fetch(`/api/admin/partners/${initial!.id}`, { method: 'DELETE' })
      router.push('/admin/partners')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const isAffiliate = values.type === 'affiliate'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start max-w-6xl">
      {/* LEFT — form */}
      <div className="space-y-5">
        {/* Type toggle */}
        <div>
          <label className={labelClass}>Type</label>
          <div className="flex gap-2">
            {(['sponsor', 'affiliate'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 flex-1 transition-all"
                style={{
                  backgroundColor: values.type === t ? '#1b3c5a' : 'transparent',
                  color: values.type === t ? 'white' : '#1b3c5a',
                  border: '1px solid rgba(27,60,90,0.25)',
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* URL + Generate */}
        <div>
          <label className={labelClass}>URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={values.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://example.com"
              className={`${inputClass} flex-1`}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting || !values.url.trim()}
              className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all disabled:opacity-50 whitespace-nowrap"
              style={{ backgroundColor: '#0ABFA3', color: '#0A0F18' }}
            >
              {extracting ? 'Generating…' : isEdit ? 'Re-generate' : 'Generate'}
            </button>
          </div>
          {extractError && (
            <p className="mt-1 font-condensed text-[11px]" style={{ color: '#ef0e30' }}>{extractError}</p>
          )}
        </div>

        {/* Name + Brand color */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-3">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={values.name}
              onChange={e => set('name', e.target.value)}
              maxLength={200}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Brand color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={values.brand_color || '#1b3c5a'}
                onChange={e => set('brand_color', e.target.value)}
                style={{ width: 44, height: 38, padding: 0, border: '1px solid rgba(27,60,90,0.2)', background: 'white', borderRadius: 4 }}
              />
              <input
                type="text"
                value={values.brand_color}
                onChange={e => set('brand_color', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className={labelClass}>Logo URL</label>
          <input
            type="url"
            value={values.logo_url}
            onChange={e => set('logo_url', e.target.value)}
            placeholder="https://…"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Tagline */}
        <div>
          <label className={labelClass}>Tagline (serif, 6–8 words)</label>
          <input
            type="text"
            value={values.tagline}
            onChange={e => set('tagline', e.target.value)}
            maxLength={200}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Body copy */}
        <div>
          <label className={labelClass}>Body copy (why pros use it)</label>
          <textarea
            value={values.body_copy}
            onChange={e => set('body_copy', e.target.value)}
            rows={3}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
          <div>
            <label className={labelClass}>CTA text</label>
            <input
              type="text"
              value={values.cta_text}
              onChange={e => set('cta_text', e.target.value)}
              maxLength={64}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>CTA URL <span className="text-[#7a8a96]">(falls back to URL)</span></label>
            <input
              type="url"
              value={values.cta_url}
              onChange={e => set('cta_url', e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Surfaces */}
        <div>
          <label className={labelClass}>Placements</label>
          <div className="flex flex-wrap gap-2">
            {SURFACES.map(s => {
              const active = values.surfaces.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSurface(s.value)}
                  className="font-condensed font-bold uppercase tracking-wide text-[10px] rounded-full px-3 py-1 transition-all"
                  style={{
                    backgroundColor: active ? '#1b3c5a' : 'transparent',
                    color: active ? 'white' : '#1b3c5a',
                    border: '1px solid rgba(27,60,90,0.25)',
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Affiliate-only block */}
        {isAffiliate && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ backgroundColor: 'rgba(10,191,163,0.04)', border: '1px solid rgba(10,191,163,0.2)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]" style={{ color: '#0ABFA3' }}>
              Affiliate terms
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Commission %</label>
                <input
                  type="number"
                  step="0.01"
                  value={values.commission_pct}
                  onChange={e => set('commission_pct', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass}>Tracking ID</label>
                <input
                  type="text"
                  value={values.tracking_id}
                  onChange={e => set('tracking_id', e.target.value)}
                  maxLength={200}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sponsor-only contract block */}
        {!isAffiliate && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ backgroundColor: 'rgba(27,60,90,0.04)', border: '1px solid rgba(27,60,90,0.12)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]" style={{ color: '#1b3c5a' }}>
              Sponsor contract
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Start</label>
                <input
                  type="date"
                  value={values.contract_start}
                  onChange={e => set('contract_start', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass}>End</label>
                <input
                  type="date"
                  value={values.contract_end}
                  onChange={e => set('contract_end', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass}>Impression cap</label>
                <input
                  type="number"
                  value={values.impression_cap}
                  onChange={e => set('impression_cap', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <div className="flex gap-2">
            {(['active', 'paused', 'expired'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-3 py-1.5 transition-all"
                style={{
                  backgroundColor: values.status === s ? '#1b3c5a' : 'transparent',
                  color: values.status === s ? 'white' : '#1b3c5a',
                  border: '1px solid rgba(27,60,90,0.25)',
                }}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {saveError && (
          <p
            role="alert"
            aria-live="polite"
            className="rounded px-3 py-2 font-body text-[12px]"
            style={{ backgroundColor: 'rgba(239,14,48,0.06)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.15)' }}
          >
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px]"
              style={{ color: '#ef0e30' }}
            >
              Mark expired
            </button>
          ) : <span />}
          <div className="flex items-center gap-3">
            <a
              href="/admin/partners"
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a]"
            >
              Cancel
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all disabled:opacity-60"
              style={{ backgroundColor: '#1b3c5a', color: 'white' }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create partner'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT — live preview */}
      <div className="lg:sticky lg:top-4 self-start">
        <p className={labelClass}>Preview</p>
        <PartnerPreview values={values} />
      </div>
    </div>
  )
}

function PartnerPreview({ values }: { values: PartnerFormValues }) {
  const accent = values.brand_color || '#1b3c5a'
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: '#0A0F18',
        border: `1px solid ${accent}55`,
        color: '#fff',
      }}
    >
      <div style={{ height: 3, background: accent }} />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          {values.logo_url ? (
            <Image
              src={values.logo_url}
              alt={values.name}
              width={40}
              height={40}
              style={{ width: 40, height: 40, objectFit: 'contain', background: '#fff', borderRadius: 4 }}
            />
          ) : (
            <div
              style={{
                width: 40, height: 40, borderRadius: 4, background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: '#fff',
              }}
            >
              {(values.name || '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]" style={{ color: accent }}>
              {values.type === 'affiliate' ? 'Affiliate partner' : 'Sponsor'}
            </p>
            <p className="font-display font-bold text-[16px]" style={{ color: '#fff' }}>
              {values.name || 'Brand name'}
            </p>
          </div>
        </div>

        {values.tagline && (
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 18,
              fontStyle: 'italic',
              color: '#fff',
              lineHeight: 1.3,
            }}
          >
            {values.tagline}
          </p>
        )}

        {values.body_copy && (
          <p style={{ fontFamily: '"Barlow", sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            {values.body_copy}
          </p>
        )}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: accent,
            color: '#fff',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            borderRadius: 2,
          }}
        >
          {values.cta_text || 'Learn more'} →
        </div>
      </div>
    </div>
  )
}
