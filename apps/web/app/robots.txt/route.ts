import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import { ROBOTS_DISALLOW, robotsSitemapUrl } from '@/lib/seo/publicRoutes'

// Plain-text robots.txt so we can declare Content Signals
// (https://contentsignals.org/), which MetadataRoute.Robots can't express.
export const dynamic = 'force-static'

// Named AI crawlers get their own groups. A crawler that matches a named group
// ignores the * group, so every group repeats the same rules.
const AGENTS = ['*', 'GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot']

export function GET(): Response {
  const lines: string[] = []
  for (const agent of AGENTS) {
    lines.push(
      `User-Agent: ${agent}`,
      'Content-Signal: search=yes, ai-input=yes, ai-train=no',
      'Allow: /',
      ...ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`),
      '',
    )
  }
  // Always www.evolvedpros.com — never platform, never the Railway host.
  lines.push(`Sitemap: ${robotsSitemapUrl(CANONICAL_ORIGIN)}`, '')
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
