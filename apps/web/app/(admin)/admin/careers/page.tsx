'use client'

import { useState, useEffect, useCallback } from 'react'

interface Job {
  id: string
  title: string
  company: string
  location: string | null
  job_type: string | null
  salary_range: string | null
  description: string | null
  apply_url: string
  category: string | null
  is_featured: boolean
  status: string
  created_at: string
}

const EMPTY: Omit<Job, 'id' | 'created_at'> = {
  title: '', company: '', location: '', job_type: 'Full-time',
  salary_range: '', description: '', apply_url: '', category: 'Sales',
  is_featured: false, status: 'draft',
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote']
const CATEGORIES = ['Sales', 'Marketing', 'Leadership', 'RevOps', 'Customer Success', 'Other']

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Job> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/careers')
    if (res.ok) {
      const data = await res.json()
      setJobs(data.jobs ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setError('')
    const isNew = !editing.id
    const res = await fetch(
      isNew ? '/api/admin/careers' : `/api/admin/careers/${editing.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) },
    )
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Save failed')
    } else {
      setEditing(null)
      await fetchJobs()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing?')) return
    await fetch(`/api/admin/careers/${id}`, { method: 'DELETE' })
    await fetchJobs()
  }

  async function toggleStatus(job: Job) {
    const newStatus = job.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/careers/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await fetchJobs()
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '1px solid rgba(27,60,90,0.15)', borderRadius: 4,
    outline: 'none', fontFamily: 'var(--font-body)',
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="font-condensed font-bold text-[22px]" style={{ color: '#1b3c5a' }}>Job Listings</h1>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY })}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded"
          style={{ backgroundColor: '#C9A84C', color: '#0A0F18' }}
        >
          Add New Listing
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(27,60,90,0.1)', borderRadius: 6, padding: 20, marginBottom: 20 }}>
          <h2 className="font-condensed font-bold text-[14px] mb-3" style={{ color: '#1b3c5a' }}>
            {editing.id ? 'Edit Listing' : 'New Listing'}
          </h2>
          {error && <p className="text-[12px] mb-2" style={{ color: '#ef0e30' }}>{error}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Title *</label>
              <input style={inputStyle} value={editing.title ?? ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Company *</label>
              <input style={inputStyle} value={editing.company ?? ''} onChange={e => setEditing(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Location</label>
              <input style={inputStyle} value={editing.location ?? ''} onChange={e => setEditing(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Remote · USA" />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Apply URL *</label>
              <input style={inputStyle} value={editing.apply_url ?? ''} onChange={e => setEditing(p => ({ ...p, apply_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Job Type</label>
              <select style={inputStyle} value={editing.job_type ?? 'Full-time'} onChange={e => setEditing(p => ({ ...p, job_type: e.target.value }))}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Category</label>
              <select style={inputStyle} value={editing.category ?? 'Sales'} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Salary Range</label>
              <input style={inputStyle} value={editing.salary_range ?? ''} onChange={e => setEditing(p => ({ ...p, salary_range: e.target.value }))} placeholder="e.g. $90K–$120K + OTE" />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Status</label>
              <select style={inputStyle} value={editing.status ?? 'draft'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={editing.description ?? ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1b3c5a' }}>
              <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing(p => ({ ...p, is_featured: e.target.checked }))} />
              Featured
            </label>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={() => setEditing(null)} className="font-condensed text-[11px] px-4 py-1.5" style={{ color: 'rgba(27,60,90,0.5)' }}>Cancel</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="font-condensed font-bold uppercase tracking-wide text-[11px] px-5 py-2 rounded"
              style={{ backgroundColor: '#C9A84C', color: '#0A0F18', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>No job listings yet.</p>
      ) : (
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(27,60,90,0.1)', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
                {['Title', 'Company', 'Location', 'Type', 'Status', '⭐', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(27,60,90,0.45)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1b3c5a' }}>{j.title}</td>
                  <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.6)' }}>{j.company}</td>
                  <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.5)' }}>{j.location ?? '—'}</td>
                  <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.5)' }}>{j.job_type ?? '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button type="button" onClick={() => toggleStatus(j)} style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2, border: 'none', cursor: 'pointer', backgroundColor: j.status === 'published' ? 'rgba(10,191,163,0.12)' : 'rgba(27,60,90,0.06)', color: j.status === 'published' ? '#0F6E56' : 'rgba(27,60,90,0.4)' }}>
                      {j.status}
                    </button>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{j.is_featured ? '⭐' : ''}</td>
                  <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.4)', fontSize: 10 }}>{new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => setEditing(j)} style={{ fontSize: 10, color: '#68a2b9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}>Edit</button>
                      <button type="button" onClick={() => handleDelete(j.id)} style={{ fontSize: 10, color: '#ef0e30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
