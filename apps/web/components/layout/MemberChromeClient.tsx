'use client'

/**
 * Member chrome wrappers.
 *
 * TopNav, BottomTabBar, and NextEventBanner SSR. Create the Supabase client
 * inside handlers or effects — a static `@/lib/supabase/client` import pulls
 * realtime-js into hydration (#425/#422).
 *
 * NotifBell still loads with ssr:false (see TopNav). Its placeholder holds
 * the bell slot so the layout does not jump.
 */

export { TopNav as TopNavClient } from './TopNav'
export { BottomTabBar as BottomTabBarClient } from './BottomTabBar'
export { NextEventBanner as NextEventBannerClient } from './NextEventBanner'
// RightRail is retired (was CSS-hidden but still fetching). Export kept as a
// no-op for any stale imports; member layout no longer mounts it.
export { RightRail as RightRailClient } from './RightRail'
