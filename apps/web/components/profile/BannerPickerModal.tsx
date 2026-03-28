'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Banner {
  id: string
  label: string | null
  pillar: string | null
  image_url: string
  sort_order: number | null
}

interface BannerPickerModalProps {
  userId: string
  currentBannerUrl: string | null
  onSave: (url: string) => void
  onClose: () => void
}

export function BannerPickerModal({ userId, currentBannerUrl, onSave, onClose }: BannerPickerModalProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [selected, setSelected] = useState<string | null>(currentBannerUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    console.log('[banner] fetching banners')
    supabase
      .from('profile_banners')
      .select('id, label, image_url, pillar, sort_order')
      .order('sort_order')
      .then(({ data, error }) => {
        console.log('[banner] result:', data?.length ?? 0, 'error:', error?.message ?? 'none')
        if (data) setBanners(data)
      })
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return

    setUploading(true)
    try {
      const supabase = createClient()
      const path = `banners/${userId}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('Branding')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('Branding').getPublicUrl(path)
      setSelected(data.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('users').update({ banner_url: selected }).eq('id', userId)
      onSave(selected)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-[20px]" style={{ color: '#112535' }}>
            Choose your banner
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#7a8a96', fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Preset banners grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {banners.map(banner => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setSelected(banner.image_url)}
              style={{
                border: selected === banner.image_url ? '2px solid #ef0e30' : '2px solid transparent',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
                background: 'none',
                textAlign: 'left',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image_url}
                alt={banner.label ?? ''}
                style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
              />
              <p
                className="font-condensed font-semibold text-[12px] px-2 py-1.5"
                style={{ color: '#7a8a96' }}
              >
                {banner.label ?? banner.pillar ?? ''}
              </p>
            </button>
          ))}
        </div>

        {/* Upload own */}
        <div
          style={{
            borderTop: '1px solid rgba(27,60,90,0.1)',
            paddingTop: '16px',
            marginBottom: '20px',
          }}
        >
          <p className="font-condensed font-bold uppercase tracking-wide text-[11px] mb-2" style={{ color: '#7a8a96' }}>
            Upload your own
          </p>
          <label
            className="inline-flex items-center gap-2 cursor-pointer rounded px-4 py-2 font-condensed font-semibold uppercase text-[11px] tracking-wide"
            style={{
              border: '1px solid rgba(27,60,90,0.2)',
              color: '#1b3c5a',
              backgroundColor: uploading ? 'rgba(27,60,90,0.04)' : 'transparent',
            }}
          >
            {uploading ? 'Uploading…' : 'Choose Image (.jpg, .png, .webp)'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          {selected && !banners.some(b => b.image_url === selected) && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected}
                alt="Custom banner preview"
                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!selected || saving}
          className="w-full rounded py-3 font-condensed font-bold uppercase tracking-wider text-[13px] transition-opacity"
          style={{
            backgroundColor: '#ef0e30',
            color: 'white',
            opacity: !selected || saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Banner'}
        </button>
      </div>
    </div>
  )
}
