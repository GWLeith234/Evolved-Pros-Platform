'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Banner = {
  id: string
  pillar: string | null
  title: string | null
  image_url: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialSettings: Record<string, string>
  initialBanners: Banner[]
}

const TABS = ['Identity', 'Colors', 'Appearance', 'Banners'] as const
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
    const { error } = await supabase.storage.from('Branding').upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('Branding').getPublicUrl(path)
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
      const { error } = await supabase.storage.from('Branding').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('Branding').getPublicUrl(path)
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
          // label is NOT NULL (legacy column); mirror the title into it.
          label: newTitle || '',
          title: newTitle || null,
          pillar: newPillar || null,
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
                  const { error } = await supabase.storage.from('Branding').upload(path, file, { upsert: true, contentType: file.type })
                  if (error) throw error
                  const { data } = supabase.storage.from('Branding').getPublicUrl(path)
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

export function BrandingPortalClient({ initialSettings, initialBanners }: Props) {
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
          Manage logos, colors, and member-facing appearance.
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
      {activeTab === 'Appearance' && <AppearanceTab settings={initialSettings} />}
      {activeTab === 'Banners' && <BannersTab initialBanners={initialBanners} />}
    </div>
  )
}
