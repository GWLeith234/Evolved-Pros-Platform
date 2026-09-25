import { describe, expect, it } from 'vitest'
import { ImageResponse } from 'next/og'
import {
  SOCIAL_FONT_FILES,
  fontTableTags,
  isStaticOutlineFont,
  loadSocialFont,
} from './ogFonts'

describe('social OG fonts', () => {
  it('loads static Barlow Condensed and Playfair Display files', () => {
    for (const file of Object.values(SOCIAL_FONT_FILES)) {
      const data = loadSocialFont(file)
      const bytes = new Uint8Array(data)
      const tags = fontTableTags(bytes)
      expect(tags, file).not.toContain('fvar')
      expect(isStaticOutlineFont(bytes), file).toBe(true)
    }
  })

  it('rejects a variable font table list', () => {
    const tags = ['glyf', 'fvar']
    const bytes = new Uint8Array(12 + tags.length * 16)
    bytes[4] = 0
    bytes[5] = tags.length
    tags.forEach((tag, i) => {
      const offset = 12 + i * 16
      for (let c = 0; c < 4; c++) bytes[offset + c] = tag.charCodeAt(c)
    })
    expect(fontTableTags(bytes)).toEqual(['glyf', 'fvar'])
    expect(isStaticOutlineFont(bytes)).toBe(false)
  })

  it('satori renders the static social fonts', async () => {
    const semi = loadSocialFont(SOCIAL_FONT_FILES.barlowSemi)
    const bold = loadSocialFont(SOCIAL_FONT_FILES.barlowBold)
    const serif = loadSocialFont(SOCIAL_FONT_FILES.playfair)
    const image = new ImageResponse(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#112535',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 28, color: '#F5F0E8' }}>
          EP 01
        </div>
        <div style={{ display: 'flex', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 32, color: '#C79A3B' }}>
          EVOLVED
        </div>
        <div style={{ display: 'flex', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 28, color: '#F5F0E8' }}>
          Quote
        </div>
      </div>,
      {
        width: 320,
        height: 180,
        fonts: [
          { name: 'Barlow Condensed', data: semi, weight: 600, style: 'normal' },
          { name: 'Barlow Condensed', data: bold, weight: 700, style: 'normal' },
          { name: 'Playfair Display', data: serif, weight: 700, style: 'normal' },
        ],
      },
    )
    const png = new Uint8Array(await image.arrayBuffer())
    expect(png.byteLength).toBeGreaterThan(200)
    expect(png[0]).toBe(0x89)
    expect(png[1]).toBe(0x50)
    expect(png[2]).toBe(0x4e)
    expect(png[3]).toBe(0x47)
  }, 20_000)
})
