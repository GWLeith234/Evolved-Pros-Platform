import { describe, expect, it, vi } from 'vitest'
import {
  INDEXNOW_ENDPOINT,
  buildIndexNowPayload,
  indexNowKeyFileBody,
  mediaStoryPublicUrl,
  pingIndexNow,
  podcastEpisodePublicUrl,
  readIndexNowKey,
} from './indexnow'
import { getBingVerification } from '@/lib/analytics/public-ids'

const KEY = 'abcdef0123456789'
const env = { INDEXNOW_KEY: KEY }
const quiet = { info: vi.fn(), warn: vi.fn() }

describe('IndexNow key', () => {
  it('is null when unset or malformed', () => {
    expect(readIndexNowKey({})).toBeNull()
    expect(readIndexNowKey({ INDEXNOW_KEY: 'short' })).toBeNull()
    expect(readIndexNowKey({ INDEXNOW_KEY: 'bad key!/..' })).toBeNull()
    expect(readIndexNowKey(env)).toBe(KEY)
  })

  it('key file returns the key only for an exact match', () => {
    expect(indexNowKeyFileBody(KEY, env)).toBe(KEY)
    expect(indexNowKeyFileBody(`${KEY}.txt`, env)).toBe(KEY)
    expect(indexNowKeyFileBody('someotherkey123', env)).toBeNull()
    expect(indexNowKeyFileBody(KEY, {})).toBeNull()
  })
})

describe('IndexNow payload', () => {
  it('uses www host, keyLocation, and drops off-host / duplicate URLs', () => {
    const story = mediaStoryPublicUrl({ pillar: 'leadership', slug: 'a-b' })
    const p = buildIndexNowPayload(KEY, [story, story, 'https://evil.example/x', 'not a url'])
    expect(p).toEqual({
      host: 'www.evolvedpros.com',
      key: KEY,
      keyLocation: `https://www.evolvedpros.com/${KEY}.txt`,
      urlList: ['https://www.evolvedpros.com/media/leadership/a-b'],
    })
    expect(podcastEpisodePublicUrl('ep-1')).toBe('https://www.evolvedpros.com/podcast/ep-1')
  })
})

describe('pingIndexNow', () => {
  it('skips without a key', async () => {
    const fetchImpl = vi.fn()
    expect(await pingIndexNow(['https://www.evolvedpros.com/x'], { env: {}, fetchImpl, log: quiet })).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts JSON to the IndexNow endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    const status = await pingIndexNow(['https://www.evolvedpros.com/x'], { env, fetchImpl, log: quiet })
    expect(status).toBe(202)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(INDEXNOW_ENDPOINT)
    expect(JSON.parse(init.body).urlList).toEqual(['https://www.evolvedpros.com/x'])
  })

  it('never throws on network failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('boom'))
    await expect(pingIndexNow(['https://www.evolvedpros.com/x'], { env, fetchImpl, log: quiet })).resolves.toBeNull()
    expect(quiet.warn).toHaveBeenCalled()
  })
})

describe('getBingVerification', () => {
  it('omits unset or unsafe values', () => {
    expect(getBingVerification(undefined)).toBeUndefined()
    expect(getBingVerification('"><script>')).toBeUndefined()
    expect(getBingVerification('ABC123DEF')).toBe('ABC123DEF')
  })
})
