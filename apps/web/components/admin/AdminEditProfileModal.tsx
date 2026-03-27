'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MemberRow } from './MembersTable'

interface Props {
  member: MemberRow
  onClose: () => void
  onSaved: (updated: Partial<MemberRow>) => void
}

type Status = 'idle' | 'saving' | 'error'

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid rgba(27,60,90,0.18)', borderRadius: '6px',
  fontSize: '13px', fontFamily: 'var(--font-body)', color: '#112535',
  outline: 'none', backgroundColor: '#fff',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-condensed)', fontWeight: 700,
  fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#7a8a96', marginBottom: '5px',
}

export function AdminEditProfileModal({ member, onClose, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(member.displayName ?? '')
  const [fullName,    setFullName]    = useState(member.fullName ?? '')
  const [tier,        setTier]        = useState(member.tier ?? 'community')
  const [tierStatus,  setTierStatus]  = useState(member.tierStatus ?? 'active')
  const [avatarUrl,   setAvatarUrl]   = useState(member.avatarUrl ?? '')
  const [bannerUrl,   setBannerUrl]   = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [status,  setStatus]  = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function uploadFile(
    file: File,
    folder: 'avatar' | 'banner',
    setUploading: (v: boolean) => void,
    setUrl: (v: string) => void,
  ) {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `admin-uploads/${member.id}/${folder}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('Branding')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('Branding').getPublicUrl(path)
      setUrl(data.publicUrl)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed')
      setStatus('error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/admin/members/${member.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          full_name:    fullName,
          tier,
          tier_status:  tierStatus,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          ...(bannerUrl ? { banner_url: bannerUrl } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      onSaved({
        displayName: displayName || null,
        fullName:    fullName    || null,
        tier,
        tierStatus,
        avatarUrl:   avatarUrl  || null,
      })
      onClose()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  const name = member.displayName ?? member.fullName ?? member.email

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(13,28,39,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#fff', border: '1px solid rgba(27,60,90,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white"
          style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
        >
          <div>
            <h2 className="font-display font-black text-[18px]" style={{ color: '#112535' }}>
              Edit Profile
            </h2>
            <p className="font-condensed text-[11px] mt-0.5" style={{ color: '#7a8a96' }}>
              {name} · {member.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'rgba(27,60,90,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1b3c5a')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,60,90,0.35)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="px-6 py-5 space-y-5">

            {/* Avatar */}
            <div>
              <label style={labelStyle}>Profile Photo</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden font-condensed font-bold text-white text-sm"
                  style={{ backgroundColor: '#1b3c5a' }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover" />
                  ) : getInitials(name)}
                </div>
                <div className="flex-1">
                  <label
                    className="inline-flex items-center gap-1.5 font-condensed font-bold uppercase tracking-[0.1em] text-[10px] px-3 py-2 rounded cursor-pointer transition-colors"
                    style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.15)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.06)')}
                  >
                    {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                    <input
                      type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
                      disabled={avatarUploading}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) uploadFile(f, 'avatar', setAvatarUploading, setAvatarUrl)
                      }}
                    />
                  </label>
                  {avatarUrl && (
                    <p className="font-condensed text-[10px] mt-1" style={{ color: '#68a2b9' }}>✓ Photo uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Banner */}
            <div>
              <label style={labelStyle}>Profile Banner</label>
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Banner preview" className="w-full rounded-lg mb-2" style={{ height: '80px', objectFit: 'cover' }} />
              ) : (
                <div className="w-full rounded-lg mb-2" style={{ height: '80px', background: 'linear-gradient(135deg, #112535 0%, #1b3c5a 100%)' }} />
              )}
              <label
                className="inline-flex items-center gap-1.5 font-condensed font-bold uppercase tracking-[0.1em] text-[10px] px-3 py-2 rounded cursor-pointer transition-colors"
                style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.15)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.06)')}
              >
                {bannerUploading ? 'Uploading…' : 'Upload Banner'}
                <input
                  type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
                  disabled={bannerUploading}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) uploadFile(f, 'banner', setBannerUploading, setBannerUrl)
                  }}
                />
              </label>
              {bannerUrl && (
                <span className="font-condensed text-[10px] ml-2" style={{ color: '#68a2b9' }}>✓ Banner uploaded</span>
              )}
            </div>

            {/* Display Name + Full Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. GWLeith" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
              </div>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. George Leith" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
              </div>
            </div>

            {/* Tier + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Tier</label>
                <div className="flex gap-2">
                  {(['community', 'pro'] as const).map(t => (
                    <button
                      key={t} type="button" onClick={() => setTier(t)}
                      className="flex-1 py-2 rounded font-condensed font-bold uppercase tracking-[0.1em] text-[10px] transition-all"
                      style={{
                        backgroundColor: tier === t ? (t === 'pro' ? 'rgba(201,168,76,0.1)' : 'rgba(27,60,90,0.06)') : 'transparent',
                        border: `1.5px solid ${tier === t ? (t === 'pro' ? '#c9a84c' : '#1b3c5a') : 'rgba(27,60,90,0.12)'}`,
                        color: tier === t ? (t === 'pro' ? '#a07c1e' : '#1b3c5a') : '#7a8a96',
                      }}
                    >
                      {t === 'pro' ? 'Pro' : 'Comm.'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={tierStatus} onChange={e => setTierStatus(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {status === 'error' && (
              <p
                className="font-condensed text-[11px] px-3 py-2 rounded"
                style={{ backgroundColor: 'rgba(239,14,48,0.06)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.15)' }}
              >
                {errorMsg}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 sticky bottom-0 bg-white"
            style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}
          >
            <button
              type="button" onClick={onClose}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-colors"
              style={{ backgroundColor: 'rgba(27,60,90,0.05)', color: '#7a8a96', border: '1px solid rgba(27,60,90,0.12)' }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={status === 'saving' || avatarUploading || bannerUploading}
              className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-2 rounded transition-colors"
              style={{
                backgroundColor: (status === 'saving' || avatarUploading || bannerUploading) ? 'rgba(27,60,90,0.4)' : '#1b3c5a',
                color: '#fff',
                cursor: (status === 'saving' || avatarUploading || bannerUploading) ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'saving' ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
