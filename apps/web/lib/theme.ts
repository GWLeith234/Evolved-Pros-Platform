/**
 * Shared theme vocabulary for the light/dark/system preference.
 *
 * The preference is a real user setting: it lives in `public.users.theme`
 * (text, NOT NULL, default 'system') and is written through
 * PATCH /api/settings/theme under the caller's own RLS grant. localStorage
 * (`ep_theme`) is only a pre-paint hint so the first paint isn't wrong — the
 * database row is the source of truth for a signed-in member.
 */

/** What the user chose. 'system' is stored as-is and resolved at runtime. */
export type ThemePreference = 'light' | 'dark' | 'system'

/** What the UI actually renders. 'system' never reaches this type. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']

/** localStorage key holding the pre-paint hint. */
export const THEME_STORAGE_KEY = 'ep_theme'

/** Attribute on <html> carrying the *unresolved* preference for React to read. */
export const THEME_PREF_ATTR = 'data-theme-pref'

/**
 * Browser-chrome colors (iOS status bar / Android toolbar). These mirror
 * --bg-page in each mode (dark #0A0F18, light --paper #F5F0E8) — moved here
 * verbatim from ThemeProvider, not new values.
 */
export const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#0A0F18',
  light: '#F5F0E8',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** Coerces anything (DB text, localStorage, request body) to a valid preference. */
export function toThemePreference(value: unknown, fallback: ThemePreference = 'system'): ThemePreference {
  return isThemePreference(value) ? value : fallback
}

/** Resolves a preference against the OS setting. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

/** Nav toggle order: system → light → dark → system. */
export function nextPreference(current: ThemePreference): ThemePreference {
  if (current === 'system') return 'light'
  if (current === 'light') return 'dark'
  return 'system'
}

const PREFERENCE_LABEL: Record<ThemePreference, string> = {
  system: 'System theme',
  light: 'Light mode',
  dark: 'Dark mode',
}

/** Accessible label describing what a click will switch *to*. */
export function toggleLabel(current: ThemePreference): string {
  return `Theme: ${PREFERENCE_LABEL[current]}. Switch to ${PREFERENCE_LABEL[nextPreference(current)].toLowerCase()}`
}
