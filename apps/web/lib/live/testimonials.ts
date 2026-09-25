/**
 * LIVE testimonials on /live. REV2 order matches the approved mock:
 * featured quote, award, featured quote, industry quote, reviews strip,
 * recognition pair, then the existing partner quotes.
 * Harvard Media is not part of this set.
 */

export type LiveTestimonialKind = 'quote' | 'award' | 'reviews'

export interface LiveTestimonialReviewLine {
  text: string
}

export interface LiveTestimonial {
  kind: LiveTestimonialKind
  /** Primary quote body. Award cards reuse this for the short blurb under the mark. */
  quote?: string
  author: string
  role: string
  /** Short meta line under the role. */
  event: string
  /** Source link for new cards. */
  href?: string
  /** Visible label for href. */
  sourceLabel?: string
  featured?: boolean
  existing?: boolean
  /** Person photo. WebP when supplied; JPG sibling is the fallback. */
  headshotUrl?: string
  /** Initials when a person card has no headshot yet. */
  initials?: string
  /** Outlet or award logo. Omit until a file is supplied. Never invent one. */
  logoUrl?: string
  /** Brand name in the logo slot. Set even when logoUrl is still empty. */
  logoLabel?: string
  reviews?: LiveTestimonialReviewLine[]
  /** e.g. "5.0 · 109 reviews" */
  ratingLabel?: string
  /** Large award title. */
  mark?: string
  /** Gold eyebrow on the card. */
  eyebrow?: string
}

export const LIVE_TESTIMONIALS_EYEBROW = 'From the field'
export const LIVE_TESTIMONIALS_TITLE = 'What partners say'
export const LIVE_TESTIMONIALS_KICKER =
  'Training floors, mentorship, and the mic. Not just the keynote slot.'

export const LIVE_TESTIMONIAL_BANDS = [
  { id: 'featured', label: 'Featured credibility · quote · award · quote' },
  { id: 'industry', label: 'Industry voice · quote · logo slot' },
  { id: 'reviews', label: 'Listener proof · reviews strip · full width' },
  { id: 'recognition', label: 'Recognition · quote / badge · logo slots' },
  { id: 'existing', label: 'Existing partners · keep · labeled EXISTING · headshot slots' },
] as const

export type LiveTestimonialBandId = (typeof LIVE_TESTIMONIAL_BANDS)[number]['id']

export function headshotSources(url: string): { webp?: string; src: string } {
  if (url.endsWith('.webp')) {
    return { webp: url, src: url.replace(/\.webp$/, '.jpg') }
  }
  return { src: url }
}

export function groupLiveTestimonials(items: readonly LiveTestimonial[] = LIVE_TESTIMONIALS) {
  const featured: LiveTestimonial[] = []
  const industry: LiveTestimonial[] = []
  const reviews: LiveTestimonial[] = []
  const recognition: LiveTestimonial[] = []
  const existing: LiveTestimonial[] = []
  let phase: 'open' | 'industry' | 'after-reviews' = 'open'

  for (const item of items) {
    if (item.existing) {
      existing.push(item)
      continue
    }
    if (item.kind === 'reviews') {
      reviews.push(item)
      phase = 'after-reviews'
      continue
    }
    if (phase === 'open' && (item.featured || item.kind === 'award')) {
      featured.push(item)
      continue
    }
    if (phase === 'open') phase = 'industry'
    if (phase === 'industry') industry.push(item)
    else recognition.push(item)
  }

  return { featured, industry, reviews, recognition, existing }
}

export function liveTestimonialCopyStrings(
  items: readonly LiveTestimonial[] = LIVE_TESTIMONIALS,
): string[] {
  const out: string[] = [
    LIVE_TESTIMONIALS_EYEBROW,
    LIVE_TESTIMONIALS_TITLE,
    LIVE_TESTIMONIALS_KICKER,
    ...LIVE_TESTIMONIAL_BANDS.map(band => band.label),
  ]
  for (const item of items) {
    for (const value of [
      item.quote,
      item.author,
      item.role,
      item.event,
      item.sourceLabel,
      item.logoLabel,
      item.ratingLabel,
      item.mark,
      item.eyebrow,
      item.initials,
    ]) {
      if (value) out.push(value)
    }
    for (const line of item.reviews ?? []) out.push(line.text)
  }
  return out
}

const VENDASTA_CRO = 'https://www.vendasta.com/newsroom/vendasta-promotes-george-leith-to-cro/'
const VENDASTA_TOP_GUN =
  'https://www.vendasta.com/newsroom/vendasta-cco-george-leith-named-top-gun-51-channel-partners/'
const CHARLES =
  'https://charleslaughlin.substack.com/p/episode-3-george-leith-evp-and-cro'
const IAB =
  'https://iabcanada.com/humans-of-digital-george-leith-on-lifelong-learning-and-growth/'
const APPLE = 'https://podcasts.apple.com/us/podcast/conquer-local-podcast/id1327121811'
const HUBSPOT = 'https://blog.hubspot.com/sales/top-sales-podcasts'
const LOCALOGY =
  'https://www.localogy.com/2019/03/new-podcast-glengarry-glen-george-featuring-george-leith/'

export const LIVE_TESTIMONIALS: LiveTestimonial[] = [
  {
    kind: 'quote',
    featured: true,
    eyebrow: 'Quote · featured',
    quote:
      'George has built a formidable sales organization. He constantly challenges the status quo, making those around him better, and never settles for mediocrity. There is no one I have more confidence in to lead the charge on Vendasta’s aggressive revenue targets.',
    author: 'Brendan King',
    role: 'CEO, Vendasta',
    event: '2017 · CRO promotion',
    headshotUrl: '/images/testimonials/brendan-king-320.webp',
    href: VENDASTA_CRO,
    sourceLabel: 'vendasta.com/newsroom',
  },
  {
    kind: 'award',
    eyebrow: 'Award',
    mark: 'Top Gun 51',
    quote:
      'Named among top indirect IT and telecom channel sales leaders by Channel Partners / Channel Futures editors.',
    author: 'George Leith',
    role: 'Then CCO & EVP of Sales, Vendasta',
    event: 'Channel Partners · 2020',
    logoLabel: 'Channel Partners · optional',
    href: VENDASTA_TOP_GUN,
    sourceLabel: 'vendasta.com/newsroom',
  },
  {
    kind: 'quote',
    featured: true,
    eyebrow: 'Quote · featured',
    quote:
      'One of the masters of the craft of selling at B2B events. George is also one of the best public speakers I have had the pleasure to work with. His talks on the art of selling were always conference highlights.',
    author: 'Charles Laughlin',
    role: 'The Craft of Conferencing Podcast',
    event: '2024 · Episode 3',
    headshotUrl: '/images/testimonials/charles-laughlin-320.webp',
    href: CHARLES,
    sourceLabel: 'charleslaughlin.substack.com',
  },
  {
    kind: 'quote',
    eyebrow: 'Quote · IAB Canada',
    quote:
      'George pairs four decades of go-to-market experience with a teacher’s mindset. From scaling Vendasta’s customer teams to shaping AdCellerant’s international expansion, he leans on education, integrity, and practical AI to raise the bar.',
    author: 'IAB Canada',
    role: 'Humans of Digital · 2025 · IAB Canada',
    event: '2025 · Lifelong learning',
    logoLabel: 'IAB Canada · optional',
    href: IAB,
    sourceLabel: 'iabcanada.com',
  },
  {
    kind: 'reviews',
    eyebrow: 'Apple Podcasts · Conquer Local',
    author: 'Apple Podcasts listeners',
    role: 'Conquer Local Podcast',
    event: 'Reviews · public',
    ratingLabel: '5.0 · 109 reviews',
    logoLabel: 'Apple / Conquer Local · optional',
    reviews: [
      {
        text: 'George Leith is THE heavyweight in the world of local digital marketing… Sincere, informative and real',
      },
      { text: 'George Leith is a wizard in the industry' },
      { text: 'George is a Master Salesman, and true leader in his field' },
    ],
    href: APPLE,
    sourceLabel: 'podcasts.apple.com',
  },
  {
    kind: 'quote',
    eyebrow: 'Quote · HubSpot list',
    quote:
      'If selling to local businesses is your game, this weekly podcast is chock-full of tips and strategies that make it easier.',
    author: 'HubSpot',
    role: '#22 · Top Sales Podcasts',
    event: 'Conquer Local · 2026 list',
    logoLabel: 'HubSpot · optional',
    href: HUBSPOT,
    sourceLabel: 'blog.hubspot.com',
  },
  {
    kind: 'quote',
    eyebrow: 'Quote · 60 / 30 / 10',
    quote:
      'A rep should spend 60% of their time talking to customers, 30% of their time building their product knowledge or researching their next appointment, and 10% of their time on admin. A lot of organizations have that formula flipped on its head.',
    author: 'George Leith',
    role: 'Localogy podcast · Glengarry Glen George',
    event: '2019 · 60/30/10 rule',
    logoLabel: 'Localogy · optional',
    href: LOCALOGY,
    sourceLabel: 'localogy.com',
  },
  {
    kind: 'quote',
    existing: true,
    eyebrow: 'Quote',
    quote:
      'George led many training initiatives for our sales team of 100+ professionals across offices in Toronto and Montreal. He played an integral role in launching our new business and ramping up our sales team in record time. He also provided expert counsel to the Executive team. He is a very hands-on training pro and spent countless hours with our team coaching them right on the sales floor. He also played a mentorship role in our agency and continues to prove himself a valuable partner and true friend.',
    author: 'Mike Giamprini',
    role: 'Owner, GPartners',
    event: 'Toronto · Montreal',
    headshotUrl: '/images/testimonials/mike-giamprini-320.webp',
  },
  {
    kind: 'quote',
    existing: true,
    eyebrow: 'Quote',
    quote:
      'I have such great respect for George, an incredible leader and inspiration. What I love most is his passion for helping other business owners. Truly helping. Keep being the true leader you were born to be.',
    author: 'Amy Andrew Delardi',
    role: 'CEO, Infinite Web Designs',
    event: 'Mentorship',
    // No LIVE crop is stored in this repo. Initials match the approved mock.
    initials: 'AA',
  },
  {
    kind: 'quote',
    existing: true,
    eyebrow: 'Quote',
    quote:
      'It was such a pleasure to be a guest on the podcast. The team is amazing and it was a joy to chat. I loved our conversation and hope we collaborate again.',
    author: 'Dr. Cindy McGovern',
    role: 'CEO, Orange Leaf Consulting',
    event: 'Conquer Local Podcast',
    headshotUrl: '/images/testimonials/cindy-mcgovern-320.webp',
  },
]
