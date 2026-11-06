/**
 * Public meta description length.
 *
 * Google truncates snippets past ~155 characters and may replace a short
 * boilerplate description with its own. These helpers keep description,
 * og:description, and twitter:description in a 70–155 character range
 * using text the page already has. They do not rewrite stored articles.
 *
 * A word-boundary cut can stop mid-sentence. A description that already
 * finishes a sentence may run to 160 characters. An unfinished dek is
 * extended to the next stored sentence when that sentence still ends
 * inside 150–160 characters. When a word cut, or a dek stored already
 * cut off, still cannot finish in that window, the path uses a
 * hand-written sentence taken from the existing copy. No em dash, no
 * en dash, and no new claim. publicPageMetadata writes that same string
 * to description, og:description, and twitter:description.
 */

export const META_DESCRIPTION_MIN = 70
export const META_DESCRIPTION_MAX = 155

/**
 * A sentence that already ends may publish through 160 characters.
 * Word-boundary cuts stay at 155. 150 is the floor for a sentence
 * chosen to replace a dek that was stored mid-phrase.
 */
export const META_DESCRIPTION_SENTENCE_MAX = 160
export const META_DESCRIPTION_SENTENCE_MIN = 150

/**
 * Document, Open Graph, and Twitter description for /pricing.
 * WebPage JSON-LD stays on PRICING_PAGE_DESCRIPTION in jsonld.ts.
 * Tier name is Keynotes, matching the pricing card.
 */
export const PRICING_META_DESCRIPTION =
  'Compare Evolved Pros plans: Community, VIP, The Evolved Pros 99 and Keynotes. See what each tier includes for sales pros and pick the one that fits you.'

/**
 * Search snippet for /media/execution/better-outbound-digital-solutions.
 *
 * The stored seo_description joins "what earns its keep" to "and what
 * doesn't" with an em dash. The description sanitizer used to publish
 * that as a period before a lowercase word. This sentence replaces
 * description, og:description, and twitter:description. It stays inside
 * the article: a layer-by-layer read of signals, data, sequencing, and
 * automation, and the verdict on what earns its keep. It does not claim
 * tech-stack-change or executive-move tracking. Those phrases are not
 * in the body. Title, canonical, excerpt, JSON-LD, and body stay put.
 */
export const OUTBOUND_STACK_META_DESCRIPTION =
  'A layer-by-layer guide to the outbound sales tech stack: signals, data, sequencing, and automation. What earns its keep, and what is expensive theatre.'

const ARTICLE_SEARCH_SNIPPETS: Readonly<Record<string, string>> = {
  '/media/execution/better-outbound-digital-solutions': OUTBOUND_STACK_META_DESCRIPTION,
}

const TRAILING_JOINER = /[\s,;:|/\\–—-]+$/u

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Cut an over-long description on a word boundary. A description that
 * already fits is returned unchanged, including its internal whitespace.
 */
export function trimMetaDescription(
  text: string,
  max: number = META_DESCRIPTION_MAX,
): string {
  const edge = text.trim()
  if (!edge) return ''
  const collapsed = collapse(edge)
  const source = edge.length <= max ? edge : collapsed
  if (source.length <= max) return source

  let cut = max
  if (source[max] !== ' ') {
    const lastSpace = source.lastIndexOf(' ', max)
    if (lastSpace > 0) cut = lastSpace
  }
  const wordCut = source.slice(0, cut).trim()
  const withoutJoiner = wordCut.replace(TRAILING_JOINER, '').trim()
  const trimmed = withoutJoiner.length < META_DESCRIPTION_MIN && collapsed.length >= META_DESCRIPTION_MIN
    ? wordCut
    : withoutJoiner
  return trimmed.length > max ? trimmed.slice(0, max).trim() : trimmed
}

const SENTENCE_END = /[.!?]["']?$/u

/** True when collapsed text already finishes on ., !, or ? (optional closing quote). */
export function endsMetaSentence(text: string): boolean {
  return SENTENCE_END.test(collapse(text))
}

const ABBREVIATION_BEFORE_PERIOD = /(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|St|vs)|[A-Z])\.$/

/**
 * Longest prefix that ends on a real sentence and whose length is
 * inside [min, max]. "U.S." and "Inc." are not sentence ends. Undefined
 * when no sentence boundary falls in the window.
 */
export function sentenceBoundedMetaDescription(
  text: string,
  min: number = META_DESCRIPTION_SENTENCE_MIN,
  max: number = META_DESCRIPTION_SENTENCE_MAX,
): string | undefined {
  const collapsed = collapse(text)
  if (!collapsed) return undefined
  let best: number | undefined
  for (let i = 0; i < collapsed.length; i++) {
    const ch = collapsed[i]
    if (ch !== '.' && ch !== '!' && ch !== '?') continue
    if (ch === '.' && i > 0 && /\d/u.test(collapsed[i - 1]) && /\d/u.test(collapsed[i + 1] ?? '')) {
      continue
    }
    let end = i + 1
    const closer = collapsed[end]
    if (
      (closer === '"' || closer === "'") &&
      (collapsed[end + 1] === undefined || /\s/u.test(collapsed[end + 1]))
    ) {
      end += 1
    }
    const next = collapsed[end]
    if (next !== undefined && !/\s/u.test(next)) continue
    if (ch === '.' && ABBREVIATION_BEFORE_PERIOD.test(collapsed.slice(0, i + 1))) continue
    if (end > max) break
    if (end >= min) best = end
  }
  if (best === undefined) return undefined
  const sentence = collapsed.slice(0, best).trim()
  return endsMetaSentence(sentence) ? sentence : undefined
}

/** True when a word-boundary trim would publish text that does not finish a sentence. */
export function metaDescriptionNeedsMidSentenceCut(text: string): boolean {
  const collapsed = collapse(text)
  if (!collapsed || collapsed.length <= META_DESCRIPTION_MAX) return false
  return !SENTENCE_END.test(trimMetaDescription(collapsed))
}

function descriptionPath(pathname: string): string {
  if (!pathname) return '/'
  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`
  const stripped = withLeading.split(/[?#]/)[0].replace(/\/+$/, '')
  return stripped === '' ? '/' : stripped
}

/**
 * Hand-written replacements for descriptions trimMetaDescription would cut
 * mid-sentence, and for deks that were stored already cut off. The older
 * sitemap rows are 120–155 characters. The stored-cut media rows are
 * 150–160. Each one ends on a sentence and uses only claims already on
 * the page.
 */
export const META_DESCRIPTION_OVERRIDES: Readonly<Record<string, string>> = {
  '/podcast/evolved-pros-podcast-ep-010-juan-fernandez':
    'Channel veteran Juan Fernandez on taking MSPs from managed to modern: outcome-based buying, the hot pan risks of ungoverned AI, and betting on humans.',
  '/podcast/trust-credibility-cold-calling-jim-thompson':
    'Journalist-turned-storyteller Jim Thompson on selling as service, telling stories with numbers, and why trust built through story unlocks word of mouth.',
  '/podcast/reinvention-partnerships-long-game-martin-scholz':
    'Berlin advisor Martin Scholz on partnerships as the evolution of go-to-market: why 80% fail, and what actually makes them work.',
  '/podcast/fitness-nutrition-evolved-pros-carson-teagarden':
    "Calisthenics coach Carson Teagarden on fitness that lasts: consistency over intensity, two or three goals not fifty, and why it's growth not pain.",
  '/podcast/dennis-yu-authority-content':
    "Dennis Yu joins George Leith for the Evolved Pros debut: evolving with AI, taking 'the network view,' hiring by proof, and agents as multipliers.",
  '/podcast/leading-digital-evolution-salem-media-jamie-cohen':
    'Salem Media CDO Jamie Cohen on leading digital transformation: anchoring change in purpose, failing fast, and why the pace only accelerates.',
  '/media/strategy/what-happened-to-claudes-fable-5':
    'Anthropic shipped a frontier AI model, then deliberately put walls around it. The restraint is the story, and a lesson for anyone betting their craft.',
  '/media/mental-toughness/the-power-of-resilience-building-mental-toughness-in-sales':
    'What they will not tell you is the entry fee: you have to stay in the hard situation long enough for the lesson to land.',
  '/media/execution/execution-excellence-turning-plans-results':
    'The sales industry is obsessed with talent. The natural closer. The most consistent performers are almost never the most talented people in the room.',
  '/media/strategy/what-ai-agents-actually-automate':
    "Google's Business Home beta and an overnight backlink bot show what AI agents really take off your plate. Deciding what's worth doing is still on you.",
  '/media/foundation/cooking-with-tallow-three-recipes':
    "Beef tallow is stable and full of flavour. Here's what it is, an honest word on the saturated-fat question, and three recipes that earn their place.",
  '/media/strategy/agentic-buying-proof-gap':
    'IAB Europe n=50 across 44 markets: 58% expect agentic buying at operational use or scale within a year. Day-to-day proof is quieter.',
  '/media/strategy/ai-platforms-need-creators':
    'Social poured money into TV while claiming to replace it. Digiday put the parallel in print on September 16, 2026. AI platforms are chasing creators hard.',
  '/media/strategy/mid-sized-podcast-cpa':
    "Audacy's Fall 2026 State of Audio cites Podscribe: mid-sized podcasts delivered 22% lower CPA than celebrity-scale shows.",
  '/media/identity/the-industry-teaches-you-to-stand-out-nobody-teaches-you-to-stand-for-something':
    'After 30 years in sales leadership, 165+ events across 21 countries and $100M+ in recurring revenue built, here is what I know about professional identity.',
  // Stored deks already cut mid-phrase under 155 characters. The last full
  // sentence in that dek ends before 150, so the sentence window cannot
  // finish them. Each value is stored copy from that article, 150–160
  // characters, ending on a sentence.
  '/media/strategy/ai-readable-pages-author-date':
    'A local business does not need an API. On the five pages that sell, put the main text in the page, name the author or owner, and show a last-updated date.',
  '/media/strategy/lush-owned-audience-no-paid-social':
    'Kimeko McCoy reported in Digiday on Oct 28 that Lush stepped away from Instagram, Facebook, TikTok and Snapchat in 2021, and stopped posting to X by 2023.',
  '/media/strategy/october-24-ranking-drop-rank-tracker-bad-data':
    'Search Engine Roundtable reported "significant ranking volatility" on Saturday, Oct 24, 2026 across many third-party tracking tools, plus heavy SEO chatter.',
  '/media/strategy/pay-for-ai-output-not-usage':
    'Not yet in retail. Anna Hensel reported in Modern Retail on Oct 27 that tying AI to pay is "still a mostly unheard-of practice" in the retail industry.',
  '/media/execution/pitch-vs-delivery-say-no':
    'For a smaller agency, the same trade is measured in hours. Before you say yes to the next RFP, write down whose hours it takes and which client loses them.',
  '/media/strategy/prove-last-slice-google-search-spend':
    'The incremental 10% to 20% is becoming less automatic. Advertisers increasingly want Google to prove that spend is still the best use of those dollars.',
  '/media/strategy/whose-goal-platform-ai-agent':
    'Alex Brownstein, founder of AHB Advisors, told Digiday transparency on an agent buy "comes in five layers", data, decisions, pricing, delivery and results.',
  '/media/strategy/strategic-planning-q2-sales-targets':
    'Early in my leadership career, I learned something that took longer to admit than it should have: building strategy in a vacuum is not just inefficient.',
}

/** Sentence written for this sitemap path, when the stored description would be cut mid-sentence. */
export function metaDescriptionOverride(pathname: string): string | undefined {
  return META_DESCRIPTION_OVERRIDES[descriptionPath(pathname)]
}

/** Hand-written search snippet for one article path. Wins over the stored dek. */
export function articleSearchSnippet(pathname: string): string | undefined {
  return ARTICLE_SEARCH_SNIPPETS[descriptionPath(pathname)]
}

/**
 * An em dash before a lowercase word is a clause join ("keep — and"),
 * not a sentence break. stripEmDashCopy would publish "keep. and".
 * Dashes before a capital still fall through to that period replacement.
 */
export function joinEmDashClause(copy: string): string {
  return copy.replace(/\s*[\u2014\u2013]\s*(?=[a-z])/gu, ', ')
}

/**
 * Publish a description that may be one sentence longer than the
 * word-cut cap. A finished sentence of 156–160 characters is kept.
 * A newline inside an in-range description is collapsed so the meta
 * attribute stays on one line.
 */
export function boundPublishedDescription(text: string): string {
  const collapsed = collapse(text)
  if (
    endsMetaSentence(collapsed) &&
    collapsed.length > META_DESCRIPTION_MAX &&
    collapsed.length <= META_DESCRIPTION_SENTENCE_MAX
  ) {
    return collapsed
  }
  if (/[\n\r]/u.test(text)) return trimMetaDescription(collapsed)
  return trimMetaDescription(text)
}

/**
 * Keep a description that is already in range. Extend a short one with
 * later source text. A supplement is added whole when it still fits in
 * 155 characters. The first supplement that would pass 155 is trimmed on
 * a word boundary only when the description is still under 70; otherwise
 * it is left off. An over-long primary is trimmed on its own.
 *
 * A primary that is already in range but does not end a sentence is
 * extended when a supplement starts with that primary and a full
 * sentence still ends inside 150–160 characters.
 */
export function fitMetaDescription(
  primary: string,
  supplements: readonly string[] = [],
): string {
  const lead = collapse(primary)
  if (lead.length > META_DESCRIPTION_MAX) return trimMetaDescription(lead)
  if (lead.length >= META_DESCRIPTION_MIN && !endsMetaSentence(lead)) {
    for (const extra of supplements) {
      const addition = collapse(extra)
      if (!addition.startsWith(lead) || addition.length <= lead.length) continue
      const bounded = sentenceBoundedMetaDescription(addition)
      if (bounded?.startsWith(lead)) return bounded
    }
  }
  if (lead.length >= META_DESCRIPTION_MIN) {
    const edge = primary.trim()
    if (/[\n\r]/u.test(edge)) return lead
    return edge.length <= META_DESCRIPTION_MAX ? edge : trimMetaDescription(lead)
  }

  let text = lead
  for (const extra of supplements) {
    const addition = collapse(extra)
    if (!addition || (text && text.includes(addition))) continue
    const next = !text ? addition : addition.includes(text) ? addition : `${text} ${addition}`
    if (next.length <= META_DESCRIPTION_MAX) {
      text = next
      continue
    }
    if (text.length >= META_DESCRIPTION_MIN) break
    return trimMetaDescription(next)
  }
  return text
}

/** Plain paragraphs from a markdown or HTML article body. Order preserved. */
export function plainTextBlocks(source: string | null | undefined): string[] {
  if (!source) return []
  return source
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(block =>
      block
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/^#{1,6}[ \t]*/gm, '')
        .replace(/[*_]{1,3}([^*_\n]+)[*_]{1,3}/g, '$1')
        .replace(/`+/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(block => block.length > 0)
}
