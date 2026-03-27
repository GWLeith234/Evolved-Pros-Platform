'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ad = {
  id: string
  placement: string
  image_url: string | null
  headline: string | null
  tool_name: string | null
  endorsement_quote: string | null
  special_offer: string | null
  cta_text: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
}

const PLACEMENT_OPTIONS = [
  { value: 'sidebar',   label: 'Sidebar' },
  { value: 'academy',   label: 'Academy' },
  { value: 'community', label: 'Community Feed' },
  { value: 'events',    label: 'Events' },
  { value: 'all',       label: 'All Placements' },
]

type Banner = {
  id: string
  pillar: number | null
  title: string | null
  image_url: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialSettings: Record<string, string>
  initialAds: Ad[]
  initialBanners: Banner[]
}

const TABS = ['Identity', 'Colors', 'Ads', 'Appearance', 'Banners'] as const
type Tab = typeof TABS[number]

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-3 font-condensed font-bold uppercase tracking-wider text-[12px] border-b-2 -mb-px transition-colors"
      style={{
        color: active ? '#68a2b9' : '#7a8a96',
        borderColor: active ? '#68a2b9' : 'transparent',
        background: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-lg overflow-hidden mb-6"
      style={{ border: '1px solid rgba(27,60,90,0.1)', boxShadow: '0 1px 3px rgba(27,60,90,0.06)' }}
    >
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
        <h2 className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]" style={{ color: '#1b3c5a' }}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function SaveButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded px-5 py-2.5 font-condensed font-bold uppercase tracking-wider text-[12px] transition-opacity"
      style={{ backgroundColor: '#1b3c5a', color: 'white', opacity: loading ? 0.6 : 1 }}
    >
      {loading ? 'Saving…' : 'Save Changes'}
    </button>
  )
}

// ── Identity Tab ─────────────────────────────────────────────────────────────

function IdentityTab({ settings }: { settings: Record<string, string> }) {
  const [logoDark, setLogoDark] = useState(settings['logo_dark_url'] ?? '')
  const [logoLight, setLogoLight] = useState(settings['logo_light_url'] ?? '')
  const [platformName, setPlatformName] = useState(settings['platform_name'] ?? 'Evolved Pros')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function uploadLogo(file: File, key: string, setter: (url: string) => void) {
    const supabase = createClient()
    const path = `logos/${key}_${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('branding').getPublicUrl(path)
    setter(data.publicUrl)
    // save immediately
    await supabase.from('platform_settings').upsert({ key, value: data.publicUrl, updated_at: new Date().toISOString() })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('platform_settings').upsert([
        { key: 'logo_dark_url', value: logoDark, updated_at: new Date().toISOString() },
        { key: 'logo_light_url', value: logoLight, updated_at: new Date().toISOString() },
        { key: 'platform_name', value: platformName, updated_at: new Date().toISOString() },
      ])
      setToast('Saved!')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionCard title="Logo">
        <div className="flex gap-8 mb-5">
          {/* Dark logo */}
          <div>
            <p className="font-condensed font-semibold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>Dark Logo (nav/dark bg)</p>
            <div className="rounded flex items-center justify-center mb-2" style={{ backgroundColor: '#112535', width: '180px', height: '60px' }}>
              {logoDark ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDark} alt="Dark logo" style={{ height: '36px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} />
              ) : (
                <span className="font-condensed font-bold text-white text-sm tracking-[0.14em]">EVOLVED·PROS</span>
              )}
            </div>
            <label className="cursor-pointer rounded px-3 py-1.5 font-condensed font-semibold uppercase text-[11px] tracking-wide inline-flex" style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#1b3c5a' }}>
              Upload Dark Logo
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const f = e.target.files?.[0]; if (f) { try { await uploadLogo(f, 'logo_dark_url', setLogoDark) } catch { alert('Upload failed') } }
              }} />
            </label>
          </div>

          {/* Light logo */}
          <div>
            <p className="font-condensed font-semibold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>Light Logo (light backgrounds)</p>
            <div className="rounded flex items-center justify-center mb-2" style={{ backgroundColor: '#f0f4f7', width: '180px', height: '60px', border: '1px solid rgba(27,60,90,0.1)' }}>
              {logoLight ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoLight} alt="Light logo" style={{ height: '36px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} />
              ) : (
                <span className="font-condensed font-bold text-[#112535] text-sm tracking-[0.14em]">EVOLVED·PROS</span>
              )}
            </div>
            <label className="cursor-pointer rounded px-3 py-1.5 font-condensed font-semibold uppercase text-[11px] tracking-wide inline-flex" style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#1b3c5a' }}>
              Upload Light Logo
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const f = e.target.files?.[0]; if (f) { try { await uploadLogo(f, 'logo_light_url', setLogoLight) } catch { alert('Upload failed') } }
              }} />
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Platform Name">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={platformName}
            onChange={e => setPlatformName(e.target.value)}
            maxLength={60}
            className="border rounded px-3 py-2 font-body text-[14px] w-64"
            style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
          />
          <SaveButton loading={saving} onClick={handleSave} />
          {toast && <span className="font-condensed text-[12px]" style={{ color: '#22c55e' }}>{toast}</span>}
        </div>
      </SectionCard>
    </>
  )
}

// ── Colors Tab ────────────────────────────────────────────────────────────────

function ColorsTab({ settings }: { settings: Record<string, string> }) {
  const [primary, setPrimary] = useState(settings['primary_color'] ?? '#112535')
  const [accent, setAccent] = useState(settings['accent_color'] ?? '#ef0e30')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('platform_settings').upsert([
        { key: 'primary_color', value: primary, updated_at: new Date().toISOString() },
        { key: 'accent_color', value: accent, updated_at: new Date().toISOString() },
      ])
      setToast('Saved!')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionCard title="Brand Colors">
        <div className="flex gap-8 mb-5">
          <div>
            <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>
              Primary (nav background)
            </label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
              <input
                type="text"
                value={primary}
                onChange={e => setPrimary(e.target.value)}
                maxLength={7}
                className="border rounded px-2 py-1.5 font-condensed text-[13px] w-24"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
          </div>
          <div>
            <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>
              Accent (buttons, highlights)
            </label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
              <input
                type="text"
                value={accent}
                onChange={e => setAccent(e.target.value)}
                maxLength={7}
                className="border rounded px-2 py-1.5 font-condensed text-[13px] w-24"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="mb-5">
          <p className="font-condensed font-semibold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>Live Preview</p>
          <div
            className="rounded overflow-hidden flex items-center justify-between px-5 h-12"
            style={{ backgroundColor: primary, width: '300px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="font-condensed font-bold text-white text-sm tracking-[0.14em]">EVOLVED·PROS</span>
            <button
              type="button"
              className="rounded px-3 py-1 font-condensed font-bold uppercase text-[10px] tracking-wide text-white"
              style={{ backgroundColor: accent }}
            >
              Join
            </button>
          </div>
        </div>

        <p className="font-body text-[12px] mb-4" style={{ color: '#7a8a96' }}>
          Color changes apply on next page load for all members.
        </p>

        <div className="flex items-center gap-4">
          <SaveButton loading={saving} onClick={handleSave} />
          {toast && <span className="font-condensed text-[12px]" style={{ color: '#22c55e' }}>{toast}</span>}
        </div>
      </SectionCard>
    </>
  )
}

// ── Ads Tab ───────────────────────────────────────────────────────────────────

function AdsTab({ initialAds, settings }: { initialAds: Ad[]; settings: Record<string, string> }) {
  const [ads, setAds] = useState(initialAds)
  const [interval, setInterval] = useState(settings['ad_sidebar_interval'] ?? '10')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAd, setNewAd] = useState({ placement: 'sidebar', image_url: '', headline: '', tool_name: '', endorsement_quote: '', special_offer: '', cta_text: '', link_url: '' })
  const [uploading, setUploading] = useState(false)
  const [savingInterval, setSavingInterval] = useState(false)

  async function handleSaveInterval() {
    setSavingInterval(true)
    const supabase = createClient()
    await supabase.from('platform_settings').upsert({ key: 'ad_sidebar_interval', value: interval, updated_at: new Date().toISOString() })
    setSavingInterval(false)
  }

  async function handleToggleActive(ad: Ad) {
    const supabase = createClient()
    await supabase.from('platform_ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this ad?')) return
    const supabase = createClient()
    await supabase.from('platform_ads').delete().eq('id', id)
    setAds(prev => prev.filter(a => a.id !== id))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `ads/${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('branding').getPublicUrl(path)
      setNewAd(prev => ({ ...prev, image_url: data.publicUrl }))
    } finally {
      setUploading(false)
    }
  }

  async function handleAddAd() {
    const supabase = createClient()
    const { data } = await supabase
      .from('platform_ads')
      .insert({
        placement: newAd.placement || 'sidebar',
        image_url: newAd.image_url || null,
        headline: newAd.headline || null,
        tool_name: newAd.tool_name || null,
        endorsement_quote: newAd.endorsement_quote || null,
        special_offer: newAd.special_offer || null,
        cta_text: newAd.cta_text || null,
        link_url: newAd.link_url || null,
        sort_order: ads.length,
        is_active: true,
      })
      .select()
      .single()
    if (data) {
      setAds(prev => [...prev, data])
      setNewAd({ placement: 'sidebar', image_url: '', headline: '', tool_name: '', endorsement_quote: '', special_offer: '', cta_text: '', link_url: '' })
      setShowAddForm(false)
    }
  }

  return (
    <>
      <SectionCard title="Sponsored Ads">
        {/* Rotation interval */}
        <div className="flex items-center gap-3 mb-5">
          <label className="font-condensed font-semibold uppercase text-[11px] tracking-wide" style={{ color: '#7a8a96' }}>
            Rotation Interval
          </label>
          <select
            value={interval}
            onChange={e => setInterval(e.target.value)}
            className="border rounded px-3 py-1.5 font-condensed text-[13px]"
            style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
          >
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
          </select>
          <button
            type="button"
            onClick={handleSaveInterval}
            disabled={savingInterval}
            className="rounded px-3 py-1.5 font-condensed font-bold uppercase text-[11px] tracking-wide"
            style={{ backgroundColor: '#1b3c5a', color: 'white', opacity: savingInterval ? 0.6 : 1 }}
          >
            {savingInterval ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Ads table */}
        {ads.length > 0 && (
          <div className="mb-4 rounded overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)' }}>
            {ads.map((ad, i) => (
              <div
                key={ad.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < ads.length - 1 ? '1px solid rgba(27,60,90,0.08)' : 'none' }}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f0f4f7' }}>
                  {ad.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-medium truncate" style={{ color: '#1b3c5a' }}>{ad.tool_name ?? ad.headline ?? '(No headline)'}</p>
                  <p className="font-condensed text-[11px] truncate" style={{ color: '#7a8a96' }}>
                    {PLACEMENT_OPTIONS.find(o => o.value === ad.placement)?.label ?? ad.placement}
                    {ad.link_url ? ` · ${ad.link_url}` : ''}
                  </p>
                </div>
                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(ad)}
                  className="rounded-full transition-colors flex-shrink-0"
                  style={{
                    width: '36px',
                    height: '20px',
                    backgroundColor: ad.is_active ? '#22c55e' : 'rgba(27,60,90,0.2)',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: ad.is_active ? '18px' : '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.15s',
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ad.id)}
                  className="font-condensed text-[11px] uppercase tracking-wide transition-colors flex-shrink-0"
                  style={{ color: '#ef0e30' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new ad */}
        {showAddForm ? (
          <div className="rounded p-4 space-y-3" style={{ border: '1px solid rgba(27,60,90,0.1)', backgroundColor: '#fafafa' }}>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                Placement
              </label>
              <select
                value={newAd.placement}
                onChange={e => setNewAd(p => ({ ...p, placement: e.target.value }))}
                className="border rounded px-3 py-1.5 font-condensed text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              >
                {PLACEMENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                Image {uploading ? '(Uploading…)' : ''}
              </label>
              <label className="cursor-pointer inline-flex items-center gap-2 rounded px-3 py-1.5 font-condensed text-[12px]" style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#1b3c5a' }}>
                Choose Image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {newAd.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newAd.image_url} alt="" style={{ height: '60px', marginTop: '8px', borderRadius: '4px', objectFit: 'cover' }} />
              )}
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                Tool / Sponsor Name
              </label>
              <input
                type="text"
                value={newAd.tool_name}
                onChange={e => setNewAd(p => ({ ...p, tool_name: e.target.value }))}
                placeholder="e.g. HubSpot"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                Headline ({newAd.headline.length}/40)
              </label>
              <input
                type="text"
                value={newAd.headline}
                onChange={e => setNewAd(p => ({ ...p, headline: e.target.value.slice(0, 40) }))}
                placeholder="Ad headline"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                George&apos;s Endorsement Quote (optional)
              </label>
              <textarea
                value={newAd.endorsement_quote}
                onChange={e => setNewAd(p => ({ ...p, endorsement_quote: e.target.value }))}
                placeholder="Why I use and recommend this tool..."
                rows={3}
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full resize-none"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                Special Offer Text (optional)
              </label>
              <input
                type="text"
                value={newAd.special_offer}
                onChange={e => setNewAd(p => ({ ...p, special_offer: e.target.value }))}
                placeholder="e.g. 20% off for Evolved Pros members"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                CTA Text ({newAd.cta_text.length}/20)
              </label>
              <input
                type="text"
                value={newAd.cta_text}
                onChange={e => setNewAd(p => ({ ...p, cta_text: e.target.value.slice(0, 20) }))}
                placeholder="Learn More"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
                Link URL
              </label>
              <input
                type="url"
                value={newAd.link_url}
                onChange={e => setNewAd(p => ({ ...p, link_url: e.target.value }))}
                placeholder="https://..."
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddAd}
                className="rounded px-4 py-2 font-condensed font-bold uppercase text-[12px] tracking-wide"
                style={{ backgroundColor: '#1b3c5a', color: 'white' }}
              >
                Save Ad
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded px-4 py-2 font-condensed font-bold uppercase text-[12px] tracking-wide"
                style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#7a8a96' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded px-4 py-2 font-condensed font-bold uppercase text-[12px] tracking-wide"
            style={{ backgroundColor: '#ef0e30', color: 'white' }}
          >
            + Add New Ad
          </button>
        )}
      </SectionCard>

      <SectionCard title="Top Nav Event Card">
        <div className="rounded p-4 mb-4" style={{ backgroundColor: '#f0f4f7', border: '1px solid rgba(27,60,90,0.08)' }}>
          <p className="font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>Auto-populated</p>
          <p className="font-body text-[13px]" style={{ color: '#1b3c5a' }}>
            The top nav event card automatically shows the next upcoming published event. No configuration needed — it updates in real-time as events are created.
          </p>
        </div>
        <div
          style={{
            background: '#112535',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ background: '#ef0e30', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '10px', fontWeight: 700 }}>NEXT EVENT</span>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>Your next event title</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </SectionCard>
    </>
  )
}

// ── Appearance Tab ────────────────────────────────────────────────────────────

function AppearanceTab({ settings }: { settings: Record<string, string> }) {
  const [defaultTheme, setDefaultTheme] = useState(settings['default_theme'] ?? 'dark')
  const [canToggle, setCanToggle] = useState(settings['members_can_toggle_theme'] !== 'false')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('platform_settings').upsert([
        { key: 'default_theme', value: defaultTheme, updated_at: new Date().toISOString() },
        { key: 'members_can_toggle_theme', value: canToggle ? 'true' : 'false', updated_at: new Date().toISOString() },
      ])
      setToast('Saved!')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Theme Settings">
      <div className="space-y-5">
        <div>
          <p className="font-condensed font-bold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>Default Theme</p>
          <p className="font-body text-[12px] mb-3" style={{ color: '#7a8a96' }}>Applied when members first visit or have no saved preference.</p>
          <div className="flex gap-4">
            {['dark', 'light'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={defaultTheme === t}
                  onChange={() => setDefaultTheme(t)}
                />
                <span className="font-condensed font-semibold uppercase text-[12px]" style={{ color: '#1b3c5a' }}>
                  {t === 'dark' ? 'Dark' : 'Light'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="font-condensed font-bold uppercase text-[11px] tracking-wide mb-2" style={{ color: '#7a8a96' }}>Members Can Change Theme</p>
          <p className="font-body text-[12px] mb-3" style={{ color: '#7a8a96' }}>If disabled, the theme toggle in the top nav is hidden for all members.</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setCanToggle(v => !v)}
              className="rounded-full transition-colors"
              style={{
                width: '44px',
                height: '24px',
                backgroundColor: canToggle ? '#22c55e' : 'rgba(27,60,90,0.2)',
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: canToggle ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.15s',
                }}
              />
            </button>
            <span className="font-body text-[13px]" style={{ color: '#1b3c5a' }}>
              {canToggle ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <SaveButton loading={saving} onClick={handleSave} />
          {toast && <span className="font-condensed text-[12px]" style={{ color: '#22c55e' }}>{toast}</span>}
        </div>
      </div>
    </SectionCard>
  )
}

// ── Banners Tab ───────────────────────────────────────────────────────────────

function BannersTab({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners)
  const [uploading, setUploading] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newPillar, setNewPillar] = useState('')
  const [newImage, setNewImage] = useState('')
  const [addUploading, setAddUploading] = useState(false)
  const [adding, setAdding] = useState(false)

  async function handleReplaceImage(bannerId: string, file: File) {
    setUploading(bannerId)
    try {
      const supabase = createClient()
      const path = `banners/preset_${bannerId}_${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('branding').getPublicUrl(path)
      await supabase.from('profile_banners').update({ image_url: data.publicUrl }).eq('id', bannerId)
      setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, image_url: data.publicUrl } : b))
    } finally {
      setUploading(null)
    }
  }

  async function handleAddBanner() {
    if (!newImage) return
    setAdding(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('profile_banners')
        .insert({
          title: newTitle || null,
          pillar: newPillar ? parseInt(newPillar) : null,
          image_url: newImage,
          sort_order: banners.length + 1,
          is_active: true,
        })
        .select()
        .single()
      if (data) {
        setBanners(prev => [...prev, data])
        setNewTitle(''); setNewPillar(''); setNewImage('')
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <SectionCard title="Profile Banners">
      {/* Grid of existing banners */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {banners.map(banner => (
          <div key={banner.id} style={{ border: '1px solid rgba(27,60,90,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image_url} alt={banner.title ?? ''} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
            <div className="px-3 py-2 flex items-center justify-between">
              <div>
                {banner.pillar && <p className="font-condensed font-bold text-[10px] uppercase tracking-wide" style={{ color: '#68a2b9' }}>Pillar {banner.pillar}</p>}
                <p className="font-body text-[12px]" style={{ color: '#1b3c5a' }}>{banner.title ?? 'Untitled'}</p>
              </div>
              <label className="cursor-pointer rounded px-2 py-1 font-condensed text-[11px] uppercase tracking-wide" style={{ border: '1px solid rgba(27,60,90,0.15)', color: '#7a8a96', fontSize: '11px' }}>
                {uploading === banner.id ? 'Uploading…' : 'Replace'}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleReplaceImage(banner.id, f) }} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Add custom banner */}
      <div style={{ borderTop: '1px solid rgba(27,60,90,0.08)', paddingTop: '16px' }}>
        <p className="font-condensed font-bold uppercase text-[12px] tracking-wide mb-3" style={{ color: '#1b3c5a' }}>Add Custom Banner</p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Banner title"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>Pillar #</label>
              <input
                type="number"
                min="1" max="6"
                value={newPillar}
                onChange={e => setNewPillar(e.target.value)}
                placeholder="1–6"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: '#1b3c5a' }}
              />
            </div>
          </div>
          <div>
            <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: '#7a8a96' }}>
              Image {addUploading ? '(Uploading…)' : ''}
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded px-3 py-1.5 font-condensed text-[12px]" style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#1b3c5a' }}>
              Choose Image
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return
                setAddUploading(true)
                try {
                  const supabase = createClient()
                  const path = `banners/custom_${Date.now()}.${file.name.split('.').pop()}`
                  const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true, contentType: file.type })
                  if (error) throw error
                  const { data } = supabase.storage.from('branding').getPublicUrl(path)
                  setNewImage(data.publicUrl)
                } finally { setAddUploading(false) }
              }} />
            </label>
            {newImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newImage} alt="" style={{ height: '60px', marginTop: '8px', borderRadius: '4px', objectFit: 'cover' }} />
            )}
          </div>
          <button
            type="button"
            onClick={handleAddBanner}
            disabled={!newImage || adding}
            className="rounded px-4 py-2 font-condensed font-bold uppercase text-[12px] tracking-wide transition-opacity"
            style={{ backgroundColor: '#1b3c5a', color: 'white', opacity: !newImage || adding ? 0.6 : 1 }}
          >
            {adding ? 'Adding…' : 'Add Banner'}
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export function BrandingPortalClient({ initialSettings, initialAds, initialBanners }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Identity')

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6">
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
          Platform
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: '#112535' }}>
          Branding
        </h1>
        <p className="font-body text-[14px] mt-1" style={{ color: '#7a8a96' }}>
          Manage logos, colors, ads, and member-facing appearance.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 mb-6 border-b" style={{ borderColor: 'rgba(27,60,90,0.12)' }}>
        {TABS.map(tab => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Identity' && <IdentityTab settings={initialSettings} />}
      {activeTab === 'Colors' && <ColorsTab settings={initialSettings} />}
      {activeTab === 'Ads' && <AdsTab initialAds={initialAds} settings={initialSettings} />}
      {activeTab === 'Appearance' && <AppearanceTab settings={initialSettings} />}
      {activeTab === 'Banners' && <BannersTab initialBanners={initialBanners} />}
    </div>
  )
}
