'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MemberRow } from './MembersTable'

interface Props {
  member: MemberRow
  onClose: () => void
  onSaved: (updated: Partial<MemberRow>) => void
}

type Status = 'idle' | 'saving' | 'error'

const PILLAR_LABELS: Record<string, string> = {
  p1: 'Foundation',
  p2: 'Identity',
  p3: 'Mental Toughness',
  p4: 'Strategy',
  p5: 'Accountability',
  p6: 'Execution',
}

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

  // Professional fields
  const [company,       setCompany]       = useState('')
  const [linkedinUrl,   setLinkedinUrl]   = useState('')
  const [websiteUrl,    setWebsiteUrl]    = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [phone,         setPhone]         = useState('')
  const [phoneVisible,  setPhoneVisible]  = useState(false)
  const [currentPillar, setCurrentPillar] = useState<string | null>(null)
  const [goal90day,     setGoal90day]     = useState('')
  const [goalVisible,   setGoalVisible]   = useState(true)

  // Fetch full profile on mount to pre-populate professional fields
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('users')
      .select('company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible, banner_url')
      .eq('id', member.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setCompany(data.company ?? '')
        setLinkedinUrl(data.linkedin_url ?? '')
        setWebsiteUrl(data.website_url ?? '')
        setTwitterHandle(data.twitter_handle ?? '')
        setPhone(data.phone ?? '')
        setPhoneVisible(data.phone_visible ?? false)
        setCurrentPillar(data.current_pillar ?? null)
        setGoal90day(data.goal_90day ?? '')
        setGoalVisible(data.goal_visible ?? true)
        if (data.banner_url) setBannerUrl(data.banner_url)
      })
  }, [member.id])

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

    // Strip leading @ from twitter handle
    const twitter = twitterHandle.startsWith('@') ? twitterHandle.slice(1) : twitterHandle

    try {
      const res = await fetch(`/api/admin/members/${member.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name:   displayName,
          full_name:      fullName,
          tier,
          tier_status:    tierStatus,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          ...(bannerUrl ? { banner_url: bannerUrl } : {}),
          company:        company || null,
          linkedin_url:   linkedinUrl || null,
          website_url:    websiteUrl || null,
          twitter_handle: twitter || null,
          phone:          phone || null,
          phone_visible:  phoneVisible,
          current_pillar: currentPillar,
          goal_90day:     goal90day || null,
          goal_visible:   goalVisible,
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

            {/* Professional section header */}
            <div style={{ borderTop: '1px solid rgba(27,60,90,0.08)', paddingTop: '16px' }}>
              <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a8a96', marginBottom: '12px' }}>
                Professional
              </p>

              {/* Company */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Company</label>
                <input
                  type="text" value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Company or organization" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
              </div>

              {/* LinkedIn URL */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>LinkedIn URL</label>
                <input
                  type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
              </div>

              {/* Website URL */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Website URL</label>
                <input
                  type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
              </div>

              {/* Twitter Handle */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Twitter / X Handle</label>
                <input
                  type="text" value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)}
                  placeholder="@handle (without the @)" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
              </div>

              {/* Phone + phone_visible */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={phoneVisible} onChange={e => setPhoneVisible(e.target.checked)}
                    style={{ width: '14px', height: '14px', accentColor: '#1b3c5a', cursor: 'pointer' }}
                  />
                  <span style={{ fontFamily: 'var(--font-condensed)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a8a96' }}>
                    Visible to members
                  </span>
                </label>
              </div>

              {/* Current Pillar pill selector */}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Current Pillar</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const).map(pillar => {
                    const isActive = currentPillar === pillar
                    return (
                      <button
                        key={pillar} type="button"
                        onClick={() => setCurrentPillar(isActive ? null : pillar)}
                        style={{
                          padding: '5px 10px', borderRadius: '4px',
                          fontFamily: 'var(--font-condensed)', fontWeight: 700,
                          fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                          backgroundColor: isActive ? '#1b3c5a' : 'transparent',
                          color: isActive ? '#ffffff' : '#7a8a96',
                          border: `1.5px solid ${isActive ? '#1b3c5a' : 'rgba(27,60,90,0.2)'}`,
                          cursor: 'pointer', transition: 'all 0.1s',
                        }}
                      >
                        {pillar.toUpperCase()} · {PILLAR_LABELS[pillar]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 90-Day Goal + goal_visible */}
              <div>
                <label style={labelStyle}>90-Day Goal</label>
                <textarea
                  value={goal90day} onChange={e => setGoal90day(e.target.value)}
                  rows={3}
                  placeholder="What are you focused on achieving in the next 90 days?"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={goalVisible} onChange={e => setGoalVisible(e.target.checked)}
                    style={{ width: '14px', height: '14px', accentColor: '#1b3c5a', cursor: 'pointer' }}
                  />
                  <span style={{ fontFamily: 'var(--font-condensed)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a8a96' }}>
                    Make this public
                  </span>
                </label>
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
