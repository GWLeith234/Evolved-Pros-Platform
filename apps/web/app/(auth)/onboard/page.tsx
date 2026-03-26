'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardPage() {
  const [displayName, setDisplayName] = useState('')
  const [roleTitle, setRoleTitle]     = useState('')
  const [location, setLocation]       = useState('')
  const [avatarFile, setAvatarFile]   = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) { setError('Display name is required.'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) { setError('Session expired. Please log in again.'); setLoading(false); return }

    let avatarUrl: string | undefined

    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(path, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('public').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }
    }

    // upsert so new users without a public.users row yet get one created
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id:           user.id,
        email:        user.email,
        display_name: displayName.trim(),
        role_title:   roleTitle.trim() || null,
        location:     location.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        onboarded_at: new Date().toISOString(),
      })

    console.log('[onboard] upsert result — error:', updateError?.message ?? 'none', '| user:', user.id)
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    // Route through /auth/callback so the server refreshes Set-Cookie headers
    // before hitting /home — same reason as the login page redirect
    window.location.href = '/auth/callback?next=/home'
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#112535' }}
    >
      <div className="w-full max-w-[480px] bg-white rounded-lg overflow-hidden shadow-2xl">
        {/* Top accent */}
        <div className="h-1 bg-[#ef0e30]" />

        <div className="px-8 py-10">
          {/* Logo */}
          <div className="mb-2 text-center">
            <p
              className="text-[#1b3c5a] tracking-[0.18em] text-base font-bold"
              style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
            >
              EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6 text-center">
            <p
              className="text-xs text-[#7a8a96] uppercase tracking-widest"
              style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
            >
              Step 1 of 1
            </p>
            <div className="mt-2 h-0.5 bg-[rgba(27,60,90,0.1)] rounded-full">
              <div className="h-full bg-[#ef0e30] rounded-full w-full" />
            </div>
          </div>

          <h1
            className="text-[#1b3c5a] text-3xl mb-2"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }}
          >
            Set up your profile.
          </h1>
          <p className="text-[#7a8a96] text-sm mb-7" style={{ fontFamily: 'Barlow, sans-serif' }}>
            This is how the community sees you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded flex items-center justify-center border-2 border-dashed border-[rgba(27,60,90,0.2)] bg-[rgba(27,60,90,0.03)] hover:border-[#68a2b9] transition-colors overflow-hidden flex-shrink-0"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-[#7a8a96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest text-[#7a8a96] mb-0.5"
                  style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
                >
                  Profile Photo
                </p>
                <p className="text-xs text-[#7a8a96]" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Optional. Square image recommended.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Display Name */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest text-[#7a8a96] mb-1"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                Display Name <span className="text-[#ef0e30]">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How you'll appear in the community"
                className="w-full px-3 py-2.5 rounded border border-[rgba(27,60,90,0.2)] text-[#1b3c5a] text-sm placeholder:text-[#7a8a96] focus:outline-none focus:border-[#68a2b9] focus:ring-2 focus:ring-[#68a2b9]/20 transition-colors"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              />
            </div>

            {/* Role / Title */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest text-[#7a8a96] mb-1"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                Role / Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                placeholder="e.g. Sales Manager, Agency Owner"
                className="w-full px-3 py-2.5 rounded border border-[rgba(27,60,90,0.2)] text-[#1b3c5a] text-sm placeholder:text-[#7a8a96] focus:outline-none focus:border-[#68a2b9] focus:ring-2 focus:ring-[#68a2b9]/20 transition-colors"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              />
            </div>

            {/* Location */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest text-[#7a8a96] mb-1"
                style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
              >
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="City, State or Country"
                className="w-full px-3 py-2.5 rounded border border-[rgba(27,60,90,0.2)] text-[#1b3c5a] text-sm placeholder:text-[#7a8a96] focus:outline-none focus:border-[#68a2b9] focus:ring-2 focus:ring-[#68a2b9]/20 transition-colors"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              />
            </div>

            {error && (
              <p className="text-[#ef0e30] text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full py-3 rounded font-bold uppercase tracking-wider text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                backgroundColor: '#ef0e30',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                'Enter the Platform →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
