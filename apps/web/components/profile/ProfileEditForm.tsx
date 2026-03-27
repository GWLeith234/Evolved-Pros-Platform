'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Button } from '@evolved-pros/ui'
import { Tooltip } from '@/components/ui/Tooltip'

const PILLAR_LABELS: Record<string, string> = {
  p1: 'Foundation',
  p2: 'Identity',
  p3: 'Mental Toughness',
  p4: 'Strategy',
  p5: 'Accountability',
  p6: 'Execution',
}

type ProfileFields = {
  display_name: string | null
  full_name: string | null
  bio: string | null
  role_title: string | null
  location: string | null
  avatar_url: string | null
  company: string | null
  linkedin_url: string | null
  website_url: string | null
  twitter_handle: string | null
  phone: string | null
  phone_visible: boolean
  current_pillar: string | null
  goal_90day: string | null
  goal_visible: boolean
}

interface ProfileEditFormProps {
  userId: string
  profile: ProfileFields
  onSaved?: (updated: ProfileFields) => void
}

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        }, 'image/jpeg', 0.9)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ProfileEditForm({ userId, profile, onSaved }: ProfileEditFormProps) {
  const [fields, setFields] = useState({
    display_name: profile.display_name ?? '',
    full_name: profile.full_name ?? '',
    bio: profile.bio ?? '',
    role_title: profile.role_title ?? '',
    location: profile.location ?? '',
    company: profile.company ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    website_url: profile.website_url ?? '',
    twitter_handle: profile.twitter_handle ?? '',
    phone: profile.phone ?? '',
  })
  const [phoneVisible, setPhoneVisible] = useState(profile.phone_visible ?? false)
  const [currentPillar, setCurrentPillar] = useState<string | null>(profile.current_pillar ?? null)
  const [goal90day, setGoal90day] = useState(profile.goal_90day ?? '')
  const [goalVisible, setGoalVisible] = useState(profile.goal_visible ?? true)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  function handleChange(field: string, value: string) {
    setFields(prev => ({ ...prev, [field]: value }))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'Please upload a JPEG, PNG, or WebP image.')
      return
    }
    setAvatarLoading(true)
    try {
      const resized = await resizeImage(file, 400)
      const supabase = createClient()
      const path = `${userId}/${userId}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, resized, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = `${data.publicUrl}?t=${Date.now()}`
      setAvatarUrl(newUrl)

      await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: newUrl }),
      })
    } catch {
      showToast('error', 'Avatar upload failed. Please try again.')
    } finally {
      setAvatarLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Strip leading @ from twitter_handle on save
      const twitter = fields.twitter_handle.startsWith('@')
        ? fields.twitter_handle.slice(1)
        : fields.twitter_handle

      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          twitter_handle: twitter,
          phone_visible: phoneVisible,
          current_pillar: currentPillar,
          goal_90day: goal90day,
          goal_visible: goalVisible,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Save failed')
      }
      const updated = await res.json()
      onSaved?.(updated)
      showToast('success', 'Profile saved successfully.')
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }

  const displayName = fields.display_name || fields.full_name || 'Member'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className="px-4 py-3 rounded font-body text-sm"
          style={{
            backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fff5f5',
            color: toast.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className="block font-condensed font-semibold uppercase tracking-wide text-xs text-[#1b3c5a] mb-2">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="relative w-16 h-16 rounded overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#ef0e30' }}
          >
            {avatarLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 object-cover" />
            ) : (
              <span className="font-condensed font-bold text-white text-xl">
                {getInitials(displayName)}
              </span>
            )}
          </button>
          <div>
            <p className="font-body text-sm text-[#1b3c5a]">Click to upload a new photo</p>
            <p className="font-body text-xs text-[#7a8a96] mt-0.5">JPEG, PNG or WebP · max 400×400</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tooltip content="Shown on your posts, leaderboard, and community profile." className="block">
          <Input
            label="Display Name"
            value={fields.display_name}
            onChange={e => handleChange('display_name', e.target.value)}
            maxLength={50}
            placeholder="How you appear to others"
          />
        </Tooltip>
        <Tooltip content="Your full name. Only visible to administrators." className="block">
          <Input
            label="Full Name"
            value={fields.full_name}
            onChange={e => handleChange('full_name', e.target.value)}
            maxLength={100}
            placeholder="Your full name"
          />
        </Tooltip>
        <Input
          label="Role / Title"
          value={fields.role_title}
          onChange={e => handleChange('role_title', e.target.value)}
          maxLength={100}
          placeholder="e.g. Real Estate Agent"
        />
        <Input
          label="Location"
          value={fields.location}
          onChange={e => handleChange('location', e.target.value)}
          maxLength={100}
          placeholder="City, State"
        />
      </div>

      <Textarea
        label="Bio"
        value={fields.bio}
        onChange={e => handleChange('bio', e.target.value)}
        maxLength={300}
        rows={4}
        placeholder="Tell the community about yourself..."
      />

      {/* Professional section */}
      <div>
        <p className="font-condensed font-bold uppercase tracking-widest text-[9px] text-[#7a8a96] mb-4">
          Professional
        </p>

        <div className="space-y-4">
          <Input
            label="Company"
            value={fields.company}
            onChange={e => handleChange('company', e.target.value)}
            maxLength={150}
            placeholder="Your company or organization"
          />

          <Input
            label="LinkedIn URL"
            value={fields.linkedin_url}
            onChange={e => handleChange('linkedin_url', e.target.value)}
            maxLength={300}
            placeholder="https://linkedin.com/in/yourname"
          />

          <Input
            label="Website"
            value={fields.website_url}
            onChange={e => handleChange('website_url', e.target.value)}
            maxLength={300}
            placeholder="https://yourwebsite.com"
          />

          <Input
            label="Twitter / X Handle"
            value={fields.twitter_handle}
            onChange={e => handleChange('twitter_handle', e.target.value)}
            maxLength={50}
            placeholder="@handle (without the @)"
          />

          {/* Phone + visibility toggle */}
          <div>
            <Input
              label="Phone"
              value={fields.phone}
              onChange={e => handleChange('phone', e.target.value)}
              maxLength={30}
              placeholder="+1 (555) 000-0000"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={phoneVisible}
                onChange={e => setPhoneVisible(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1b3c5a] cursor-pointer"
              />
              <span className="font-condensed text-[11px] uppercase tracking-wide text-[#7a8a96]">
                Visible to members
              </span>
            </label>
          </div>

          {/* Current Pillar pill selector */}
          <div>
            <label className="block font-condensed font-semibold uppercase tracking-wide text-xs text-[#1b3c5a] mb-2">
              Current Pillar
            </label>
            <div className="flex flex-wrap gap-2">
              {(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const).map(pillar => {
                const isActive = currentPillar === pillar
                return (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => setCurrentPillar(isActive ? null : pillar)}
                    className="px-3 py-1.5 rounded font-condensed font-bold uppercase tracking-wide text-[10px] transition-all"
                    style={{
                      backgroundColor: isActive ? '#1b3c5a' : 'transparent',
                      color: isActive ? '#ffffff' : '#7a8a96',
                      border: `1.5px solid ${isActive ? '#1b3c5a' : 'rgba(27,60,90,0.2)'}`,
                    }}
                  >
                    {pillar.toUpperCase()} · {PILLAR_LABELS[pillar]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 90-Day Goal */}
          <div>
            <Textarea
              label="90-Day Goal"
              value={goal90day}
              onChange={e => setGoal90day(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What are you focused on achieving in the next 90 days?"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={goalVisible}
                onChange={e => setGoalVisible(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1b3c5a] cursor-pointer"
              />
              <span className="font-condensed text-[11px] uppercase tracking-wide text-[#7a8a96]">
                Make this public
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} size="md">
          Save Changes
        </Button>
      </div>
    </form>
  )
}
