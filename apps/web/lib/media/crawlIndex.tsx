import { listPublicMediaStories, mediaArticlePath } from './sitemap'

export type CrawlStory = {
  id: string
  title: string
  pillar: string | null | undefined
  slug: string | null | undefined
  is_published?: boolean | null
}

export type MediaCrawlLink = {
  id: string
  title: string
  href: string
}

/**
 * Published /media/{pillar}/{slug} hrefs for the hub. Shared by the
 * server-rendered crawl <nav> and its unit test so Googlebot and the
 * interactive grid cannot drift.
 */
export function mediaHubCrawlLinks(stories: CrawlStory[]): MediaCrawlLink[] {
  return listPublicMediaStories(stories).flatMap(story => {
    const href = mediaArticlePath(story.pillar, story.slug)
    return href ? [{ id: story.id, title: story.title, href }] : []
  })
}

/**
 * Server-rendered article index. Plain <a href> tags so the initial HTML
 * contains every published path even if MediaPortalClient hydrates later.
 * Hidden from sight, AT, and tab order — the designed grid is the visible
 * list; these are the same URLs for crawlers that do not run client JS.
 */
export function MediaStoryCrawlIndex({ stories }: { stories: CrawlStory[] }) {
  const links = mediaHubCrawlLinks(stories)
  if (links.length === 0) return null

  return (
    <nav aria-hidden="true" className="sr-only" {...{ inert: '' }}>
      <ul>
        {links.map(link => (
          <li key={link.id}>
            <a href={link.href} tabIndex={-1}>{link.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
