import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  POST_DENIED_COLUMNS,
  acceptedPostType,
  communityPostInsert,
} from './postInsert'

const here = dirname(fileURLToPath(import.meta.url))

const MEMBER = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'

describe('communityPostInsert', () => {
  it('ignores announce and every privileged column from a member body', () => {
    const raw = {
      postType: 'announce',
      is_pinned: true,
      like_count: 9999,
      reply_count: 9999,
      reaction_count: 9999,
      author_id: OTHER,
      created_at: '1999-01-01T00:00:00.000Z',
      updated_at: '1999-01-01T00:00:00.000Z',
      ai_generated: true,
      status: 'published',
      scheduled_at: '1999-01-01T00:00:00.000Z',
      id: OTHER,
      role: 'admin',
      tier: 'pro',
      points: 100000,
    }

    const row = communityPostInsert(raw, {
      authorId: MEMBER,
      channelId: 'channel-1',
      body: 'A normal update from a member account.',
      pillarTag: null,
      kind: 'update',
      pillar: null,
      pollId: null,
      isAdmin: false,
    })

    expect(acceptedPostType('announce', false)).toBeNull()
    expect(row.post_type).toBe('update')
    expect(row.author_id).toBe(MEMBER)
    expect(row).not.toHaveProperty('poll_id')
    for (const key of POST_DENIED_COLUMNS) {
      if (key === 'author_id') continue
      expect(row).not.toHaveProperty(key)
    }
    expect(row).not.toHaveProperty('role')
    expect(row).not.toHaveProperty('tier')
    expect(row).not.toHaveProperty('points')
    expect(JSON.stringify(row)).not.toContain('9999')
    expect(JSON.stringify(row)).not.toContain(OTHER)
  })

  it('lets an admin set post_type announce and still drops pin and counts', () => {
    const row = communityPostInsert(
      { postType: 'announce', is_pinned: true, like_count: 50, author_id: OTHER },
      {
        authorId: MEMBER,
        channelId: 'channel-1',
        body: 'Office hours moved to Thursday.',
        pillarTag: null,
        kind: 'update',
        pillar: null,
        pollId: null,
        isAdmin: true,
      },
    )

    expect(row.post_type).toBe('announce')
    expect(row.kind).toBe('update')
    expect(row.author_id).toBe(MEMBER)
    expect(row).not.toHaveProperty('is_pinned')
    expect(row).not.toHaveProperty('like_count')
  })

  it('keeps a member win and attaches only the poll id the route resolved', () => {
    const row = communityPostInsert(
      { postType: 'win', poll_id: OTHER, pollId: OTHER },
      {
        authorId: MEMBER,
        channelId: 'channel-1',
        body: 'Closed the quarter.',
        pillarTag: 'p4',
        kind: 'win',
        pillar: 4,
        pollId: 'poll-from-this-request',
        isAdmin: false,
      },
    )

    expect(row.post_type).toBe('win')
    expect(row.kind).toBe('win')
    expect(row.pillar_tag).toBe('p4')
    expect(row.pillar).toBe(4)
    expect(row.poll_id).toBe('poll-from-this-request')
  })
})

describe('POST /api/posts wiring', () => {
  it('inserts the allowlisted row through the service-role client', () => {
    const route = readFileSync(resolve(here, '../../app/api/posts/route.ts'), 'utf8')
    expect(route).toContain('communityPostInsert')
    expect(route).toContain('acceptedPostType')
    expect(route).toContain(".insert(row as never)")
    expect(route).not.toContain('...body')
    expect(route).not.toContain('.insert(body')
  })
})
