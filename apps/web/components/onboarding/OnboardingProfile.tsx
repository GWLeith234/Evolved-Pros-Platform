'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  onContinue: () => void
}

const GOLD = '#C9A84C'

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#faf9f7',
  fontSize: '14px',
  fontFamily: 'Barlow, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '9px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)',
  display: 'block',
  marginBottom: '6px',
}

export function OnboardingProfile({ userId, onContinue }: Props) {
  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState<string | null>(null)
  const [displayName, setDisplayName]   = useState('')
  const [company, setCompany]           = useState('')
  const [roleTitle, setRoleTitle]       = useState('')
  const [location, setLocation]         = useState('')
  const [saving, setSaving]             = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)

    // Optimistic preview
    const preview = URL.createObjectURL(file)
    setAvatarUrl(preview)

    const supabase = createClient()
    const path = `avatars/${userId}-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('Branding').upload(path, file, { upsert: true, contentType: file.type })
    if (error) {
      setUploadError('Upload failed — you can add a photo in Settings later.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('Branding').getPublicUrl(path)
    setAvatarUrl(publicUrl)

    await fetch('/api/onboarding/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: publicUrl }),
    })
    setUploading(false)
  }

  async function handleContinue() {
    setSaving(true)
    await fetch('/api/onboarding/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(displayName.trim() && { display_name: displayName.trim() }),
        ...(company.trim()     && { company: company.trim() }),
        ...(roleTitle.trim()   && { role_title: roleTitle.trim() }),
        ...(location.trim()    && { location: location.trim() }),
      }),
    })
    setSaving(false)
    onContinue()
  }

  return (
    <div>
      {/* Heading */}
      <h2 style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '26px', color: '#faf9f7', margin: '0 0 4px' }}>
        Set up your profile
      </h2>
      <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '14px', color: 'rgba(250,249,247,0.45)', margin: '0 0 28px' }}>
        Help your peers know who you are.
      </p>

      {/* Avatar upload */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: `2px dashed ${GOLD}`,
            backgroundColor: avatarUrl ? 'transparent' : 'rgba(201,168,76,0.05)',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </button>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: uploading ? GOLD : 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
          {uploading ? 'Uploading…' : avatarUrl ? 'Tap to change' : 'Add a photo'}
        </p>
        {uploadError && (
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '11px', color: '#ef0e30', marginTop: '4px', textAlign: 'center' }}>{uploadError}</p>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        <div>
          <label style={labelStyle}>Display Name *</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="How you appear to other members"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Company</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Your current company"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Role / Title</label>
          <input
            type="text"
            value={roleTitle}
            onChange={e => setRoleTitle(e.target.value)}
            placeholder="e.g. Account Executive"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>City / Location</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Vancouver, BC"
            style={inputStyle}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={saving || !displayName.trim()}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: GOLD,
          color: '#0A0F18',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: saving || !displayName.trim() ? 'not-allowed' : 'pointer',
          opacity: saving || !displayName.trim() ? 0.5 : 1,
        }}
      >
        {saving ? 'Saving…' : 'Continue →'}
      </button>
    </div>
  )
}
