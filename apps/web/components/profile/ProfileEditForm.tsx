'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Input, Textarea } from '@evolved-pros/ui'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { BannerPickerModal } from '@/components/profile/BannerPickerModal'
import { ImagePicker } from '@/components/admin/ImagePicker'

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
  banner_url: string | null
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
  userEmail: string
  profile: ProfileFields
  onSaved?: (updated: ProfileFields) => void
}

function InfoIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px', opacity: 0.5, cursor: 'help', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function ProfileEditForm({ userId, userEmail, profile, onSaved }: ProfileEditFormProps) {
  const { showToast: globalToast } = useToast()
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
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url ?? '')
  const [bannerModalOpen, setBannerModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  function showToast(type: 'success' | 'error', message: string) {
    globalToast(message, type)
  }

  function handleChange(field: string, value: string) {
    setFields(prev => ({ ...prev, [field]: value }))
  }

  async function handleAvatarSelected(url: string) {
    setAvatarUrl(url)
    try {
      await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      })
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { avatar_url: url } })
      showToast('success', 'Profile photo updated.')
    } catch {
      showToast('error', 'Could not save profile photo.')
    }
  }

  function handleBannerSaved(url: string) {
    setBannerUrl(url)
    setBannerModalOpen(false)
    showToast('success', 'Banner updated.')
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
      showToast('success', 'Profile updated')
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Profile Photo ─────────────────────────────────────────── */}
      <ImagePicker
        label="Profile Photo"
        value={avatarUrl || null}
        onChange={handleAvatarSelected}
        uploadEndpoint="/api/user/avatar"
      />

      {/* ── Profile Banner ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center mb-2">
          <label className="font-condensed font-medium uppercase text-[12px]" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
            Profile Banner
          </label>
          <Tooltip content="Landscape image · Minimum 1200×300px · JPEG or PNG · File size under 5MB · Your banner appears at the top of your public profile page">
            <InfoIcon />
          </Tooltip>
        </div>

        {/* Current banner preview strip */}
        <div
          className="w-full rounded overflow-hidden mb-2"
          style={{
            height: '72px',
            backgroundColor: '#1b3c5a',
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <button
          type="button"
          onClick={() => setBannerModalOpen(true)}
          className="font-condensed font-bold uppercase tracking-wide text-[12px] px-4 py-2 rounded transition-colors"
          style={{
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
          }}
        >
          Change Banner
        </button>
      </div>

      {/* Banner picker modal */}
      {bannerModalOpen && (
        <BannerPickerModal
          userId={userId}
          userEmail={userEmail}
          currentBannerUrl={bannerUrl || null}
          onSave={handleBannerSaved}
          onClose={() => setBannerModalOpen(false)}
        />
      )}

      {/* ── Fields ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tooltip content="Shown on your posts, leaderboard, and community profile." className="block">
          <div>
            <Input
              label="Display Name"
              value={fields.display_name}
              onChange={e => handleChange('display_name', e.target.value)}
              maxLength={50}
              placeholder="How you appear to others"
            />
            <p className="font-condensed text-[12px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Your public handle — shown in community posts and leaderboard.
            </p>
          </div>
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
        <p className="font-condensed font-medium uppercase text-[12px] mb-4" style={{ color: 'var(--text-secondary)', letterSpacing: '0.12em' }}>
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
              <span className="font-condensed text-[12px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Visible to members
              </span>
            </label>
          </div>

          {/* Current Pillar pill selector */}
          <div>
            <label className="block font-condensed font-medium uppercase text-[12px] mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
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
                    className="px-3 py-1.5 rounded font-condensed font-bold uppercase tracking-wide text-[12px] transition-all"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      border: `1.5px solid var(--border-color)`,
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
              <span className="font-condensed text-[12px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
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
