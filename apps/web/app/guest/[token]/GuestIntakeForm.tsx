'use client'

import { useState } from 'react'

const CREAM = '#F5F0E8'
const RED = '#C9302A'
const GOLD = '#C9A84C'
const dim = (a: number) => `rgba(245,240,232,${a})`

const TEE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export interface GuestIntakeInitial {
  first_name: string
  last_name: string
  company: string
  role_title: string
  one_liner: string
  short_bio: string
  headshot_url: string
  topics: string[]
  links: { label: string; url: string }[]
  av_notes: string
  tee_size: string
  linkedin_url: string
  twitter_handle: string
  consent_release: boolean
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(245,240,232,0.05)',
  border: `1px solid ${dim(0.14)}`,
  color: CREAM,
  borderRadius: 8,
  padding: '10px 12px',
  width: '100%',
  fontSize: 14,
}

export function GuestIntakeForm({
  token,
  initial,
  alreadySubmitted,
}: {
  token: string
  initial: GuestIntakeInitial
  alreadySubmitted: boolean
}) {
  const [f, setF] = useState<GuestIntakeInitial>({
    ...initial,
    topics: initial.topics.length ? initial.topics : [''],
    links: initial.links.length ? initial.links : [{ label: '', url: '' }],
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>(
    alreadySubmitted ? 'done' : 'idle',
  )
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [edit, setEdit] = useState(!alreadySubmitted)

  function set<K extends keyof GuestIntakeInitial>(key: K, val: GuestIntakeInitial[K]) {
    setF(prev => ({ ...prev, [key]: val }))
  }

  async function uploadHeadshot(file: File) {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('token', token)
      fd.append('file', file)
      const res = await fetch('/api/guest/upload', { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not upload your headshot.')
      } else {
        set('headshot_url', data.url)
      }
    } catch {
      setError('Network error uploading your headshot.')
    } finally {
      setUploading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'saving') return
    if (!f.consent_release) {
      setError('Please confirm the recording release to submit.')
      return
    }
    setStatus('saving')
    setError('')
    try {
      const res = await fetch('/api/guest/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          first_name: f.first_name,
          last_name: f.last_name,
          company: f.company,
          role_title: f.role_title,
          one_liner: f.one_liner,
          short_bio: f.short_bio,
          headshot_url: f.headshot_url,
          avatar_url: f.headshot_url,
          topics: f.topics.map(t => t.trim()).filter(Boolean),
          links: f.links.filter(l => l.url.trim()),
          av_notes: f.av_notes,
          tee_size: f.tee_size,
          linkedin_url: f.linkedin_url,
          twitter_handle: f.twitter_handle,
          consent_release: f.consent_release,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setStatus('error')
        setError(data.error ?? 'Could not save your submission. Please try again.')
        return
      }
      setStatus('done')
      setEdit(false)
    } catch {
      setStatus('error')
      setError('Network error — please try again.')
    }
  }

  if (status === 'done' && !edit) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.25)` }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-2" style={{ color: GOLD }}>
          You&rsquo;re all set
        </p>
        <h3 className="font-display font-bold text-2xl mb-2" style={{ color: CREAM }}>
          Thank you — we&rsquo;ve got everything we need.
        </h3>
        <p className="font-body text-[14px] mb-5" style={{ color: dim(0.6) }}>
          Our team will be in touch with recording details. Need to change something?
        </p>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setEdit(true) }}
          className="inline-block py-2.5 px-5 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[12px] transition-opacity hover:opacity-90"
          style={{ backgroundColor: dim(0.08), color: CREAM, border: `1px solid ${dim(0.16)}` }}
        >
          Edit my details
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Row>
        <Field label="First name">
          <input style={inputStyle} value={f.first_name} onChange={e => set('first_name', e.target.value)} />
        </Field>
        <Field label="Last name">
          <input style={inputStyle} value={f.last_name} onChange={e => set('last_name', e.target.value)} />
        </Field>
      </Row>

      <Row>
        <Field label="Role / title">
          <input style={inputStyle} placeholder="Founder & CEO" value={f.role_title} onChange={e => set('role_title', e.target.value)} />
        </Field>
        <Field label="Company">
          <input style={inputStyle} value={f.company} onChange={e => set('company', e.target.value)} />
        </Field>
      </Row>

      <Field label="One-liner" hint="A single sentence we can use to introduce you.">
        <input
          style={inputStyle}
          maxLength={280}
          placeholder="I help B2B teams turn their sellers into their #1 marketing channel."
          value={f.one_liner}
          onChange={e => set('one_liner', e.target.value)}
        />
      </Field>

      <Field label="Short bio" hint="2–4 sentences. This may appear in the show notes.">
        <textarea
          style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
          maxLength={2000}
          value={f.short_bio}
          onChange={e => set('short_bio', e.target.value)}
        />
      </Field>

      <Field label="Headshot" hint="A high-res photo, please — JPG or PNG, up to 8MB.">
        <div className="flex items-center gap-4">
          {f.headshot_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={f.headshot_url}
              alt="Your headshot"
              style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: `1px solid ${dim(0.16)}` }}
            />
          ) : null}
          <label
            className="inline-block py-2.5 px-4 rounded-lg font-condensed font-bold uppercase tracking-[0.08em] text-[12px] cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: dim(0.08), color: CREAM, border: `1px solid ${dim(0.16)}` }}
          >
            {uploading ? 'Uploading…' : f.headshot_url ? 'Replace photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={e => { const file = e.target.files?.[0]; if (file) uploadHeadshot(file) }}
            />
          </label>
        </div>
      </Field>

      <Field label="Topics you want to cover" hint="What are you excited to talk about?">
        <div className="grid gap-2">
          {f.topics.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input
                style={inputStyle}
                value={t}
                placeholder={`Topic ${i + 1}`}
                onChange={e => {
                  const next = [...f.topics]; next[i] = e.target.value; set('topics', next)
                }}
              />
              {f.topics.length > 1 && (
                <RemoveBtn onClick={() => set('topics', f.topics.filter((_, j) => j !== i))} />
              )}
            </div>
          ))}
          {f.topics.length < 8 && (
            <AddBtn label="Add topic" onClick={() => set('topics', [...f.topics, ''])} />
          )}
        </div>
      </Field>

      <Field label="Links" hint="Website, book, newsletter, anything you'd like us to mention.">
        <div className="grid gap-2">
          {f.links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                style={{ ...inputStyle, maxWidth: 150 }}
                value={l.label}
                placeholder="Label"
                onChange={e => {
                  const next = [...f.links]; next[i] = { ...next[i], label: e.target.value }; set('links', next)
                }}
              />
              <input
                style={inputStyle}
                value={l.url}
                placeholder="https://"
                onChange={e => {
                  const next = [...f.links]; next[i] = { ...next[i], url: e.target.value }; set('links', next)
                }}
              />
              {f.links.length > 1 && (
                <RemoveBtn onClick={() => set('links', f.links.filter((_, j) => j !== i))} />
              )}
            </div>
          ))}
          {f.links.length < 8 && (
            <AddBtn label="Add link" onClick={() => set('links', [...f.links, { label: '', url: '' }])} />
          )}
        </div>
      </Field>

      <Row>
        <Field label="LinkedIn URL">
          <input style={inputStyle} placeholder="https://linkedin.com/in/…" value={f.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} />
        </Field>
        <Field label="X / Twitter handle">
          <input style={inputStyle} placeholder="@handle" value={f.twitter_handle} onChange={e => set('twitter_handle', e.target.value)} />
        </Field>
      </Row>

      <Row>
        <Field label="A/V notes" hint="Anything we should know about your setup?">
          <input style={inputStyle} value={f.av_notes} onChange={e => set('av_notes', e.target.value)} />
        </Field>
        <Field label="Tee size" hint="For your guest swag.">
          <select
            style={{ ...inputStyle, appearance: 'auto' }}
            value={f.tee_size}
            onChange={e => set('tee_size', e.target.value)}
          >
            <option value="">Select…</option>
            {TEE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </Row>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={f.consent_release}
          onChange={e => set('consent_release', e.target.checked)}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: RED }}
        />
        <span className="font-body text-[13px]" style={{ color: dim(0.65) }}>
          I grant Evolved Pros permission to record, edit, and publish this conversation
          across the show and social channels. <span style={{ color: RED }}>*</span>
        </span>
      </label>

      {error && (
        <p className="font-body text-[13px]" style={{ color: RED }}>{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving' || uploading}
          className="inline-block py-3.5 px-8 rounded-lg font-condensed font-bold uppercase tracking-[0.1em] text-[13px] transition-opacity hover:opacity-90"
          style={{
            backgroundColor: RED,
            color: '#fff',
            opacity: status === 'saving' || uploading ? 0.6 : 1,
            cursor: status === 'saving' ? 'wait' : 'pointer',
          }}
        >
          {status === 'saving' ? 'Saving…' : alreadySubmitted ? 'Save changes' : 'Submit my details →'}
        </button>
      </div>
    </form>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-condensed font-bold uppercase tracking-[0.08em] text-[11px] mb-1.5" style={{ color: dim(0.8) }}>
        {label}
      </label>
      {children}
      {hint && <p className="font-body text-[12px] mt-1" style={{ color: dim(0.4) }}>{hint}</p>}
    </div>
  )
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="justify-self-start font-condensed font-bold uppercase tracking-[0.08em] text-[11px] py-1.5 px-3 rounded-md transition-opacity hover:opacity-80"
      style={{ color: GOLD, border: `1px dashed rgba(201,168,76,0.4)` }}
    >
      + {label}
    </button>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="shrink-0 rounded-md px-3 transition-opacity hover:opacity-80"
      style={{ color: dim(0.5), border: `1px solid ${dim(0.14)}` }}
    >
      ✕
    </button>
  )
}
