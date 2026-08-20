import { themeInitScript } from '@/lib/theme-script'
import { toThemePreference } from '@/lib/theme'

/**
 * Renders a synchronous inline <script> that applies the theme class before
 * first paint — eliminates any flash of the wrong theme on reload.
 * Supports 'light' | 'dark' | 'system' (system follows prefers-color-scheme,
 * re-evaluated at runtime rather than frozen at write time).
 *
 * Order of authority for the *first paint*:
 *   1. localStorage hint (`ep_theme`) — what this browser last saw
 *   2. platform default_theme (the `defaultTheme` prop)
 * A signed-in member's stored row then corrects this via <ThemeSync />,
 * which runs later in the same document but still before the shell paints.
 */
export function ThemeInit({ defaultTheme }: { defaultTheme: string }) {
  // Never inline an unvalidated platform setting into a <script>.
  const safeDefault = toThemePreference(defaultTheme, 'dark')
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript(safeDefault) }} />
}
