'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Placement-model ad (sidebar / endorsement style). Distinct from the zone
// model in AdsManager — both live in the single `platform_ads` table and both
// render on the member side, so this editor deliberately mirrors the shape the
// member components read (placement, tool_name, endorsement_quote, …).
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="bg-[var(--admin-card)] rounded-lg overflow-hidden mb-6"
      style={{ border: '1px solid rgba(27,60,90,0.1)', boxShadow: '0 1px 3px rgba(27,60,90,0.06)' }}
    >
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
        <h2 className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]" style={{ color: 'var(--admin-text)' }}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function PlacementAdsManager({
  initialAds,
  settings,
}: {
  initialAds: Ad[]
  settings: Record<string, string>
}) {
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
      const { error } = await supabase.storage.from('Branding').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('Branding').getPublicUrl(path)
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
        // platform_ads.title is NOT NULL; placement ads are headline/tool-driven,
        // so derive a title from the headline (falling back to the tool name).
        title: newAd.headline || newAd.tool_name || 'Sponsor',
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
          <label className="font-condensed font-semibold uppercase text-[11px] tracking-wide" style={{ color: 'var(--admin-text-2)' }}>
            Rotation Interval
          </label>
          <select
            value={interval}
            onChange={e => setInterval(e.target.value)}
            className="border rounded px-3 py-1.5 font-condensed text-[13px]"
            style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
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
                  <p className="font-body text-[13px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>{ad.tool_name ?? ad.headline ?? '(No headline)'}</p>
                  <p className="font-condensed text-[11px] truncate" style={{ color: 'var(--admin-text-2)' }}>
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
                      backgroundColor: 'var(--admin-card)',
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
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                Placement
              </label>
              <select
                value={newAd.placement}
                onChange={e => setNewAd(p => ({ ...p, placement: e.target.value }))}
                className="border rounded px-3 py-1.5 font-condensed text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
              >
                {PLACEMENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                Image {uploading ? '(Uploading…)' : ''}
              </label>
              <label className="cursor-pointer inline-flex items-center gap-2 rounded px-3 py-1.5 font-condensed text-[12px]" style={{ border: '1px solid rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}>
                Choose Image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {newAd.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newAd.image_url} alt="" style={{ height: '60px', marginTop: '8px', borderRadius: '4px', objectFit: 'cover' }} />
              )}
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                Tool / Sponsor Name
              </label>
              <input
                type="text"
                value={newAd.tool_name}
                onChange={e => setNewAd(p => ({ ...p, tool_name: e.target.value }))}
                placeholder="e.g. HubSpot"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                Headline ({newAd.headline.length}/40)
              </label>
              <input
                type="text"
                value={newAd.headline}
                onChange={e => setNewAd(p => ({ ...p, headline: e.target.value.slice(0, 40) }))}
                placeholder="Ad headline"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                George&apos;s Endorsement Quote (optional)
              </label>
              <textarea
                value={newAd.endorsement_quote}
                onChange={e => setNewAd(p => ({ ...p, endorsement_quote: e.target.value }))}
                placeholder="Why I use and recommend this tool..."
                rows={3}
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full resize-none"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                Special Offer Text (optional)
              </label>
              <input
                type="text"
                value={newAd.special_offer}
                onChange={e => setNewAd(p => ({ ...p, special_offer: e.target.value }))}
                placeholder="e.g. 20% off for Evolved Pros members"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                CTA Text ({newAd.cta_text.length}/20)
              </label>
              <input
                type="text"
                value={newAd.cta_text}
                onChange={e => setNewAd(p => ({ ...p, cta_text: e.target.value.slice(0, 20) }))}
                placeholder="Learn More"
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
              />
            </div>
            <div>
              <label className="block font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>
                Link URL
              </label>
              <input
                type="url"
                value={newAd.link_url}
                onChange={e => setNewAd(p => ({ ...p, link_url: e.target.value }))}
                placeholder="https://..."
                className="border rounded px-3 py-1.5 font-body text-[13px] w-full"
                style={{ borderColor: 'rgba(27,60,90,0.2)', color: 'var(--admin-text)' }}
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
                style={{ border: '1px solid rgba(27,60,90,0.2)', color: 'var(--admin-text-2)' }}
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
          <p className="font-condensed font-semibold uppercase text-[11px] tracking-wide mb-1" style={{ color: 'var(--admin-text-2)' }}>Auto-populated</p>
          <p className="font-body text-[13px]" style={{ color: 'var(--admin-text)' }}>
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
