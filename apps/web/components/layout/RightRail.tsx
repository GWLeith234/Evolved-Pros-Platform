'use client'

/**
 * Right-rail ad column — intentionally disabled.
 *
 * The aside was permanently `className="hidden"` (no responsive override) but
 * still mounted on every member page, fetching platform_ads (often twice) and
 * running a 10s rotation timer. That was pure waste.
 *
 * Keep the export so MemberChromeClient / layout imports stay stable. Re-enable
 * by restoring the ad fetch + visible layout classes when the rail is designed
 * back into the desktop shell.
 */
export function RightRail() {
  return null
}
