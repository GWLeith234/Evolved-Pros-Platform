'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  newSpeakingDateId,
  type UpcomingDateStored,
} from '@/lib/live/upcoming-dates-shared'

const EMPTY = (): UpcomingDateStored => ({
  id: newSpeakingDateId(),
  date: '',
  city: '',
  country: '',
  event: '',
  tag: 'CONFIRMED',
  detail: '',
  linkLabel: '',
  linkUrl: '',
})

/**
 * Admin calendar for /live “Upcoming speaking events”.
 * Past rows stay in the list (for history) but /live only renders date ≥ today.
 */
export default function AdminSpeakingPage() {
  const [dates, setDates] = useState<UpcomingDateStored[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<UpcomingDateStored | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchDates = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/speaking')
    if (res.ok) {
      const data = (await res.json()) as { dates?: UpcomingDateStored[] }
      setDates(data.dates ?? [])
    } else {
      setError('Failed to load speaking dates')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchDates()
  }, [fetchDates])

  async function persist(next: UpcomingDateStored[]) {
    setSaving(true)
    setError('')
    setNotice('')
    const res = await fetch('/api/admin/speaking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: next }),
    })
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      setError(d.error ?? 'Save failed')
      setSaving(false)
      return false
    }
    const data = (await res.json()) as { dates?: UpcomingDateStored[] }
    setDates(data.dates ?? next)
    setSaving(false)
    setNotice('Saved — live page will pick this up within a few minutes (or sooner after cache refresh).')
    return true
  }

  async function handleSave() {
    if (!editing) return
    if (!editing.event.trim() || !editing.city.trim() || !editing.date.trim()) {
      setError('Event, city, and date are required')
      return
    }
    const row: UpcomingDateStored = {
      ...editing,
      event: editing.event.trim(),
      city: editing.city.trim(),
      country: editing.country.trim(),
      detail: editing.detail?.trim() || undefined,
      linkLabel: editing.linkLabel?.trim() || undefined,
      linkUrl: editing.linkUrl?.trim() || undefined,
    }
    const without = dates.filter(d => d.id !== row.id)
    const ok = await persist([...without, row])
    if (ok) {
      setEditing(null)
      setIsNew(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this speaking date from /live?')) return
    await persist(dates.filter(d => d.id !== id))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function isPast(iso: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return false
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return d.getTime() < today.getTime()
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid rgba(27,60,90,0.15)',
    borderRadius: 4,
    outline: 'none',
    fontFamily: 'var(--font-body)',
  } as const

  return (
    <div style={{ padding: '24px 32px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 className="font-condensed font-bold text-[22px]" style={{ color: 'var(--admin-text)' }}>
          Speaking dates
        </h1>
        <button
          type="button"
          onClick={() => {
            setEditing(EMPTY())
            setIsNew(true)
            setError('')
            setNotice('')
          }}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded"
          style={{ backgroundColor: '#C9A84C', color: '#0A0F18' }}
        >
          Add date
        </button>
      </div>
      <p className="font-body text-[13px] mb-5" style={{ color: 'rgba(27,60,90,0.55)', maxWidth: 640, lineHeight: 1.5 }}>
        Powers the <strong>Upcoming speaking events</strong> list on <code>/live</code>.
        Only stage / conference / workshop dates — not podcast or product launches.
        Dates before today stay here for your records but are hidden on the public page.
        When a date passes, add the city to the globe pins in code if it is new.
      </p>

      {notice && (
        <p className="text-[12px] mb-3" style={{ color: '#0F6E56' }}>
          {notice}
        </p>
      )}
      {error && !editing && (
        <p className="text-[12px] mb-3" style={{ color: '#ef0e30' }}>
          {error}
        </p>
      )}

      {editing && (
        <div
          style={{
            backgroundColor: 'var(--admin-card)',
            border: '1px solid rgba(27,60,90,0.1)',
            borderRadius: 6,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2 className="font-condensed font-bold text-[14px] mb-3" style={{ color: 'var(--admin-text)' }}>
            {isNew ? 'New speaking date' : 'Edit speaking date'}
          </h2>
          {error && (
            <p className="text-[12px] mb-2" style={{ color: '#ef0e30' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Event title *
              </label>
              <input
                style={inputStyle}
                value={editing.event}
                onChange={e => setEditing(p => (p ? { ...p, event: e.target.value } : p))}
                placeholder="e.g. TVOT Conference"
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Date *
              </label>
              <input
                type="date"
                style={inputStyle}
                value={editing.date}
                onChange={e => setEditing(p => (p ? { ...p, date: e.target.value } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                City *
              </label>
              <input
                style={inputStyle}
                value={editing.city}
                onChange={e => setEditing(p => (p ? { ...p, city: e.target.value } : p))}
                placeholder="Montreal"
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Country
              </label>
              <input
                style={inputStyle}
                value={editing.country}
                onChange={e => setEditing(p => (p ? { ...p, country: e.target.value } : p))}
                placeholder="Canada"
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Status
              </label>
              <select
                style={inputStyle}
                value={editing.tag}
                onChange={e =>
                  setEditing(p =>
                    p ? { ...p, tag: e.target.value === 'HOLD' ? 'HOLD' : 'CONFIRMED' } : p,
                  )
                }
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="HOLD">Hold</option>
              </select>
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Link label
              </label>
              <input
                style={inputStyle}
                value={editing.linkLabel ?? ''}
                onChange={e => setEditing(p => (p ? { ...p, linkLabel: e.target.value } : p))}
                placeholder="Conference site"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Link URL
              </label>
              <input
                style={inputStyle}
                value={editing.linkUrl ?? ''}
                onChange={e => setEditing(p => (p ? { ...p, linkUrl: e.target.value } : p))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
              Short detail (optional)
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={editing.detail ?? ''}
              onChange={e => setEditing(p => (p ? { ...p, detail: e.target.value } : p))}
              placeholder="One or two sentences for the public card."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setIsNew(false)
                setError('')
              }}
              className="font-condensed text-[11px] px-4 py-1.5"
              style={{ color: 'rgba(27,60,90,0.5)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="font-condensed font-bold uppercase tracking-wide text-[11px] px-5 py-2 rounded"
              style={{ backgroundColor: '#C9A84C', color: '#0A0F18', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>
          Loading…
        </p>
      ) : dates.length === 0 ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>
          No speaking dates yet. Add one when a stage date is locked.
        </p>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--admin-card)',
            border: '1px solid rgba(27,60,90,0.1)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
                {['Date', 'Event', 'Location', 'Status', 'On /live', 'Actions'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-condensed)',
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'rgba(27,60,90,0.45)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...dates]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(d => {
                  const past = isPast(d.date)
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(27,60,90,0.06)', opacity: past ? 0.65 : 1 }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>
                        {d.date}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--admin-text)' }}>{d.event}</td>
                      <td style={{ padding: '8px 10px', color: 'rgba(27,60,90,0.55)' }}>
                        {d.country ? `${d.city}, ${d.country}` : d.city}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: 'var(--font-condensed)',
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: 2,
                            backgroundColor:
                              d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.12)' : 'rgba(201,168,76,0.15)',
                            color: d.tag === 'CONFIRMED' ? '#0F6E56' : '#8B6A00',
                          }}
                        >
                          {d.tag}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: past ? 'rgba(27,60,90,0.4)' : '#0F6E56', fontSize: 11 }}>
                        {past ? 'Hidden (past)' : 'Showing'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing({ ...d })
                              setIsNew(false)
                              setError('')
                              setNotice('')
                            }}
                            style={{
                              fontSize: 10,
                              color: '#68a2b9',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-condensed)',
                              fontWeight: 600,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(d.id)}
                            style={{
                              fontSize: 10,
                              color: '#ef0e30',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-condensed)',
                              fontWeight: 600,
                            }}
                          >
                            Del
                          </button>
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
