'use client'

/**
 * Client-only wrappers for /media subtrees.
 *
 * MediaAdZone and StoryComments import `@/lib/supabase/client` at module
 * scope. realtime-js constructs a MessagePort during SSR and hydration
 * fails (#425/#422). `dynamic({ ssr: false })` has to live in a client
 * file — App Router rejects it from a Server Component.
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
