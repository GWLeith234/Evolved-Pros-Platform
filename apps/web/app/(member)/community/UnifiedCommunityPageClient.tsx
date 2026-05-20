'use client'

/**
 * SPRINT HYDRATION-FIX-3 — SSR guard for UnifiedCommunityPage.
 *
 * UnifiedCommunityPage opens a Supabase Realtime channel
 * (`supabase.channel('community-unified-feed')`) inside its useEffect.
 * Even though the call site is post-hydration, the @supabase/realtime-js
 * client constructed by createBrowserClient() inside that effect carries
 * MessageChannel/MessagePort plumbing that surfaces in React's scheduler
 * stack on every /community render — the exact "MessagePort.M (chunk
 * 5b8f0dd8)" frame the user is seeing under hydration errors #425/#422.
 *
 * Disabling SSR for the whole component eliminates the dual-render entirely:
 * the server emits nothing for this subtree, the client mounts it fresh, and
 * hydration has no diff to fail on. The server-rendered shell (TopNav,
 * EpisodeBanner, layout chrome) is unaffected.
 *
 * Trade-off: a one-frame placeholder before the feed paints. Acceptable —
 * the feed already paints incrementally and the placeholder matches the
 * existing `<CommunityLoading />` aesthetic.
 *
 * `dynamic({ ssr: false })` cannot be called from a Server Component in
 * App Router, so this wrapper lives in its own 'use client' file and is
 * imported by app/(member)/community/page.tsx.
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
