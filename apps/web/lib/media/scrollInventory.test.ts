import { describe, expect, it } from 'vitest'
import {
  MID_RECT_EVERY_LATEST,
  SECTION_LATEST_LIST,
  articleMidRectBreaks,
  countArticleScrollRects,
  countHomeScrollRects,
  countSectionScrollRects,
  homeMidRectBands,
  latestMidRectIndexes,
  sectionHasFeaturedRect,
} from './scrollInventory'

describe('Phase 3a 300x250 scroll inventory', () => {
  it('places more home mid-rects as featured, sections, and podcast appear', () => {
    expect(homeMidRectBands({
      featuredCount: 0,
      sectionCount: 0,
      episodeCount: 0,
    })).toEqual([])
    expect(homeMidRectBands({
      featuredCount: 2,
      sectionCount: 2,
      episodeCount: 3,
    })).toEqual(['after-featured', 'after-sections', 'after-podcast'])
  })

  it('inserts a Latest 300x250 every four rows and skips a trailing stack', () => {
    expect(MID_RECT_EVERY_LATEST).toBe(4)
    expect(latestMidRectIndexes(3)).toEqual([])
    expect(latestMidRectIndexes(8)).toEqual([3, 7])
    expect(latestMidRectIndexes(8, { skipTrailing: true })).toEqual([3])
    expect(latestMidRectIndexes(16, { skipTrailing: true })).toEqual([3, 7, 11])
  })

  it('gives a long home, long Strategy, and long article at least two 300x250 scroll units', () => {
    expect(countHomeScrollRects({
      featuredCount: 2,
      latestCount: 8,
      sectionCount: 3,
      episodeCount: 5,
    })).toBeGreaterThanOrEqual(2)
    expect(sectionHasFeaturedRect(2)).toBe(true)
    expect(countSectionScrollRects({
      featuredCount: 2,
      latestCount: SECTION_LATEST_LIST,
    })).toBeGreaterThanOrEqual(2)
    expect(articleMidRectBreaks(3)).toEqual([])
    expect(articleMidRectBreaks(9)).toEqual([4])
    expect(articleMidRectBreaks(16)).toEqual([4, 9, 14])
    expect(countArticleScrollRects(16)).toBeGreaterThanOrEqual(2)
    expect(countArticleScrollRects(9)).toBeGreaterThanOrEqual(2)
  })
})
