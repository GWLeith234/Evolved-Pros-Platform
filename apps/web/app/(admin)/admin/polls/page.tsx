'use client'

import { useState, useEffect, useCallback } from 'react'

interface PollOption { id: string; option_text: string; vote_count: number; display_order: number }
interface Poll {
  id: string; question: string; context: string; status: string
  closes_at: string | null; created_at: string; poll_options: PollOption[]
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ question: string; context: string; options: string[]; closes_at: string; status: string; id?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchPolls = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/polls')
    if (res.ok) {
      const data = await res.json()
      setPolls(data.polls ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPolls() }, [fetchPolls])

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setError('')
    const isNew = !editing.id
    const res = await fetch(
      isNew ? '/api/admin/polls' : `/api/admin/polls/${editing.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) },
    )
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Save failed')
    } else {
      setEditing(null)
      await fetchPolls()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this poll and all its votes?')) return
    await fetch(`/api/admin/polls/${id}`, { method: 'DELETE' })
    await fetchPolls()
  }

  async function handleClose(id: string) {
    await fetch(`/api/admin/polls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    await fetchPolls()
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '1px solid rgba(27,60,90,0.15)', borderRadius: 4,
    outline: 'none', fontFamily: 'var(--font-body)',
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="font-condensed font-bold text-[22px]" style={{ color: 'var(--admin-text)' }}>Polls</h1>
        <button
          type="button"
          onClick={() => setEditing({ question: '', context: 'community', options: ['', ''], closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), status: 'active' })}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded"
          style={{ backgroundColor: '#C9A84C', color: '#0A0F18' }}
        >
          Create Poll
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)', borderRadius: 6, padding: 20, marginBottom: 20 }}>
          <h2 className="font-condensed font-bold text-[14px] mb-3" style={{ color: 'var(--admin-text)' }}>
            {editing.id ? 'Edit Poll' : 'New Poll'}
          </h2>
          {error && <p className="text-[12px] mb-2" style={{ color: '#ef0e30' }}>{error}</p>}
          <div style={{ marginBottom: 12 }}>
            <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Question *</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={editing.question} onChange={e => setEditing(p => p ? { ...p, question: e.target.value } : p)} maxLength={200} />
            <span className="text-[10px]" style={{ color: 'rgba(27,60,90,0.3)' }}>{editing.question.length}/200</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Context</label>
              <select style={inputStyle} value={editing.context} onChange={e => setEditing(p => p ? { ...p, context: e.target.value } : p)}>
                <option value="community">Community feed</option>
                <option value="media">Media sidebar</option>
              </select>
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Status</label>
              <select style={inputStyle} value={editing.status} onChange={e => setEditing(p => p ? { ...p, status: e.target.value } : p)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Closes at</label>
              <input type="datetime-local" style={inputStyle} value={editing.closes_at} onChange={e => setEditing(p => p ? { ...p, closes_at: e.target.value } : p)} />
            </div>
          </div>
          {!editing.id && (
            <div style={{ marginBottom: 12 }}>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>Options (2–6) *</label>
              {editing.options.map((opt, i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <input style={inputStyle} value={opt} onChange={e => setEditing(p => { if (!p) return p; const next = [...p.options]; next[i] = e.target.value; return { ...p, options: next } })} placeholder={`Option ${i + 1}`} />
                  {editing.options.length > 2 && (
                    <button type="button" onClick={() => setEditing(p => { if (!p) return p; return { ...p, options: p.options.filter((_, j) => j !== i) } })} className="text-[11px]" style={{ color: '#ef0e30' }}>×</button>
                  )}
                </div>
              ))}
              {editing.options.length < 6 && (
                <button type="button" onClick={() => setEditing(p => p ? { ...p, options: [...p.options, ''] } : p)} className="font-condensed text-[10px]" style={{ color: '#68a2b9' }}>+ Add option</button>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setEditing(null)} className="font-condensed text-[11px] px-4 py-1.5" style={{ color: 'rgba(27,60,90,0.5)' }}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="font-condensed font-bold uppercase tracking-wide text-[11px] px-5 py-2 rounded" style={{ backgroundColor: '#C9A84C', color: '#0A0F18', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>Loading...</p>
      ) : polls.length === 0 ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>No polls yet.</p>
      ) : (
        <div style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
                {['Question', 'Context', 'Status', 'Options', 'Votes', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(27,60,90,0.45)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {polls.map(p => {
                const totalVotes = (p.poll_options ?? []).reduce((s, o) => s + (o.vote_count ?? 0), 0)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--admin-text)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.question}</td>
                    <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.5)' }}>{p.context}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2, backgroundColor: p.status === 'active' ? 'rgba(10,191,163,0.12)' : p.status === 'draft' ? 'rgba(201,168,76,0.12)' : 'rgba(27,60,90,0.06)', color: p.status === 'active' ? '#0F6E56' : p.status === 'draft' ? '#AA8C3C' : 'rgba(27,60,90,0.4)' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.5)' }}>{(p.poll_options ?? []).length}</td>
                    <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.5)' }}>{totalVotes}</td>
                    <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.4)', fontSize: 10 }}>{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => setEditing({ question: p.question, context: p.context, options: (p.poll_options ?? []).map(o => o.option_text), closes_at: p.closes_at ?? '', status: p.status, id: p.id })} style={{ fontSize: 10, color: '#68a2b9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}>Edit</button>
                        {p.status === 'active' && (
                          <button type="button" onClick={() => handleClose(p.id)} style={{ fontSize: 10, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}>Close</button>
                        )}
                        <button type="button" onClick={() => handleDelete(p.id)} style={{ fontSize: 10, color: '#ef0e30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}>Del</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
