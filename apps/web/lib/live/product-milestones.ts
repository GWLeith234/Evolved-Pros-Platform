/**
 * Product / platform milestones — NOT speaking dates.
 * Shown in a compact strip on /live, separate from the stage calendar.
 */

export interface ProductMilestone {
  date: Date
  title: string
  detail?: string
  linkLabel?: string
  linkUrl?: string
}

export const PRODUCT_MILESTONES: ProductMilestone[] = [
  {
    date: new Date(2026, 3, 28),
    title: 'Conquer Local Podcast launches',
    detail: 'Season 1 on Apple, Spotify, and YouTube.',
    linkLabel: 'Listen',
    linkUrl: '/podcast',
  },
  {
    date: new Date(2026, 4, 15),
    title: 'EVOLVED Platform goes live',
    detail: 'Courses, community, and the daily operating system for members.',
    linkLabel: 'Enter the platform',
    linkUrl: '/home',
  },
  {
    date: new Date(2026, 6, 15),
    title: 'EVOLVED book launch',
    detail: 'Hardcover, ebook, and audio — search “Evolved by George Leith.”',
    linkLabel: 'Find on Amazon',
    linkUrl: 'https://www.amazon.com/s?k=Evolved+by+George+Leith',
  },
]
