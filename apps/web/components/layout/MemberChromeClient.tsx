'use client'

/**
 * Member chrome wrappers.
 *
 * History (HYDRATION-FIX-4): TopNav / BottomTabBar / NextEventBanner / RightRail
 * were forced `dynamic({ ssr: false })` because static imports of
 * `@/lib/supabase/client` pulled realtime-js into the hydration path (#425/#422).
 *
 * Post-deploy (qa followup): those static imports were removed / deferred to
 * dynamic `import()` inside event handlers and effects, so chrome can SSR again.
 * That eliminates the empty-nav flash on cold load while keeping realtime off
 * the initial server module graph for the shell.
 *
 * NotifBell still loads via ssr:false (see TopNav) — a tiny placeholder
 * reserves the bell slot so layout does not jump.
 */

export { TopNav as TopNavClient } from './TopNav'
export { BottomTabBar as BottomTabBarClient } from './BottomTabBar'
export { NextEventBanner as NextEventBannerClient } from './NextEventBanner'
// RightRail is retired (was CSS-hidden but still fetching). Export kept as a
// no-op for any stale imports; member layout no longer mounts it.
export { RightRail as RightRailClient } from './RightRail'
