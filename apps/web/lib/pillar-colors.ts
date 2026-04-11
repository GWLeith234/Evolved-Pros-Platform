export interface PillarConfig {
  color: string
  colorMuted: string
  image: string
  label: string
}

const SUPABASE_BRANDING = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding'

export const PILLAR_CONFIG: Record<number, PillarConfig> = {
  1: { color: '#FFA538', colorMuted: 'rgba(255,165,56,0.12)',  image: `${SUPABASE_BRANDING}/pillar-1-foundation.jpg`,      label: 'Foundation' },
  2: { color: '#A78BFA', colorMuted: 'rgba(167,139,250,0.12)', image: `${SUPABASE_BRANDING}/pillar-2-identity.jpg`,         label: 'Identity' },
  3: { color: '#F87171', colorMuted: 'rgba(248,113,113,0.12)', image: `${SUPABASE_BRANDING}/pillar-3-mental-toughness.jpg`, label: 'Mental Toughness' },
  4: { color: '#60A5FA', colorMuted: 'rgba(96,165,250,0.12)',  image: `${SUPABASE_BRANDING}/pillar-4-strategy.jpg`,         label: 'Strategy' },
  5: { color: '#C9A84C', colorMuted: 'rgba(201,168,76,0.12)',  image: `${SUPABASE_BRANDING}/pillar-5-accountability.jpg`,   label: 'Accountability' },
  6: { color: '#0ABFA3', colorMuted: 'rgba(10,191,163,0.12)',  image: `${SUPABASE_BRANDING}/pillar-6-execution.jpg`,        label: 'Execution' },
}
