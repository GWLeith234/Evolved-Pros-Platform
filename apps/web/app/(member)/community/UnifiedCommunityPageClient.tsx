'use client'

/**
 * Client-only wrapper for UnifiedCommunityPage.
 *
 * The page opens a Supabase Realtime channel. realtime-js MessagePort
 * plumbing surfaces during hydration (#425/#422) even when the channel
 * opens in an effect. `dynamic({ ssr: false })` cannot be called from a
 * Server Component, so app/(member)/community/page.tsx imports this file.
 */

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { UnifiedCommunityPage as UnifiedCommunityPageType } from '@/components/community/UnifiedCommunityPage'

const UnifiedCommunityPage = dynamic(
  () =>
    import('@/components/community/UnifiedCommunityPage').then(
      (m) => m.UnifiedCommunityPage,
    ),
  { ssr: false },
)

type Props = ComponentProps<typeof UnifiedCommunityPageType>

export function UnifiedCommunityPageClient(props: Props) {
  return <UnifiedCommunityPage {...props} />
}
