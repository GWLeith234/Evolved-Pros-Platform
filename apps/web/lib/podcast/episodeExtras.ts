/**
 * Guest dossier + related-episode view model (SPRINT PODCAST-1).
 *
 * The components in components/podcast/{GuestDossier,RelatedEpisodes}.tsx read
 * ONLY these types, never a PublicEpisode. PODCAST-2 can repoint the adapter at
 * a real guest table without touching a single line of render code.
 *
 * Every value here is derived from a column that exists today. Nothing is
 * invented, and nothing is labelled as something we cannot prove:
 *  - `facts.books` has no column at all and is always [].
 *  - `facts.recordedAt` is always null. We only store `published_at`, and what
 *    that means is unsettled (RSS drop vs platform release — see rssSync.ts,
 *    which pins it to platform release while the feed disagrees on 5 rows).
 *    A publish date must never be rendered under a "Recorded" label, so the
 *    field stays in the type, carries null, and its row is omitted.
 *  - `links` has no data source anywhere in the schema and is always []. The
 *    Follow block is built and tested against a fixture so PODCAST-2 only has
 *    to supply data; with <3 links it never renders, so today it never does.
 *  - `contact` is hardcoded internal. Per spec §5 email/phone come from guest
 *    intake only, never scraped, so the booking strip cannot render today.
 */
import { PILLARS } from '@/lib/pillars'
import { slugify } from '@/lib/podcast/rssSync'
import { relatedEpisodes, ytThumb, type PublicEpisode } from '@/lib/podcast/public'

// ── Types ───────────────────────────────────────────────────────────────────

export interface GuestLink {
  label: string
  href: string
}

export interface GuestFacts {
  company: string | null
  location: string | null
  /** No backing column. Always []. */
  books: string[]
  /** Always null — see the file header. The row is never rendered. */
  recordedAt: string | null
}

export interface GuestContact {
  email: string | null
  phone: string | null
  visibility: 'internal' | 'public'
}

export interface Guest {
  slug: string
  name: string
  /** "Title · Company", omitting nulls. '' when both are missing. */
  headline: string
  bio: string | null
  headshot: string | null
  facts: GuestFacts
  /** Pillar numbers, 1..6, primary first, deduped. */
  pillars: number[]
  links: GuestLink[]
  contact: GuestContact
}

export interface RelatedEpisode {
  slug: string
  title: string
  episodeNumber: number | null
  guestName: string | null
  guestHeadline: string
  /** Primary pillar slug, for the eyebrow label + color. */
  pillar: string | null
  thumbnail: string | null
  /** mm:ss. '' when duration_seconds is null — the chip is then omitted. */
  durationLabel: string
  /** Never ''. Explains what actually matched. */
  reason: string
}

export interface EpisodePageExtras {
  guest: Guest
  related: RelatedEpisode[]
}

// ── Render predicates ───────────────────────────────────────────────────────
// Exported so the components and the specs agree on one rule each.

/** Spec: under 3 links, the whole Follow block is hidden. */
export const MIN_LINKS_TO_SHOW = 3

export function showLinks(links: GuestLink[]): boolean {
  return links.length >= MIN_LINKS_TO_SHOW
}

/** The booking strip needs a publicly-shareable channel. Internal never shows. */
export function showBookingStrip(contact: GuestContact): boolean {
  return contact.visibility === 'public' && Boolean(contact.email || contact.phone)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PILLAR_NUMBER = new Map(PILLARS.map(p => [p.slug, p.n as number]))

/** "Title · Company", dropping nulls/blanks. '' when nothing is known. */
export function guestHeadline(
  title: string | null | undefined,
  company: string | null | undefined,
): string {
  return [title, company]
    .map(v => (v ?? '').trim())
    .filter(Boolean)
    .join(' · ')
}

/** Primary pillar first, then secondaries, deduped, unknown slugs dropped. */
export function pillarNumbers(ep: Pick<PublicEpisode, 'pillar' | 'pillars'>): number[] {
  const out: number[] = []
  for (const slug of [ep.pillar, ...ep.pillars]) {
    if (!slug) continue
    const n = PILLAR_NUMBER.get(slug)
    if (n !== undefined && !out.includes(n)) out.push(n)
  }
  return out
}

/** Every pillar slug an episode claims, primary + secondary. */
function pillarSlugs(ep: Pick<PublicEpisode, 'pillar' | 'pillars'>): string[] {
  const out: string[] = []
  for (const slug of [ep.pillar, ...ep.pillars]) {
    if (slug && !out.includes(slug)) out.push(slug)
  }
  return out
}

/** mm:ss. '' for null/negative, so the caller can omit the chip. */
export function durationLabel(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PILLAR_LABEL = new Map(PILLARS.map(p => [p.slug, p.name]))

/**
 * Why this card is here, from what actually fired. Tag beats pillar beats the
 * honest fallback. With tags empty on 6 of 10 episodes the fallback is common,
 * which is correct — we do not dress up "newest" as a themed match.
 */
export function relatedReason(ep: PublicEpisode, other: PublicEpisode): string {
  const sharedTag = other.tags.find(t => ep.tags.includes(t))
  if (sharedTag) return `Same theme — ${sharedTag}`

  const mine = pillarSlugs(ep)
  const sharedPillar = pillarSlugs(other).find(p => mine.includes(p))
  if (sharedPillar) return `Same pillar — ${PILLAR_LABEL.get(sharedPillar) ?? sharedPillar}`

  return 'More from the show'
}

// ── Adapter ─────────────────────────────────────────────────────────────────

const RELATED_LIMIT = 4

/**
 * Build the dossier + related rail for one episode.
 *
 * Returns null when the episode has no guest (Ep 0, the pilot) — that page
 * renders no dossier at all rather than an empty shell.
 */
export function buildEpisodeExtras(
  ep: PublicEpisode,
  all: PublicEpisode[],
): EpisodePageExtras | null {
  if (!ep.guest_name) return null
  return { guest: buildGuest(ep, ep.guest_name), related: buildRelatedEpisodes(ep, all) }
}

/** `name` is passed separately so the non-null narrowing survives the call. */
function buildGuest(ep: PublicEpisode, name: string): Guest {
  const guest: Guest = {
    slug: slugify(name),
    name,
    headline: guestHeadline(ep.guest_title, ep.guest_company),
    bio: ep.guest_bio,
    headshot: ep.guest_image_url,
    facts: {
      company: ep.guest_company,
      location: ep.location,
      books: [],
      recordedAt: null,
    },
    pillars: pillarNumbers(ep),
    links: [],
    contact: { email: null, phone: null, visibility: 'internal' },
  }
  return guest
}

/**
 * The related rail, independent of the guest.
 *
 * Exported separately because Ep 0 has no guest and so gets no dossier — but it
 * is still an episode and still deserves a rail. Bundling this inside
 * buildEpisodeExtras alone would have silently dropped it there.
 */
export function buildRelatedEpisodes(ep: PublicEpisode, all: PublicEpisode[]): RelatedEpisode[] {
  // Keep the existing shared-tag ranking exactly as-is — the 6-rule scoring in
  // the spec is PODCAST-3 (3 of its rules have no data source today). Rank the
  // full list, then drop repeat guests, then take 4, so deduping costs a card
  // rather than shrinking the rail.
  const seenGuests = new Set<string>()
  const related: RelatedEpisode[] = []
  for (const other of relatedEpisodes(ep, all, all.length)) {
    if (other.guest_name) {
      if (seenGuests.has(other.guest_name)) continue
      seenGuests.add(other.guest_name)
    }
    related.push({
      slug: other.slug,
      title: other.title,
      episodeNumber: other.episode_number,
      guestName: other.guest_name,
      guestHeadline: guestHeadline(other.guest_title, other.guest_company),
      pillar: other.pillar,
      // 'max' = maxresdefault, 1280x720 and truly 16:9. Never 'hq' —
      // hqdefault is 480x360 4:3 and letterboxes inside a 16:9 frame.
      thumbnail: ytThumb(other.youtube_id, 'max'),
      durationLabel: durationLabel(other.duration_seconds),
      reason: relatedReason(ep, other),
    })
    if (related.length === RELATED_LIMIT) break
  }
  return related
}
