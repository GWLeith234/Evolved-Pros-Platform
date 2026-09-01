import { themeSyncScript } from '@/lib/theme-script'
import { isThemePreference } from '@/lib/theme'

/**
 * Server component. Inlines the authenticated member's stored
 * `public.users.theme` so the database — not localStorage — is the source of
 * truth on load.
 *
 * Rendered at the top of the member/admin shell (both layouts are already
 * dynamic, so this costs no extra query: resolveCurrentUser already selects
 * the row). Because it is a parse-blocking script inside <body>, it applies
 * before the shell paints, which is what keeps a fresh browser or private
 * window from flashing the platform default first.
 *
 * Renders nothing when the value isn't one of the three known preferences,
 * leaving the localStorage hint from <ThemeInit /> in place.
 */
export function ThemeSync({ theme }: { theme: string | null | undefined }) {
  if (!isThemePreference(theme)) return null
  return <script dangerouslySetInnerHTML={{ __html: themeSyncScript(theme) }} />
}
