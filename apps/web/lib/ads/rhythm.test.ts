import { describe, expect, it } from 'vitest'
import {
  ACADEMY_COURSE_EVERY,
  ARTICLE_AD_AFTER,
  COMMUNITY_AD_EVERY,
  FEED_AD_EVERY,
  PODCAST_AD_EVERY,
  hasAdjacentAds,
  interleaveAds,
  layoutArticleBody,
  splitHtmlBlocks,
} from './rhythm'

describe('interleaveAds', () => {
  it('inserts one ad between content groups and never adjacent ads', () => {
    const chunks = interleaveAds(['a', 'b', 'c', 'd', 'e', 'f'], ['ad1', 'ad2'], 3)
    expect(chunks.map(c => c.kind)).toEqual(['content', 'ad', 'content'])
    expect(hasAdjacentAds(chunks)).toBe(false)
    expect(chunks[0]).toEqual({ kind: 'content', items: ['a', 'b', 'c'] })
    expect(chunks[1]).toEqual({ kind: 'ad', ad: 'ad1' })
    expect(chunks[2]).toEqual({ kind: 'content', items: ['d', 'e', 'f'] })
  })

  it('does not dump leftover ads after the last story group', () => {
    const chunks = interleaveAds(['a', 'b', 'c'], ['ad1', 'ad2', 'ad3'], 3)
    expect(chunks).toEqual([{ kind: 'content', items: ['a', 'b', 'c'] }])
  })

  it('allows a single trailing unit when asked — still not a pair', () => {
    const chunks = interleaveAds(['a', 'b', 'c'], ['ad1', 'ad2'], 3, { trailing: true })
    expect(chunks.map(c => c.kind)).toEqual(['content', 'ad'])
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('returns content only when there are no ads', () => {
    const chunks = interleaveAds(['a', 'b'], [], 3)
    expect(chunks).toEqual([{ kind: 'content', items: ['a', 'b'] }])
  })

  it('magazine default is one unit after each 3-up row', () => {
    expect(FEED_AD_EVERY).toBe(3)
    const items = Array.from({ length: 9 }, (_, i) => `s${i}`)
    const chunks = interleaveAds(items, ['ad1', 'ad2', 'ad3'])
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(2)
    expect(chunks[0]?.kind === 'content' && chunks[0].items).toHaveLength(3)
    expect(hasAdjacentAds(chunks)).toBe(false)
  })
})

describe('page locks', () => {
  it('podcast is exactly 4 / ad / 4 / ad', () => {
    expect(PODCAST_AD_EVERY).toBe(4)
    const episodes = Array.from({ length: 8 }, (_, i) => `ep${i}`)
    const chunks = interleaveAds(episodes, ['box1', 'box2'], PODCAST_AD_EVERY, { trailing: true })
    expect(chunks.map(c => c.kind)).toEqual(['content', 'ad', 'content', 'ad'])
    expect(chunks[0]?.kind === 'content' && chunks[0].items).toHaveLength(4)
    expect(chunks[2]?.kind === 'content' && chunks[2].items).toHaveLength(4)
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('community punctuates every three posts', () => {
    expect(COMMUNITY_AD_EVERY).toBe(3)
    const posts = Array.from({ length: 9 }, (_, i) => `p${i}`)
    const chunks = interleaveAds(posts, ['sq', 'bn', 'sq2'], COMMUNITY_AD_EVERY, { trailing: true })
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(3)
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('academy places a unit after two pillar cards', () => {
    expect(ACADEMY_COURSE_EVERY).toBe(2)
    const courses = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    const chunks = interleaveAds(courses, ['ad1', 'ad2', 'ad3'], ACADEMY_COURSE_EVERY, { trailing: true })
    expect(chunks.filter(c => c.kind === 'ad')).toHaveLength(3)
    expect(chunks[0]?.kind === 'content' && chunks[0].items).toHaveLength(2)
    expect(hasAdjacentAds(chunks)).toBe(false)
  })
})

describe('layoutArticleBody', () => {
  it('inserts after a few paragraphs, not as a stack', () => {
    const blocks = ['<p>1</p>', '<p>2</p>', '<p>3</p>', '<p>4</p>', '<p>5</p>']
    const chunks = layoutArticleBody(blocks, ['ad1', 'ad2'], [3, 8])
    expect(chunks.map(c => c.kind)).toEqual(['html', 'html', 'html', 'ad', 'html', 'html'])
    expect(hasAdjacentAds(chunks)).toBe(false)
  })

  it('adds later units on a long story', () => {
    const blocks = Array.from({ length: 14 }, (_, i) => `<p>${i + 1}</p>`)
    const chunks = layoutArticleBody(blocks, ['ad1', 'ad2', 'ad3', 'ad4'])
    const ads = chunks.filter(c => c.kind === 'ad')
    expect(ads.length).toBeGreaterThanOrEqual(3)
    expect(hasAdjacentAds(chunks)).toBe(false)
    expect(chunks[chunks.length - 1]?.kind).toBe('html')
    expect(ARTICLE_AD_AFTER).toEqual([3, 6, 9, 12, 16])
  })

  it('skips in-body ads on a short piece so the story stays the page', () => {
    const chunks = layoutArticleBody(['<p>1</p>', '<p>2</p>'], ['ad1'], [3, 8])
    expect(chunks.every(c => c.kind === 'html')).toBe(true)
  })
})

describe('splitHtmlBlocks', () => {
  it('splits on paragraph and heading closes', () => {
    const blocks = splitHtmlBlocks('<p>One</p><h2>Head</h2><p>Two</p>')
    expect(blocks).toEqual(['<p>One</p>', '<h2>Head</h2>', '<p>Two</p>'])
  })
})
