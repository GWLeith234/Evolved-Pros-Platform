/**
 * LIVE testimonials on /live. REV2 order: featured quote, award,
 * featured quote, industry quote, rating strip, recognition pair,
 * then the existing partner quotes.
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
  /** Omitted when a card has no role line. */
  role?: string
  /** Short meta line under the role. Omitted when a card has none. */
  event?: string
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
  /** Outlet name drawn as a text badge. No logo image files. */
  logoText?: string
  /** Unused. Logo images are not rendered. */
  logoUrl?: string
  reviews?: LiveTestimonialReviewLine[]
  /** Rating badge. No review count. */
  ratingLabel?: string
  /** Large award title. */
  mark?: string
}

export const LIVE_TESTIMONIALS_EYEBROW = 'From the field'
export const LIVE_TESTIMONIALS_TITLE = 'What partners say'
export const LIVE_TESTIMONIALS_KICKER =
  'Training floors, mentorship, and the mic. Not just the keynote slot.'

export const LIVE_TESTIMONIAL_BANDS = [
  'featured',
  'industry',
  'reviews',
  'recognition',
  'existing',
] as const

export type LiveTestimonialBandId = (typeof LIVE_TESTIMONIAL_BANDS)[number]

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
  ]
  for (const item of items) {
    for (const value of [
      item.quote,
      item.author,
      item.role,
      item.event,
      item.sourceLabel,
      item.ratingLabel,
      item.mark,
      item.initials,
      item.logoText,
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
const HUBSPOT = 'https://blog.hubspot.com/sales/top-sales-podcasts'
const LOCALOGY =
  'https://www.localogy.com/2019/03/new-podcast-glengarry-glen-george-featuring-george-leith/'

export const LIVE_TESTIMONIALS: LiveTestimonial[] = [
  {
    kind: 'quote',
    featured: true,
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
    mark: 'Top Gun 51',
    quote:
      'Named among top indirect IT and telecom channel sales leaders by Channel Partners / Channel Futures editors.',
    author: 'George Leith',
    role: 'Then CCO & EVP of Sales, Vendasta',
    event: 'Channel Partners · 2020',
    href: VENDASTA_TOP_GUN,
    sourceLabel: 'vendasta.com/newsroom',
  },
  {
    kind: 'quote',
    featured: true,
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
    quote:
      'George pairs four decades of go-to-market experience with a teacher’s mindset. From scaling Vendasta’s customer teams to shaping AdCellerant’s international expansion, he leans on education, integrity, and practical AI to raise the bar.',
    author: 'IAB Canada',
    role: 'Humans of Digital · 2025 · IAB Canada',
    event: '2025 · Lifelong learning',
    logoText: 'IAB Canada',
    href: IAB,
    sourceLabel: 'iabcanada.com',
  },
  {
    kind: 'reviews',
    author: 'Apple Podcasts listeners',
    event: 'Rating · public',
    // 5.0 (1 rating, US) from the Evolved Pros Apple page (id1895786556). Checked Oct 19, 2026.
    ratingLabel: '5.0 on Apple Podcasts',
  },
  {
    kind: 'quote',
    quote:
      'If selling to local businesses is your game, this weekly podcast is chock-full of tips and strategies that make it easier.',
    author: 'HubSpot',
    role: '#22 · Top Sales Podcasts',
    event: 'Conquer Local · 2026 list',
    href: HUBSPOT,
    sourceLabel: 'blog.hubspot.com',
  },
  {
    kind: 'quote',
    quote:
      'A rep should spend 60% of their time talking to customers, 30% of their time building their product knowledge or researching their next appointment, and 10% of their time on admin. A lot of organizations have that formula flipped on its head.',
    author: 'George Leith',
    role: 'Localogy podcast · Glengarry Glen George',
    event: '2019 · 60/30/10 rule',
    logoText: 'Localogy',
    href: LOCALOGY,
    sourceLabel: 'localogy.com',
  },
  {
    kind: 'quote',
    existing: true,
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
    quote:
      'It was such a pleasure to be a guest on the podcast. The team is amazing and it was a joy to chat. I loved our conversation and hope we collaborate again.',
    author: 'Dr. Cindy McGovern',
    role: 'CEO, Orange Leaf Consulting',
    event: 'Conquer Local Podcast',
    headshotUrl: '/images/testimonials/cindy-mcgovern-320.webp',
  },
  {
    kind: 'quote',
    existing: true,
    quote:
      'George Leith has a gift for helping you figure out where you are, where you want to go, and what you actually need to do to get there. I’ve known him for years, and his depth of experience across media, advertising, and software has made him an invaluable sounding board. During a major career transition, he helped me focus my strengths, close gaps in my knowledge, and build proposals that helped me land a role with substantially greater opportunity and compensation. His guidance is personal, practical, and grounded in experience. Having George in your corner is an investment I can wholeheartedly recommend.',
    author: 'Ken Campbell',
    role: 'Business Development Director, Media & Publishing, Workbooks CRM',
    event: 'Career Transition',
  },
]
