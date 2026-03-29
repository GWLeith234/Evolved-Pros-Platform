'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const LOGO = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_nav_light.png'

const PILLARS = [
  { id: 'p1', label: 'Foundation',       color: '#FFA538' },
  { id: 'p2', label: 'Identity',          color: '#A78BFA' },
  { id: 'p3', label: 'Mental Toughness',  color: '#F87171' },
  { id: 'p4', label: 'Strategy',          color: '#60A5FA' },
  { id: 'p5', label: 'Accountability',    color: '#C9A84C' },
  { id: 'p6', label: 'Execution',         color: '#0ABFA3' },
]

export function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('there')
  const [generalChannelId, setGeneralChannelId] = useState<string | null>(null)

  // Step 1
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null)
  const [savingPillar, setSavingPillar] = useState(false)

  // Step 3
  const [introText, setIntroText] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  // Step 4
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      supabase
        .from('users')
        .select('display_name, full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.full_name?.split(' ')[0] ?? data?.display_name ?? 'there')
        })
    })
    // Bug 1 fix: use ilike on name, not eq on slug — more resilient across envs
    supabase
      .from('channels')
      .select('id')
      .ilike('name', '%general%')
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (data) setGeneralChannelId(data.id)
      })
  }, [])

  async function handlePhotoUpload() {
    if (!avatarFile || !userId) { setStep(2); return }
    setUploading(true)
    setUploadError(null)
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('Branding')
      .upload(`avatars/${userId}.jpg`, avatarFile, { upsert: true })
    if (error) {
      setUploadError('Upload failed — you can add a photo later in Settings.')
    } else {
      const { data: { publicUrl } } = supabase.storage.from('Branding').getPublicUrl(`avatars/${userId}.jpg`)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId)
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
    }
    setUploading(false)
    setStep(2)
  }

  async function handlePillarSave() {
    if (!selectedPillar || !userId) { setStep(3); return }
    setSavingPillar(true)
    const supabase = createClient()
    await supabase.from('users').update({ current_pillar: selectedPillar }).eq('id', userId)
    setSavingPillar(false)
    setStep(3)
  }

  async function handleIntroPost() {
    const trimmed = introText.trim()
    if (trimmed.length < 10 || !generalChannelId) {
      setStep(4)
      return
    }
    setPosting(true)
    setPostError(null)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: generalChannelId,
        body: trimmed,
        pillarTag: selectedPillar,
      }),
    })
    const resData = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPostError(resData.error ?? 'Post failed — you can introduce yourself in the community later.')
    }
    setPosting(false)
    setStep(4)
  }

  async function handleComplete() {
    if (!userId) return
    setCompleting(true)
    const supabase = createClient()
    await supabase.from('users').update({ onboarding_completed: true }).eq('id', userId)
    window.location.href = '/home'
  }

  const selectedPillarData = PILLARS.find(p => p.id === selectedPillar)

  // ── Shared style helpers ───────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = { fontFamily: '"Barlow Condensed", sans-serif' }
  const bodyStyle: React.CSSProperties  = { fontFamily: 'Barlow, sans-serif' }
  const headStyle: React.CSSProperties  = { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }
  const btnRed = 'w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0d1c27' }}
    >
      <div className="w-full max-w-lg bg-white rounded-lg overflow-hidden shadow-2xl">
        {/* Red top accent */}
        <div className="h-1 bg-[#ef0e30]" />

        <div className="px-8 py-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Evolved Pros" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: s === step ? 24 : 8,
                  height: 8,
                  backgroundColor: s <= step ? '#ef0e30' : 'rgba(27,60,90,0.15)',
                }}
              />
            ))}
          </div>

          {/* ── STEP 1 — PHOTO ───────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h1 className="text-[#1b3c5a] text-2xl mb-1" style={headStyle}>
                Add your profile photo
              </h1>
              <p className="text-[#7a8a96] text-sm mb-7" style={bodyStyle}>
                Help your fellow members put a face to the name.
              </p>

              <div className="flex flex-col items-center gap-3 mb-7">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-full flex items-center justify-center border-2 border-dashed border-[rgba(27,60,90,0.25)] bg-[rgba(27,60,90,0.03)] hover:border-[#68a2b9] transition-colors overflow-hidden flex-shrink-0"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-[#7a8a96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
                <p className="text-xs text-[#7a8a96]" style={bodyStyle}>
                  {avatarPreview ? 'Tap to change' : 'Tap to select an image'}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setAvatarFile(file)
                  setAvatarPreview(URL.createObjectURL(file))
                }}
              />

              {uploadError && (
                <p className="text-[#ef0e30] text-sm mb-4 text-center" style={bodyStyle}>{uploadError}</p>
              )}

              <button
                type="button"
                onClick={handlePhotoUpload}
                disabled={uploading || !avatarFile}
                className={btnRed}
                style={{ ...labelStyle, backgroundColor: '#ef0e30' }}
              >
                {uploading ? 'Uploading…' : 'Upload photo'}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-3 py-2 text-sm text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
                style={bodyStyle}
              >
                Skip for now →
              </button>
            </div>
          )}

          {/* ── STEP 2 — PILLAR ──────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h1 className="text-[#1b3c5a] text-2xl mb-1" style={headStyle}>
                What&apos;s your primary focus?
              </h1>
              <p className="text-[#7a8a96] text-sm mb-6" style={bodyStyle}>
                Choose the pillar that matters most to you right now.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-7">
                {PILLARS.map(pillar => (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setSelectedPillar(pillar.id)}
                    className="relative p-4 rounded-lg border-2 text-left transition-all"
                    style={{
                      borderColor: selectedPillar === pillar.id ? pillar.color : 'rgba(27,60,90,0.12)',
                      backgroundColor: selectedPillar === pillar.id ? `${pillar.color}18` : 'transparent',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: pillar.color }} />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7a8a96] mb-0.5" style={labelStyle}>
                      Pillar {pillar.id.slice(1)}
                    </p>
                    <p className="text-sm font-semibold text-[#1b3c5a]" style={bodyStyle}>
                      {pillar.label}
                    </p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePillarSave}
                disabled={!selectedPillar || savingPillar}
                className={btnRed}
                style={{ ...labelStyle, backgroundColor: '#ef0e30' }}
              >
                {savingPillar ? 'Saving…' : 'Continue →'}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full mt-3 py-2 text-sm text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
                style={bodyStyle}
              >
                Skip for now →
              </button>
            </div>
          )}

          {/* ── STEP 3 — INTRO POST ──────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h1 className="text-[#1b3c5a] text-2xl mb-1" style={headStyle}>
                Say hello to the community
              </h1>
              <p className="text-[#7a8a96] text-sm mb-6" style={bodyStyle}>
                Introduce yourself — where you&apos;re from, what you do, and what you&apos;re working on.
              </p>

              <textarea
                value={introText}
                onChange={e => setIntroText(e.target.value.slice(0, 500))}
                rows={5}
                placeholder={`Hi, I'm ${displayName}. I work in [industry] and I'm focused on [goal] right now...`}
                className="w-full px-3 py-2.5 rounded border border-[rgba(27,60,90,0.2)] text-[#1b3c5a] text-sm placeholder:text-[#7a8a96] focus:outline-none focus:border-[#68a2b9] focus:ring-2 focus:ring-[#68a2b9]/20 transition-colors resize-none mb-1"
                style={bodyStyle}
              />
              <p className="text-right text-xs text-[#7a8a96] mb-6" style={bodyStyle}>
                {introText.length}/500
              </p>

              {postError && (
                <p className="text-[#ef0e30] text-sm mb-4" style={bodyStyle}>{postError}</p>
              )}

              <button
                type="button"
                onClick={handleIntroPost}
                disabled={posting || introText.trim().length < 10}
                className={btnRed}
                style={{ ...labelStyle, backgroundColor: '#ef0e30' }}
              >
                {posting ? 'Posting…' : 'Post intro →'}
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full mt-3 py-2 text-sm text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
                style={bodyStyle}
              >
                Skip for now →
              </button>
            </div>
          )}

          {/* ── STEP 4 — WELCOME ─────────────────────────────────────────── */}
          {/* Bug 3 fix: no opacity animation — content is already in state, renders immediately */}
          {step === 4 && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO}
                alt="Evolved Pros"
                className="mx-auto mb-6"
                style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
              />

              <h1 className="text-[#1b3c5a] text-2xl mb-2" style={headStyle}>
                You&apos;re in. Welcome to Evolved Pros.
              </h1>
              <p className="text-[#7a8a96] text-sm mb-6" style={bodyStyle}>
                Your community, your pillars, your growth — all in one place.
              </p>

              {selectedPillarData && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                  style={{
                    backgroundColor: `${selectedPillarData.color}18`,
                    border: `1px solid ${selectedPillarData.color}40`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPillarData.color }} />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ ...labelStyle, color: selectedPillarData.color }}
                  >
                    Pillar {selectedPillarData.id.slice(1)}: {selectedPillarData.label}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className={btnRed}
                style={{ ...labelStyle, backgroundColor: '#ef0e30' }}
              >
                {completing ? 'Loading…' : "Let's go →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
