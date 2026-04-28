export interface UpcomingDate {
  date: Date
  city: string
  country: string
  event: string
  tag: 'CONFIRMED' | 'HOLD'
  detail?: string
  linkLabel?: string
  linkUrl?: string
}

export const UPCOMING_DATES: UpcomingDate[] = [
  {
    date: new Date(2026, 3, 28),
    city: 'Everywhere',
    country: '',
    event: 'Conquer Local Podcast Launches',
    tag: 'CONFIRMED',
    detail: 'Season 1 drops on every major podcast platform — Apple, Spotify, YouTube. New conversations with operators every week.',
    linkLabel: 'Listen',
    linkUrl: 'https://evolvex360.com/podcast',
  },
  {
    date: new Date(2026, 4, 15),
    city: 'Everywhere',
    country: '',
    event: 'EVOLVED Platform Goes Live',
    tag: 'CONFIRMED',
    detail: 'The full EVOLVED operating system opens to founding members — courses, cohorts, community, and the daily discipline engine.',
    linkLabel: 'Get early access',
    linkUrl: 'https://evolvex360.com',
  },
  {
    date: new Date(2026, 4, 20),
    city: 'Montreal',
    country: 'Canada',
    event: 'TVOT Conference',
    tag: 'CONFIRMED',
    detail: 'Panelist on the future of connected TV and revenue. Joining operators from across the broadcast and streaming industry.',
    linkLabel: 'Conference site',
    linkUrl: 'https://tvot.tv',
  },
  {
    date: new Date(2026, 6, 15),
    city: 'Everywhere',
    country: '',
    event: 'EVOLVED Book Launch Day',
    tag: 'CONFIRMED',
    detail: 'The book that codifies twenty years on stage and in the field. Pre-order on Amazon — search "Evolved by George Leith." Hardcover, ebook and audio.',
    linkLabel: 'Pre-order on Amazon',
    linkUrl: 'https://www.amazon.com/s?k=Evolved+by+George+Leith',
  },
]
