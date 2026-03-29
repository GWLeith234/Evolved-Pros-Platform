'use client'

import { useState } from 'react'

type Zone = 'A' | 'B' | 'C' | 'D'
type AdType = 'image' | 'video' | 'native'

interface Ad {
  id: string
  zone: string | null
  sponsor_name: string | null
  ad_type: string | null
  image_url: string | null
  click_url: string | null
  headline: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  sort_order: number
}

interface AdFormValues {
  sponsorName: string
  zone: Zone
  adType: AdType
  imageUrl: string
  clickUrl: string
  headline: string
  startDate: string
  endDate: string
  isActive: boolean
}

const ZONE_LABELS: Record<Zone, string> = {
  A: 'Zone A — 300×250 Sidebar',
  B: 'Zone B — Native In-Feed',
  C: 'Zone C — 728×90 Leaderboard',
  D: 'Zone D — Pre-Roll Video',
}

const ZONE_DESCRIPTIONS: Record<Zone, string> = {
  A: '300×250 rectangle in the sidebar',
  B: 'Native card embedded in community feed',
  C: '728×90 horizontal banner',
  D: 'Pre-roll video before episode playback',
}

const DEFAULT_FORM: AdFormValues = {
  sponsorName: '',
  zone: 'A',
  adType: 'image',
  imageUrl: '',
  clickUrl: '',
  headline: '',
  startDate: '',
  endDate: '',
  isActive: true,
}

function adStatus(ad: Ad): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (!ad.is_active) return 'inactive'
  const now = Date.now()
  if (ad.start_date && new Date(ad.start_date).getTime() > now) return 'scheduled'
  if (ad.end_date && new Date(ad.end_date).getTime() < now) return 'expired'
  return 'active'
}

function StatusBadge({ status }: { status: ReturnType<typeof adStatus> }) {
  const styles: Record<typeof status, React.CSSProperties> = {
    active:    { backgroundColor: 'rgba(104,162,185,0.12)', color: '#68a2b9' },
    scheduled: { backgroundColor: 'rgba(201,168,76,0.12)',  color: '#C9A84C' },
    expired:   { backgroundColor: 'rgba(27,60,90,0.08)',    color: '#7a8a96' },
    inactive:  { backgroundColor: 'rgba(27,60,90,0.06)',    color: '#7a8a96' },
  }
  return (
    <span
      className="font-condensed font-bold uppercase text-[9px] tracking-wider rounded px-2 py-0.5"
      style={styles[status]}
    >
      {status}
    </span>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const inputClass = 'w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all'
const inputStyle: React.CSSProperties = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }
const labelClass = 'block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5'

function AdForm({
  initialValues,
  lockedZone,
  adId,
  onSaved,
  onCancel,
}: {
  initialValues?: Partial<AdFormValues>
  lockedZone: Zone
  adId?: string
  onSaved: (ad: Ad) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<AdFormValues>({
    ...DEFAULT_FORM,
    zone: lockedZone,
    ...initialValues,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof AdFormValues>(key: K, val: AdFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      sponsor_name: values.sponsorName.trim() || null,
      zone: values.zone,
      ad_type: values.adType,
      image_url: values.imageUrl.trim() || null,
      click_url: values.clickUrl.trim() || null,
      headline: values.headline.trim() || null,
      start_date: values.startDate || null,
      end_date: values.endDate || null,
      is_active: values.isActive,
    }

    try {
      const res = await fetch(
        adId ? `/api/admin/ads/${adId}` : '/api/admin/ads',
        {
          method: adId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSaved(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded px-4 py-3 font-condensed text-[12px]"
          style={{ backgroundColor: 'rgba(239,14,48,0.08)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Sponsor name */}
      <div>
        <label className={labelClass}>Sponsor Name</label>
        <input
          type="text"
          value={values.sponsorName}
          onChange={e => set('sponsorName', e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="e.g. Acme Corp"
          maxLength={200}
        />
      </div>

      {/* Headline */}
      <div>
        <label className={labelClass}>Headline</label>
        <input
          type="text"
          value={values.headline}
          onChange={e => set('headline', e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="Short display headline"
          maxLength={200}
        />
      </div>

      {/* Zone (locked to current tab) + Ad Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Zone</label>
          <div
            className="rounded px-3 py-2.5 font-body text-[13px] text-[#7a8a96]"
            style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: '#f5f7f9' }}
          >
            Zone {values.zone} — {ZONE_DESCRIPTIONS[values.zone]}
          </div>
        </div>
        <div>
          <label className={labelClass}>Ad Type</label>
          <div className="flex gap-1.5">
            {(['image', 'video', 'native'] as AdType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('adType', t)}
                className="font-condensed font-semibold uppercase text-[10px] rounded px-3 py-2 flex-1 capitalize transition-all"
                style={{
                  backgroundColor: values.adType === t ? '#1b3c5a' : 'transparent',
                  color: values.adType === t ? 'white' : '#1b3c5a',
                  border: '1px solid rgba(27,60,90,0.2)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className={labelClass}>Image URL</label>
        <input
          type="url"
          value={values.imageUrl}
          onChange={e => set('imageUrl', e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="https://... (paste URL or upload to Branding bucket)"
        />
      </div>

      {/* Click URL */}
      <div>
        <label className={labelClass}>Click Destination URL</label>
        <input
          type="url"
          value={values.clickUrl}
          onChange={e => set('clickUrl', e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="https://... where clicking the ad goes"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start Date (optional)</label>
          <input
            type="date"
            value={values.startDate}
            onChange={e => set('startDate', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">Leave blank = always active</p>
        </div>
        <div>
          <label className={labelClass}>End Date (optional)</label>
          <input
            type="date"
            value={values.endDate}
            onChange={e => set('endDate', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">Leave blank = no expiry</p>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('isActive', !values.isActive)}
          className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
          style={{ backgroundColor: values.isActive ? '#68a2b9' : 'rgba(27,60,90,0.15)' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: values.isActive ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
        <span className="font-condensed font-semibold text-[12px] text-[#1b3c5a]">
          {values.isActive ? 'Active' : 'Inactive (paused)'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : adId ? 'Save Changes' : 'Create Ad'}
        </button>
      </div>
    </form>
  )
}

function ZonePanel({
  zone,
  ads,
  onAdsChange,
}: {
  zone: Zone
  ads: Ad[]
  onAdsChange: (ads: Ad[]) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const zoneAds = ads.filter(a => (a.zone ?? 'A') === zone)

  function handleSaved(ad: Ad) {
    if (editingId) {
      onAdsChange(ads.map(a => a.id === ad.id ? ad : a))
      setEditingId(null)
    } else {
      onAdsChange([...ads, ad])
      setShowForm(false)
    }
  }

  async function handleDelete(adId: string) {
    if (!confirm('Delete this ad? This cannot be undone.')) return
    setDeletingId(adId)
    try {
      const res = await fetch(`/api/admin/ads/${adId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Delete failed')
      }
      onAdsChange(ads.filter(a => a.id !== adId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const editingAd = editingId ? ads.find(a => a.id === editingId) : null

  return (
    <div className="space-y-4">
      {/* Zone description pill */}
      <div className="flex items-center justify-between">
        <span className="font-condensed text-[11px]" style={{ color: '#7a8a96' }}>
          {ZONE_DESCRIPTIONS[zone]} · {zoneAds.length} ad{zoneAds.length !== 1 ? 's' : ''}
        </span>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all"
            style={{ backgroundColor: '#1b3c5a', color: 'white' }}
          >
            + New Ad
          </button>
        )}
      </div>

      {/* New ad form */}
      {showForm && (
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: '#f5f7f9', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#1b3c5a] mb-4">
            New Ad — Zone {zone}
          </p>
          <AdForm
            lockedZone={zone}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingId && editingAd && (
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: '#f5f7f9', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-[#1b3c5a] mb-4">
            Edit Ad
          </p>
          <AdForm
            lockedZone={zone}
            adId={editingId}
            initialValues={{
              sponsorName: editingAd.sponsor_name ?? '',
              zone,
              adType: (editingAd.ad_type as AdType) ?? 'image',
              imageUrl: editingAd.image_url ?? '',
              clickUrl: editingAd.click_url ?? '',
              headline: editingAd.headline ?? '',
              startDate: editingAd.start_date ? editingAd.start_date.slice(0, 10) : '',
              endDate: editingAd.end_date ? editingAd.end_date.slice(0, 10) : '',
              isActive: editingAd.is_active,
            }}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* Table */}
      {zoneAds.length === 0 && !showForm && !editingId ? (
        <div
          className="rounded-lg px-8 py-10 text-center"
          style={{ border: '1px dashed rgba(27,60,90,0.15)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-widest text-[10px] text-[#7a8a96]">
            No ads in Zone {zone}
          </p>
          <p className="font-body text-[12px] text-[#7a8a96] mt-1">
            Click "+ New Ad" to create one.
          </p>
        </div>
      ) : zoneAds.length > 0 ? (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#f5f7f9', borderBottom: '1px solid rgba(27,60,90,0.1)' }}>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96]">Sponsor</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96] hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96] hidden lg:table-cell">Dates</th>
                <th className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96]">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {zoneAds.map((ad, i) => {
                const status = adStatus(ad)
                return (
                  <tr
                    key={ad.id}
                    style={{
                      borderBottom: i < zoneAds.length - 1 ? '1px solid rgba(27,60,90,0.06)' : 'none',
                      backgroundColor: 'white',
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ad.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ad.image_url}
                            alt={ad.sponsor_name ?? 'Ad'}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-body font-semibold text-[13px] text-[#1b3c5a]">
                            {ad.sponsor_name ?? <span className="text-[#7a8a96]">—</span>}
                          </p>
                          {ad.headline && (
                            <p className="font-condensed text-[10px] text-[#7a8a96] truncate max-w-[180px]">{ad.headline}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#7a8a96] capitalize">
                        {ad.ad_type ?? 'image'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-condensed text-[11px] text-[#7a8a96]">
                        {ad.start_date || ad.end_date
                          ? `${formatDate(ad.start_date)} → ${formatDate(ad.end_date)}`
                          : 'Always active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setEditingId(ad.id); setShowForm(false) }}
                          className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          disabled={deletingId === ad.id}
                          className="font-condensed font-semibold uppercase tracking-wide text-[10px] transition-colors"
                          style={{ color: '#ef0e30', opacity: deletingId === ad.id ? 0.5 : 1 }}
                        >
                          {deletingId === ad.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export function AdsManager({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [activeZone, setActiveZone] = useState<Zone>('A')

  const zones: Zone[] = ['A', 'B', 'C', 'D']

  return (
    <div>
      {/* Zone tabs */}
      <div
        className="flex gap-0 mb-6 rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(27,60,90,0.12)', width: 'fit-content' }}
      >
        {zones.map(zone => {
          const count = ads.filter(a => (a.zone ?? 'A') === zone).length
          const active = activeZone === zone
          return (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px] px-5 py-2.5 transition-all"
              style={{
                backgroundColor: active ? '#1b3c5a' : 'white',
                color: active ? 'white' : '#7a8a96',
                borderRight: zone !== 'D' ? '1px solid rgba(27,60,90,0.12)' : 'none',
              }}
            >
              Zone {zone}
              {count > 0 && (
                <span
                  className="ml-1.5 font-condensed text-[9px] rounded-full px-1.5 py-0.5"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(27,60,90,0.1)',
                    color: active ? 'white' : '#7a8a96',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active zone label */}
      <div className="mb-4">
        <h2 className="font-display font-black text-[18px] text-[#112535]">
          {ZONE_LABELS[activeZone]}
        </h2>
      </div>

      {/* Zone panel */}
      <ZonePanel
        key={activeZone}
        zone={activeZone}
        ads={ads}
        onAdsChange={setAds}
      />
    </div>
  )
}
