'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  newSpeakingDateId,
  type UpcomingDateStored,
} from '@/lib/live/upcoming-dates-shared'
import { newPinId, type SpeakingPinStored } from '@/lib/live/speaking-pins-shared'

type Tab = 'dates' | 'pins'

const EMPTY_DATE = (): UpcomingDateStored => ({
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

const EMPTY_PIN = (): SpeakingPinStored => ({
  id: newPinId(),
  city: '',
  country: '',
  lat: 0,
  lon: 0,
  featured: false,
})

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  border: '1px solid rgba(27,60,90,0.15)',
  borderRadius: 4,
  outline: 'none',
  fontFamily: 'var(--font-body)',
} as const

/**
 * Admin for /live: upcoming speaking dates + extra globe pins.
 */
export default function AdminSpeakingPage() {
  const [tab, setTab] = useState<Tab>('dates')
  const [dates, setDates] = useState<UpcomingDateStored[]>([])
  const [pins, setPins] = useState<SpeakingPinStored[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDate, setEditingDate] = useState<UpcomingDateStored | null>(null)
  const [editingPin, setEditingPin] = useState<SpeakingPinStored | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchDates = useCallback(async () => {
    const res = await fetch('/api/admin/speaking')
    if (res.ok) {
      const data = (await res.json()) as { dates?: UpcomingDateStored[] }
      setDates(data.dates ?? [])
    } else {
      setError('Failed to load speaking dates')
    }
  }, [])

  const fetchPins = useCallback(async () => {
    const res = await fetch('/api/admin/speaking/pins')
    if (res.ok) {
      const data = (await res.json()) as { pins?: SpeakingPinStored[] }
      setPins(data.pins ?? [])
    } else {
      setError('Failed to load map pins')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void Promise.all([fetchDates(), fetchPins()]).finally(() => setLoading(false))
  }, [fetchDates, fetchPins])

  async function persistDates(next: UpcomingDateStored[]) {
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
    setNotice('Dates saved — /live updates within a few minutes.')
    return true
  }

  async function persistPins(next: SpeakingPinStored[]) {
    setSaving(true)
    setError('')
    setNotice('')
    const res = await fetch('/api/admin/speaking/pins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pins: next }),
    })
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      setError(d.error ?? 'Save failed')
      setSaving(false)
      return false
    }
    const data = (await res.json()) as { pins?: SpeakingPinStored[] }
    setPins(data.pins ?? next)
    setSaving(false)
    setNotice('Pins saved — globe and city archive pick them up shortly.')
    return true
  }

  async function handleSaveDate() {
    if (!editingDate) return
    if (!editingDate.event.trim() || !editingDate.city.trim() || !editingDate.date.trim()) {
      setError('Event, city, and date are required')
      return
    }
    const row: UpcomingDateStored = {
      ...editingDate,
      event: editingDate.event.trim(),
      city: editingDate.city.trim(),
      country: editingDate.country.trim(),
      detail: editingDate.detail?.trim() || undefined,
      linkLabel: editingDate.linkLabel?.trim() || undefined,
      linkUrl: editingDate.linkUrl?.trim() || undefined,
    }
    const ok = await persistDates([...dates.filter(d => d.id !== row.id), row])
    if (ok) {
      setEditingDate(null)
      setIsNew(false)
    }
  }

  async function handleSavePin() {
    if (!editingPin) return
    if (!editingPin.city.trim() || !editingPin.country.trim()) {
      setError('City and country are required')
      return
    }
    if (!Number.isFinite(editingPin.lat) || !Number.isFinite(editingPin.lon)) {
      setError('Valid lat / lon are required')
      return
    }
    const row: SpeakingPinStored = {
      ...editingPin,
      city: editingPin.city.trim(),
      country: editingPin.country.trim(),
    }
    const ok = await persistPins([...pins.filter(p => p.id !== row.id), row])
    if (ok) {
      setEditingPin(null)
      setIsNew(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  function isPast(iso: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return false
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return d.getTime() < today.getTime()
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 className="font-condensed font-bold text-[22px]" style={{ color: 'var(--admin-text)' }}>
          Speaking
        </h1>
        <button
          type="button"
          onClick={() => {
            setError('')
            setNotice('')
            if (tab === 'dates') {
              setEditingDate(EMPTY_DATE())
              setEditingPin(null)
            } else {
              setEditingPin(EMPTY_PIN())
              setEditingDate(null)
            }
            setIsNew(true)
          }}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded"
          style={{ backgroundColor: '#C9A84C', color: '#0A0F18' }}
        >
          {tab === 'dates' ? 'Add date' : 'Add pin'}
        </button>
      </div>

      <p className="font-body text-[13px] mb-4" style={{ color: 'rgba(27,60,90,0.55)', maxWidth: 680, lineHeight: 1.5 }}>
        Powers <strong>/live</strong>. Dates = upcoming stage calendar (confirmed + holds).
        Pins = cities added to the globe beyond the built-in catalogue (same city+country replaces a base pin).
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(
          [
            ['dates', 'Upcoming dates'],
            ['pins', 'Map pins'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              setEditingDate(null)
              setEditingPin(null)
              setError('')
              setNotice('')
            }}
            className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded"
            style={{
              backgroundColor: tab === id ? 'rgba(27,60,90,0.1)' : 'transparent',
              color: tab === id ? 'var(--admin-text)' : 'rgba(27,60,90,0.45)',
              border: '1px solid rgba(27,60,90,0.12)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <p className="text-[12px] mb-3" style={{ color: '#0F6E56' }}>
          {notice}
        </p>
      )}
      {error && !editingDate && !editingPin && (
        <p className="text-[12px] mb-3" style={{ color: '#ef0e30' }}>
          {error}
        </p>
      )}

      {tab === 'dates' && editingDate && (
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
                value={editingDate.event}
                onChange={e => setEditingDate(p => (p ? { ...p, event: e.target.value } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Date *
              </label>
              <input
                type="date"
                style={inputStyle}
                value={editingDate.date}
                onChange={e => setEditingDate(p => (p ? { ...p, date: e.target.value } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                City *
              </label>
              <input
                style={inputStyle}
                value={editingDate.city}
                onChange={e => setEditingDate(p => (p ? { ...p, city: e.target.value } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Country
              </label>
              <input
                style={inputStyle}
                value={editingDate.country}
                onChange={e => setEditingDate(p => (p ? { ...p, country: e.target.value } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Status
              </label>
              <select
                style={inputStyle}
                value={editingDate.tag}
                onChange={e =>
                  setEditingDate(p =>
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
                value={editingDate.linkLabel ?? ''}
                onChange={e => setEditingDate(p => (p ? { ...p, linkLabel: e.target.value } : p))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Link URL
              </label>
              <input
                style={inputStyle}
                value={editingDate.linkUrl ?? ''}
                onChange={e => setEditingDate(p => (p ? { ...p, linkUrl: e.target.value } : p))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
              Short detail
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={editingDate.detail ?? ''}
              onChange={e => setEditingDate(p => (p ? { ...p, detail: e.target.value } : p))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setEditingDate(null)} className="font-condensed text-[11px] px-4 py-1.5" style={{ color: 'rgba(27,60,90,0.5)' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSaveDate()}
              disabled={saving}
              className="font-condensed font-bold uppercase tracking-wide text-[11px] px-5 py-2 rounded"
              style={{ backgroundColor: '#C9A84C', color: '#0A0F18', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'pins' && editingPin && (
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
            {isNew ? 'Add globe pin' : 'Edit globe pin'}
          </h2>
          {error && (
            <p className="text-[12px] mb-2" style={{ color: '#ef0e30' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                City *
              </label>
              <input
                style={inputStyle}
                value={editingPin.city}
                onChange={e => setEditingPin(p => (p ? { ...p, city: e.target.value } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Country *
              </label>
              <input
                style={inputStyle}
                value={editingPin.country}
                onChange={e => setEditingPin(p => (p ? { ...p, country: e.target.value } : p))}
                placeholder="USA"
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                style={inputStyle}
                value={editingPin.lat}
                onChange={e => setEditingPin(p => (p ? { ...p, lat: Number(e.target.value) } : p))}
              />
            </div>
            <div>
              <label className="font-condensed text-[10px] uppercase" style={{ color: 'rgba(27,60,90,0.5)' }}>
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                style={inputStyle}
                value={editingPin.lon}
                onChange={e => setEditingPin(p => (p ? { ...p, lon: Number(e.target.value) } : p))}
              />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--admin-text)', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={editingPin.featured ?? false}
              onChange={e => setEditingPin(p => (p ? { ...p, featured: e.target.checked } : p))}
            />
            Featured (red pulse on globe)
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setEditingPin(null)} className="font-condensed text-[11px] px-4 py-1.5" style={{ color: 'rgba(27,60,90,0.5)' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSavePin()}
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
      ) : tab === 'dates' ? (
        dates.length === 0 ? (
          <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>
            No speaking dates yet. Add a confirmed or hold date when a stage is locked.
          </p>
        ) : (
          <div style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
                  {['Date', 'Event', 'Location', 'Status', 'On /live', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(27,60,90,0.45)' }}>
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
                        <td style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.date}</td>
                        <td style={{ padding: '8px 10px' }}>{d.event}</td>
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
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDate({ ...d })
                              setIsNew(false)
                              setError('')
                            }}
                            style={{ fontSize: 10, color: '#68a2b9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600, marginRight: 6 }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void persistDates(dates.filter(x => x.id !== d.id))}
                            style={{ fontSize: 10, color: '#ef0e30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )
      ) : pins.length === 0 ? (
        <p className="font-condensed text-[12px]" style={{ color: 'rgba(27,60,90,0.4)' }}>
          No extra pins yet. The built-in catalogue already covers the tour — add a pin when a new city should appear on the globe.
        </p>
      ) : (
        <div style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.02)' }}>
                {['City', 'Country', 'Lat', 'Lon', 'Featured', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(27,60,90,0.45)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pins.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.city}</td>
                  <td style={{ padding: '8px 10px' }}>{p.country}</td>
                  <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums' }}>{p.lat}</td>
                  <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums' }}>{p.lon}</td>
                  <td style={{ padding: '8px 10px' }}>{p.featured ? 'Yes' : '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPin({ ...p })
                        setIsNew(false)
                        setError('')
                      }}
                      style={{ fontSize: 10, color: '#68a2b9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600, marginRight: 6 }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void persistPins(pins.filter(x => x.id !== p.id))}
                      style={{ fontSize: 10, color: '#ef0e30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-condensed)', fontWeight: 600 }}
                    >
                      Del
                    </button>
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
