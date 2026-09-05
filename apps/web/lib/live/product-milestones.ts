/**
 * Product / platform milestones — NOT speaking dates.
 * Shown in a compact strip on /live, separate from the stage calendar.
 */

import {
  BOOK_EVENT_TITLE,
  LAUNCH_EVENT_TITLE,
  MASTERMIND_EVENT_DETAIL,
  MASTERMIND_EVENT_TITLE,
} from '@/lib/events/nextEvent'

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
    title: LAUNCH_EVENT_TITLE,
    detail: 'Las Vegas launch with special guest Dennis Yu.',
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
    date: new Date(2026, 9, 2),
    title: MASTERMIND_EVENT_TITLE,
    detail: MASTERMIND_EVENT_DETAIL,
    linkLabel: 'See events',
    linkUrl: '/events',
  },
  {
    date: new Date(2026, 9, 15),
    title: BOOK_EVENT_TITLE,
    detail: 'Hardcover, ebook, and audio. Search Evolved by George Leith.',
    linkLabel: 'Find on Amazon',
    linkUrl: 'https://www.amazon.com/s?k=Evolved+by+George+Leith',
  },
]
