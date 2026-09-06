/**
 * Product / platform milestones. Not speaking dates.
 * Shown as a Timeline on /live. Append new rows to PRODUCT_MILESTONES;
 * the UI sorts by date so order in this list does not matter.
 */

import {
  BOOK_EVENT_TITLE,
  LAUNCH_EVENT_TITLE,
  MASTERMIND_EVENT_DETAIL,
  MASTERMIND_EVENT_TITLE,
} from '@/lib/events/nextEvent'

export interface ProductMilestone {
  /** Stable key. New rows need a unique id. */
  id: string
  date: Date
  title: string
  detail?: string
  linkLabel?: string
  linkUrl?: string
}

export const PRODUCT_LAUNCHES_EYEBROW = 'Milestones'
export const PRODUCT_LAUNCHES_TITLE = 'Product launches'
export const PRODUCT_LAUNCHES_KICKER = 'Platform and media moments. Not stage dates.'

export const AMAZON_BOOK_SEARCH_URL = 'https://www.amazon.com/s?k=Evolved+by+George+Leith'

export const PRODUCT_MILESTONES: ProductMilestone[] = [
  {
    id: 'launch-vegas-2026',
    date: new Date(2026, 3, 28),
    title: LAUNCH_EVENT_TITLE,
    detail: 'Las Vegas launch with special guest Dennis Yu.',
    linkLabel: 'Listen',
    linkUrl: '/podcast',
  },
  {
    id: 'platform-live-2026',
    date: new Date(2026, 4, 15),
    title: 'EVOLVED Platform goes live',
    detail: 'Courses, community, and the daily operating system for members.',
    linkLabel: 'Enter the platform',
    linkUrl: '/home',
  },
  {
    id: 'masterminds-execs-2026',
    date: new Date(2026, 9, 2),
    title: MASTERMIND_EVENT_TITLE,
    detail: MASTERMIND_EVENT_DETAIL,
    linkLabel: 'See events',
    linkUrl: '/events',
  },
  {
    id: 'book-evolved-2026',
    date: new Date(2026, 9, 15),
    title: BOOK_EVENT_TITLE,
    detail: 'Hardcover, ebook, and audio. Search Evolved by George Leith.',
    linkLabel: 'Find on Amazon',
    linkUrl: AMAZON_BOOK_SEARCH_URL,
  },
]

/** Chronological copy of the list so appending a later row still lands last. */
export function sortedProductMilestones(
  list: readonly ProductMilestone[] = PRODUCT_MILESTONES,
): ProductMilestone[] {
  return [...list].sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** GOLD mock date line, e.g. APR 28, 2026. */
export function formatMilestoneDate(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return `${month} ${date.getDate()}, ${date.getFullYear()}`
}

export function milestoneDateTime(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
