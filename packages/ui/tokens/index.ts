export const colors = {
  navy: '#1b3c5a',
  navyDark: '#112535',
  navyDeep: '#0d1c27',
  red: '#ef0e30',
  redDark: '#c50a26',
  teal: '#68a2b9',
  tealLight: '#a8cdd9',
  offWhite: '#faf9f7',
  muted: '#7a8a96',
  gold: '#c9a84c',
} as const

export const tiers = {
  community: { label: 'Community', color: '#68a2b9' },
  pro:       { label: 'Pro',       color: '#c9a84c' },
} as const

export const pillars = [
  { number: 1, slug: 'p1-foundation',       name: 'Foundation',           tier: 'community' },
  { number: 2, slug: 'p2-identity',         name: 'Identity',             tier: 'community' },
  { number: 3, slug: 'p3-mental-toughness', name: 'Mental Toughness',     tier: 'community' },
  { number: 4, slug: 'p4-strategy',         name: 'Strategy',             tier: 'community' },
  { number: 5, slug: 'p5-accountability',   name: 'Accountability',       tier: 'pro'       },
  { number: 6, slug: 'p6-execution',        name: 'Execution',            tier: 'pro'       },
] as const
