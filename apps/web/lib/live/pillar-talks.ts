const SUPABASE_BRANDING = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Branding`

export interface PillarTalk {
  num: string
  tag: string
  color: string
  img: string
  format: string
  title: string
  blurb: string
}

export const PILLAR_TALKS: PillarTalk[] = [
  {
    num: '01',
    tag: 'Foundation',
    color: '#FFA538',
    img: `${SUPABASE_BRANDING}/pillar-1-foundation.jpg`,
    format: 'Keynote · 60–90 min',
    title: 'Building the Foundation',
    blurb: 'Why most sales teams plateau — and the structural fix that finally moves the numbers. The opening pillar of the EVOLVED Architecture™.',
  },
  {
    num: '02',
    tag: 'Identity',
    color: '#A78BFA',
    img: `${SUPABASE_BRANDING}/pillar-2-identity.jpg`,
    format: 'Keynote or breakout · 60 min',
    title: 'Identity-Driven Performance',
    blurb: 'The gap between your reps’ results and their self-image — and how to close it for good.',
  },
  {
    num: '03',
    tag: 'Mental Toughness',
    color: '#F87171',
    img: `${SUPABASE_BRANDING}/pillar-3-mental-toughness.jpg`,
    format: 'Half-day workshop',
    title: 'Mental Toughness for Revenue Teams',
    blurb: 'Interactive. Reps leave with a personal resilience plan and a daily practice they can start tomorrow.',
  },
  {
    num: '04',
    tag: 'Strategy',
    color: '#60A5FA',
    img: `${SUPABASE_BRANDING}/pillar-4-strategy.jpg`,
    format: 'Leadership track · 90 min',
    title: 'Strategy That Survives First Contact',
    blurb: 'Translating annual plans into the four moves that actually show up on Monday morning. For revenue leaders.',
  },
  {
    num: '05',
    tag: 'Accountability',
    color: '#C9A84C',
    img: `${SUPABASE_BRANDING}/pillar-5-accountability.jpg`,
    format: 'Full-day or exec track',
    title: 'Building a Culture of Execution',
    blurb: 'Daily discipline that shows up in the pipeline. Built for the leaders running the team, not just the reps on it.',
  },
  {
    num: '06',
    tag: 'Execution',
    color: '#0ABFA3',
    img: `${SUPABASE_BRANDING}/pillar-6-execution.jpg`,
    format: 'Closing keynote · 45 min',
    title: 'The EVOLVED Seller',
    blurb: 'All six pillars in one room. The signature mainstage talk for SKOs and annual conferences.',
  },
]
