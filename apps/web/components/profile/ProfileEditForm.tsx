'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Button } from '@evolved-pros/ui'

type ProfileFields = {
  display_name: string | null
  full_name: string | null
  bio: string | null
  role_title: string | null
  location: string | null
  avatar_url: string | null
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
  })
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
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
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
        <Input
          label="Display Name"
          value={fields.display_name}
          onChange={e => handleChange('display_name', e.target.value)}
          maxLength={50}
          placeholder="How you appear to others"
        />
        <Input
          label="Full Name"
          value={fields.full_name}
          onChange={e => handleChange('full_name', e.target.value)}
          maxLength={100}
          placeholder="Your full name"
        />
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

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} size="md">
          Save Changes
        </Button>
      </div>
    </form>
  )
}
