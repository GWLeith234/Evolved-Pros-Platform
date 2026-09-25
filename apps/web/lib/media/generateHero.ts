import 'server-only'

import { randomBytes } from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import {
  resolveXaiApiKey,
  requestXaiImages,
  safeErrorMessage,
} from '@/lib/art/xaiImages'
import {
  HERO_BUCKET,
  HERO_VARIANTS,
  cropHeroVariants,
  heroObjectPath,
  heroSlug,
  type HeroVariant,
} from './heroCrops'
import { buildHeroPrompt, type HeroBrief } from './heroPrompt'
import {
  HERO_KEY_MISSING_MESSAGE,
  brandingObjectPathFromPublicUrl,
} from './heroPublishGuard'

export interface DraftHeroStory extends HeroBrief {
  id: string
  slug: string
  title: string
}

export interface HeroOption {
  id: string
  url: string
  variants: Record<HeroVariant, string>
}

export function heroQueueStatus(): { status: 'queued' | 'skipped'; message: string } {
  if (!resolveXaiApiKey()) {
    return { status: 'skipped', message: HERO_KEY_MISSING_MESSAGE }
  }
  return {
    status: 'queued',
    message:
      'House hero art is generating in the background. It will show up as the proposed image on this story.',
  }
}

/** Fire-and-forget. Save already succeeded. Failures are logged without the key. */
export function queueDraftHero(story: DraftHeroStory): { status: 'queued' | 'skipped'; message: string } {
  const status = heroQueueStatus()
  if (status.status === 'queued') {
    void persistDraftHero(story).catch((err) => {
      console.error('[media-hero] draft generation failed:', safeErrorMessage(err))
    })
  }
  return status
}

async function uploadPng(path: string, bytes: Buffer): Promise<string> {
  const { error } = await adminClient.storage.from(HERO_BUCKET).upload(path, bytes, {
    contentType: 'image/png',
    upsert: true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = adminClient.storage.from(HERO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function storeVariantSet(
  slug: string,
  source: Buffer,
  optionId?: string,
): Promise<{ id: string; url: string; variants: Record<HeroVariant, string> }> {
  const id = optionId ?? 'canonical'
  const crops = await cropHeroVariants(source)
  const variants = {} as Record<HeroVariant, string>
  for (const variant of HERO_VARIANTS) {
    const path = heroObjectPath(slug, variant, optionId)
    variants[variant] = await uploadPng(path, crops[variant])
  }
  return { id, url: variants['hero-16x9'], variants }
}

async function rememberProposedImage(
  storyId: string,
  featuredUrl: string,
  replace: boolean,
): Promise<void> {
  const pending = adminClient
    .from('media_stories')
    .update({ featured_image_url: featuredUrl })
    .eq('id', storyId)
  const { error } = await (replace ? pending : pending.is('featured_image_url', null))
  if (error) throw new Error(`Could not store the proposed hero: ${error.message}`)
}

export async function persistDraftHero(
  story: DraftHeroStory,
  opts?: { replace?: boolean },
): Promise<{ featuredUrl: string }> {
  if (!resolveXaiApiKey()) {
    throw new Error(HERO_KEY_MISSING_MESSAGE)
  }
  const prompt = buildHeroPrompt(story)
  const [source] = await requestXaiImages({ prompt, n: 1, aspectRatio: '16:9', resolution: '2k' })
  if (!source) throw new Error('xAI returned no image data')
  const stored = await storeVariantSet(story.slug, source)
  await rememberProposedImage(story.id, stored.url, opts?.replace === true)
  return { featuredUrl: stored.url }
}

export async function generateHeroOptions(
  story: DraftHeroStory,
  count: 2 | 3,
): Promise<HeroOption[]> {
  if (!resolveXaiApiKey()) {
    throw new Error(HERO_KEY_MISSING_MESSAGE)
  }
  const prompt = buildHeroPrompt(story)
  const sources = await requestXaiImages({
    prompt,
    n: count,
    aspectRatio: '16:9',
    resolution: '2k',
  })
  const options: HeroOption[] = []
  for (const source of sources.slice(0, count)) {
    const optionId = randomBytes(4).toString('hex')
    const stored = await storeVariantSet(story.slug, source, optionId)
    options.push({ id: optionId, url: stored.url, variants: stored.variants })
  }
  if (options.length < 2) {
    throw new Error('xAI returned fewer than 2 hero options. Try again.')
  }
  return options
}

function optionIdFromPath(slug: string, objectPath: string): string | null {
  const prefix = `media-heroes/${heroSlug(slug)}/options/`
  if (!objectPath.startsWith(prefix) || !objectPath.endsWith('/hero-16x9.png')) return null
  const rest = objectPath.slice(prefix.length, -'/hero-16x9.png'.length)
  if (!/^[a-z0-9]+$/.test(rest)) return null
  return rest
}

export async function acceptHeroOption(
  story: { id: string; slug: string },
  acceptUrl: string,
): Promise<{ featured_image_url: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const objectPath = brandingObjectPathFromPublicUrl(acceptUrl, supabaseUrl)
  if (!objectPath) {
    throw new Error('That image is not on this project\'s Supabase storage.')
  }

  const canonical = heroObjectPath(story.slug, 'hero-16x9')
  let featuredUrl = acceptUrl.trim()

  if (objectPath !== canonical) {
    const optionId = optionIdFromPath(story.slug, objectPath)
    if (!optionId) {
      throw new Error('Choose one of the generated hero options for this story.')
    }
    for (const variant of HERO_VARIANTS) {
      const from = heroObjectPath(story.slug, variant, optionId)
      const to = heroObjectPath(story.slug, variant)
      const { data, error } = await adminClient.storage.from(HERO_BUCKET).download(from)
      if (error || !data) {
        throw new Error(`Could not read the ${variant} crop for that option.`)
      }
      const bytes = Buffer.from(await data.arrayBuffer())
      const url = await uploadPng(to, bytes)
      if (variant === 'hero-16x9') featuredUrl = url
    }
  }

  const { error } = await adminClient
    .from('media_stories')
    .update({ featured_image_url: featuredUrl })
    .eq('id', story.id)
  if (error) throw new Error(`Could not accept the hero: ${error.message}`)
  return { featured_image_url: featuredUrl }
}
