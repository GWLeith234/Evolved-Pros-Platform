'use client'

/**
 * SPRINT HYDRATION-FIX-4 — SSR-skip wrappers for the (member) layout chrome.
 *
 * React errors #425 and #422 fire on every (member) page load with the same
 * stack trace landing in @supabase/realtime-js (chunk 2749) via the React
 * scheduler's MessagePort callback. Sprint HYDRATION-FIX-3 wrapped the
 * page-level UnifiedCommunityPage and CommunityFeed in
 * dynamic({ ssr: false }) — that didn't help because the realtime-js bundle
 * was still evaluated for the four chrome components in the shared layout:
 *
 *   TopNav            — imports @/lib/supabase/client; transitively loads
 *                       NotifBell → NotifDrawer (also imports the client).
 *   BottomTabBar      — transitively loads MoreDrawer (imports the client).
 *   NextEventBanner   — imports @/lib/supabase/client directly.
 *   RightRail         — imports @/lib/supabase/client directly.
 *
 * Every one of those imports pulls in @supabase/supabase-js, which evaluates
 * @supabase/realtime-js at module-init on first import. Even though the
 * `.channel()` / `.from()` *calls* sit inside useEffect, the library code
 * runs during the bundle evaluation that React's hydrator triggers as it
 * walks the client subtree. The MessagePort init lands inside React's
 * commit and a hydration error fires.
 *
 * Fix: defer the entire chrome subtree to client-only via next/dynamic with
 * ssr: false. The Server Layout still renders the structural <div>s and the
 * <main> for the page content, so the shell HTML is intact — only these
 * four widgets pop in after mount.
 *
 * dynamic({ ssr: false }) can't be invoked from a Server Component in App
 * Router, so this 'use client' wrapper file holds the dynamic() calls and
 * the Server Layout imports the *Client variants from here. The component
 * type returned by next/dynamic carries the imported component's prop type,
 * so layout.tsx keeps its existing prop signatures unchanged.
 */

import dynamic from 'next/dynamic'

export const TopNavClient = dynamic(
  () => import('./TopNav').then((m) => m.TopNav),
  { ssr: false },
)

export const BottomTabBarClient = dynamic(
  () => import('./BottomTabBar').then((m) => m.BottomTabBar),
  { ssr: false },
)

export const NextEventBannerClient = dynamic(
  () => import('./NextEventBanner').then((m) => m.NextEventBanner),
  { ssr: false },
)

export const RightRailClient = dynamic(
  () => import('./RightRail').then((m) => m.RightRail),
  { ssr: false },
)
