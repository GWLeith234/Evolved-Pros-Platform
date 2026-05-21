'use client'

/**
 * SPRINT HYDRATION-FIX-6 — SSR-skip wrappers for /media client subtrees.
 *
 * MediaAdZone and StoryComments both import '@/lib/supabase/client' at
 * module level. Supabase's realtime scheduler instantiates a MessagePort
 * during SSR, which surfaces as React hydration errors #425 / #422 on the
 * /media listing and article detail pages. Deferring these subtrees to
 * client-only via next/dynamic with ssr: false closes the diff — the
 * server emits the surrounding page shell and these components mount
 * fresh on the client.
 *
 * dynamic({ ssr: false }) cannot be invoked from a Server Component in
 * App Router, so this wrapper file lives next to the Server page.tsx
 * files and is imported by them (and by MediaPortalClient).
 */

import dynamic from 'next/dynamic'

export const MediaAdZoneClient = dynamic(
  () => import('@/components/media/MediaAdZone').then((m) => m.MediaAdZone),
  { ssr: false },
)

export const StoryCommentsClient = dynamic(
  () => import('@/components/media/StoryComments').then((m) => m.StoryComments),
  { ssr: false },
)
