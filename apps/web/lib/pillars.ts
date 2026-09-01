/**
 * Shared pillar configuration — importable by both server and client components.
 * NO "use client" directive — this is a plain module.
 */

export interface PillarInfo {
  label: string
  color: string
  slug: string
}

export const PILLAR_CONFIG: Record<string, PillarInfo> = {
  'foundation':       { label: 'Foundation',       color: '#FFA538', slug: 'foundation' },
  'identity':         { label: 'Identity',         color: '#A78BFA', slug: 'identity' },
  'mental-toughness': { label: 'Mental Toughness', color: '#F87171', slug: 'mental-toughness' },
  'strategy':         { label: 'Strategy',           color: '#60A5FA', slug: 'strategy' },
  'accountability':   { label: 'Accountability',   color: '#C9A84C', slug: 'accountability' },
  'execution':        { label: 'Execution',        color: '#0ABFA3', slug: 'execution' },
}

export function getPillarLabel(pillar: string | null): string {
  return PILLAR_CONFIG[pillar ?? '']?.label ?? pillar ?? ''
}

export function getPillarColor(pillar: string | null): string {
  return PILLAR_CONFIG[pillar ?? '']?.color ?? '#7a8a96'
}

/**
 * Pillar families drive the photoless cover motif:
 *   GROUNDED (warm)  → foundation, accountability, execution
 *   COSMIC   (cool)  → identity, mental-toughness, strategy
 * The accent color always still comes from PILLAR_CONFIG for the specific pillar.
 */
export type PillarFamily = 'grounded' | 'cosmic'

export const PILLAR_FAMILY: Record<string, PillarFamily> = {
  'foundation':       'grounded',
  'accountability':   'grounded',
  'execution':        'grounded',
  'identity':         'cosmic',
  'mental-toughness': 'cosmic',
  'strategy':         'cosmic',
}

export function getPillarFamily(pillar: string | null): PillarFamily {
  return PILLAR_FAMILY[pillar ?? ''] ?? 'cosmic'
}

export const PILLAR_SLUGS = Object.keys(PILLAR_CONFIG)

// ── Single pillar model (Sprint 3) ───────────────────────────────────────────
// One canonical array driving every pillar surface (hero "Architecture" strip,
// the Path Forward stepper, and the lower progress bars). Order is the fixed
// EVOLVED program order, 1 Foundation → 6 Execution, ascending everywhere.
//
// `abbr` is ONE label scheme for all six (no mixing truncated + full): each is
// the pillar's leading single word, spelled in full — never a period-truncated
// stub like `FOUNDTN.`/`EXEC.`. The only name that actually shortens is the one
// two-word pillar ("Mental Toughness" → "Mental"); the other five are already
// single words, so `abbr === name` for them. Surfaces render the full `name`
// where space allows and `abbr` in tight columns, never mixing the two styles.
// Runtime progress (`pct`) is NOT stored here — it is per-user and supplied by
// the page; this module is the static name/order/abbr source only.

export interface Pillar {
  /** Canonical pillar number, 1..6, ascending program order. */
  n: 1 | 2 | 3 | 4 | 5 | 6
  /** Full display name (sentence-cased noun). */
  name: string
  /** One uppercase word, used in tight columns. Same scheme for all six. */
  abbr: string
  /** Course/config slug. */
  slug: string
}

export const PILLARS: readonly Pillar[] = [
  { n: 1, name: 'Foundation',       abbr: 'Foundation',  slug: 'foundation' },
  { n: 2, name: 'Identity',         abbr: 'Identity',    slug: 'identity' },
  { n: 3, name: 'Mental Toughness', abbr: 'Mental',      slug: 'mental-toughness' },
  { n: 4, name: 'Strategy',         abbr: 'Strategy',    slug: 'strategy' },
  { n: 5, name: 'Accountability',   abbr: 'Accountability', slug: 'accountability' },
  { n: 6, name: 'Execution',        abbr: 'Execution',   slug: 'execution' },
] as const

/** Lookup a pillar by its 1..6 number. */
export function getPillar(n: number): Pillar | undefined {
  return PILLARS.find(p => p.n === n)
}
