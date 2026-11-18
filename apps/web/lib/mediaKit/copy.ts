/**
 * Public /media-kit copy and download paths.
 *
 * Copy rule (George YES 2026-11-17, "Publish with a coming soon"): section
 * copy reuses factual Evolved Pros lines already on /about and /media. The
 * book appears only as MEDIA_KIT_BOOK_NOTE ("New book coming soon"). No book title, subtitle, date, or details. No
 * audience metrics, rates, or legal copy: the PDFs carry the kit. No em
 * dashes.
 *
 * The PDFs are static files in apps/web/public/media-kit. Plain links: no
 * auth, no tracking, no redirect through an API route.
 */

import { ABOUT_DESCRIPTION, ABOUT_WHAT } from '@/lib/about/copy'

export const MEDIA_KIT_PATH = '/media-kit' as const

/**
 * Title, meta description, and press bio come ONLY from facts in the v2.2
 * kit text (pdftotext media-kit-light.pdf). No new claims, figures, or
 * credentials. No dashes of any kind (em, en, or hyphen) in these three.
 * The PR body maps each bio claim to its kit line.
 */
export const MEDIA_KIT_TITLE = 'George Leith Media Kit | Speaker and Podcast Host'
export const MEDIA_KIT_DESCRIPTION =
  'George Leith media kit: speaker, business executive and podcast host. Download the Light or Dark PDF. New book coming soon.'

export const MEDIA_KIT_BIO_KICKER = 'Press bio'
export const MEDIA_KIT_BIO =
  'George Leith is a speaker, business executive and podcast host. At Vendasta, he built a world class team of 250 from scratch in Saskatchewan and grew the company to $100M+ in recurring revenue. He created the Conquer Local Podcast, a show with 265+ episodes heard in 50+ countries that won the 2019 B2B Marketing Exchange Finny Award and the 2021 Silver Top Sales Award. He has spoken at 165+ events across 21+ countries. Today he serves as President of International Partnerships at AdCellerant. He is the founder of Evolved Pros, the platform, podcast and community built around The Evolved Architecture. New book coming soon.'

/**
 * og:image: 1200x630 crop of page 1 of the v2.2 Light PDF. Absolute www URL,
 * same shape as DEFAULT_SHARE_IMAGE, so og:image never names the platform host.
 */
export const MEDIA_KIT_OG_IMAGE_PATH = '/media-kit/evolved-pros-media-kit-og.jpg' as const
export const MEDIA_KIT_OG_IMAGE = {
  url: `https://www.evolvedpros.com${MEDIA_KIT_OG_IMAGE_PATH}`,
  width: 1200,
  height: 630,
  alt: 'Evolved Pros media kit',
} as const

export const MEDIA_KIT_EYEBROW = 'Evolved Pros'
export const MEDIA_KIT_H1 = 'Media kit'
export const MEDIA_KIT_SUMMARY = ABOUT_DESCRIPTION

/** The only book line this page may carry. */
export const MEDIA_KIT_BOOK_NOTE = 'New book coming soon'

export const MEDIA_KIT_DOWNLOAD_KICKER = 'Download'
export const MEDIA_KIT_DOWNLOAD_TITLE = 'Pick an edition'

export interface MediaKitDownload {
  id: 'light' | 'dark'
  label: string
  href: string
  filename: string
}

export const MEDIA_KIT_DOWNLOADS: readonly MediaKitDownload[] = [
  {
    id: 'light',
    label: 'Light edition (PDF)',
    href: '/media-kit/evolved-pros-media-kit-light.pdf',
    filename: 'evolved-pros-media-kit-light.pdf',
  },
  {
    id: 'dark',
    label: 'Dark edition (PDF)',
    href: '/media-kit/evolved-pros-media-kit-dark.pdf',
    filename: 'evolved-pros-media-kit-dark.pdf',
  },
] as const

export interface MediaKitSection {
  kicker: string
  body: readonly string[]
  link: { label: string; href: string }
}

export const MEDIA_KIT_SECTIONS: readonly MediaKitSection[] = [
  {
    kicker: 'What Evolved Pros is',
    body: [ABOUT_WHAT[0], ABOUT_WHAT[1]],
    link: { label: 'About Evolved Pros', href: '/about' },
  },
] as const

export const MEDIA_KIT_CONTACT_LABEL = 'Contact Evolved Pros'
export const MEDIA_KIT_CONTACT_HREF = '/contact' as const

/** Every visible or meta string on the page, for copy-rule tests. */
export function mediaKitCopyStrings(): string[] {
  return [
    MEDIA_KIT_TITLE,
    MEDIA_KIT_DESCRIPTION,
    MEDIA_KIT_EYEBROW,
    MEDIA_KIT_H1,
    MEDIA_KIT_BIO_KICKER,
    MEDIA_KIT_BIO,
    MEDIA_KIT_SUMMARY,
    MEDIA_KIT_BOOK_NOTE,
    MEDIA_KIT_DOWNLOAD_KICKER,
    MEDIA_KIT_DOWNLOAD_TITLE,
    ...MEDIA_KIT_DOWNLOADS.map(d => d.label),
    ...MEDIA_KIT_SECTIONS.flatMap(s => [s.kicker, ...s.body, s.link.label]),
    MEDIA_KIT_CONTACT_LABEL,
  ]
}
