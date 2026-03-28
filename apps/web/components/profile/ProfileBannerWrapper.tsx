'use client'

import { useState } from 'react'
import { ProfileHeader } from './ProfileHeader'
import { BannerPickerModal } from './BannerPickerModal'

interface ProfileBannerWrapperProps {
  user: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    banner_url: string | null
    role_title: string | null
    tier: string | null
    points: number
    created_at: string
    postCount: number
    location?: string | null
    company?: string | null
    linkedin_url?: string | null
    website_url?: string | null
    twitter_handle?: string | null
    current_pillar?: string | null
    goal_90day?: string | null
    goal_visible?: boolean
  }
  isOwn: boolean
}

export function ProfileBannerWrapper({ user, isOwn }: ProfileBannerWrapperProps) {
  const [bannerUrl, setBannerUrl] = useState(user.banner_url)
  const [showPicker, setShowPicker] = useState(false)

  return (
    <>
      <ProfileHeader
        user={{ ...user, banner_url: bannerUrl }}
        isOwn={isOwn}
        onChangeBanner={isOwn ? () => setShowPicker(true) : undefined}
      />
      {showPicker && isOwn && (
        <BannerPickerModal
          userId={user.id}
          currentBannerUrl={bannerUrl}
          onSave={url => { setBannerUrl(url); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
