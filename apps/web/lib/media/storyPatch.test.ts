import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  MEDIA_STORY_DENIED_FIELDS,
  MEDIA_STORY_WRITABLE_FIELDS,
  mediaStoryUpdateFromBody,
} from './storyPatch'

const here = dirname(fileURLToPath(import.meta.url))
const NOW = '2026-10-20T09:00:00.000Z'

const editorPayload = {
  title: 'Agentic Buying',
  slug: 'agentic-buying',
  excerpt: 'The deck says agentic.',
  body: 'The deck says agentic.\n',
  pillar: 'strategy',
  story_type: 'original',
  source_url: null,
  source_name: null,
  featured_image_url: '  https://example.supabase.co/storage/v1/object/public/branding/hero.png  ',
  author: 'George Leith',
  seo_title: 'Agentic Buying',
  seo_description: 'The deck says agentic.',
  tags: ['leadership'],
  is_featured: false,
  is_published: true,
}

describe('mediaStoryUpdateFromBody', () => {
  it('keeps the editor fields and drops server-owned columns', () => {
    const update = mediaStoryUpdateFromBody(
      {
        ...editorPayload,
        id: '11111111-1111-4111-8111-111111111111',
        created_at: '2000-01-01T00:00:00.000Z',
        updated_at: '2000-01-01T00:00:00.000Z',
        published_at: '2000-01-01T00:00:00.000Z',
        views: 999999,
        status: 'published',
        ai_draft: 'hidden draft',
        ai_research_brief: 'hidden brief',
        seo_meta_description: 'smuggled',
        unsplash_photo_id: 'abc',
        section: 'front',
        category_type: 'news',
        role: 'admin',
      },
      NOW,
    )

    expect(update).toEqual({
      ...editorPayload,
      featured_image_url: 'https://example.supabase.co/storage/v1/object/public/branding/hero.png',
      published_at: NOW,
    })
    for (const key of MEDIA_STORY_DENIED_FIELDS) {
      if (key === 'published_at') continue
      expect(update).not.toHaveProperty(key)
    }
    expect(update).not.toHaveProperty('role')
    expect(update.views).toBeUndefined()
    expect(update.status).toBeUndefined()
    expect(update.published_at).toBe(NOW)
  })

  it('stamps published_at only when the allowlisted patch publishes', () => {
    const draft = mediaStoryUpdateFromBody(
      {
        title: 'Still a draft',
        is_published: false,
        published_at: '2000-01-01T00:00:00.000Z',
        views: 10,
      },
      NOW,
    )
    expect(draft).toEqual({ title: 'Still a draft', is_published: false })

    const publish = mediaStoryUpdateFromBody({ is_published: true, published_at: '1999-01-01' }, NOW)
    expect(publish).toEqual({ is_published: true, published_at: NOW })
  })

  it('returns an empty patch when the body has no writable field', () => {
    expect(mediaStoryUpdateFromBody({ views: 1, status: 'published', id: 'x' }, NOW)).toEqual({})
    expect(mediaStoryUpdateFromBody({}, NOW)).toEqual({})
  })

  it('stores a blank featured image as null and leaves a null image alone', () => {
    expect(mediaStoryUpdateFromBody({ featured_image_url: '   ' }, NOW).featured_image_url).toBeNull()
    expect(mediaStoryUpdateFromBody({ featured_image_url: null }, NOW).featured_image_url).toBeNull()
  })

  it('lists every denied column outside the writable set', () => {
    const writable = new Set<string>(MEDIA_STORY_WRITABLE_FIELDS)
    for (const key of MEDIA_STORY_DENIED_FIELDS) {
      expect(writable.has(key)).toBe(false)
    }
  })
})

describe('admin media PATCH wiring', () => {
  it('writes the allowlisted patch through the service-role client', () => {
    const route = readFileSync(
      resolve(here, '../../app/api/admin/media/[id]/route.ts'),
      'utf8',
    )
    expect(route).toContain('mediaStoryUpdateFromBody')
    expect(route).toContain('.update(update)')
    expect(route).not.toContain('.update(body)')
    expect(route).toContain('adminClient')
    expect(route).toContain("from('media_stories')")
  })
})
