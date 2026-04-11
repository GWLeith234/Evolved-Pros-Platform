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
  'strategy':         { label: 'Strategic Approach', color: '#60A5FA', slug: 'strategy' },
  'accountability':   { label: 'Accountability',   color: '#C9A84C', slug: 'accountability' },
  'execution':        { label: 'Execution',        color: '#0ABFA3', slug: 'execution' },
}

export function getPillarLabel(pillar: string | null): string {
  return PILLAR_CONFIG[pillar ?? '']?.label ?? pillar ?? ''
}

export function getPillarColor(pillar: string | null): string {
  return PILLAR_CONFIG[pillar ?? '']?.color ?? '#7a8a96'
}

export const PILLAR_SLUGS = Object.keys(PILLAR_CONFIG)
