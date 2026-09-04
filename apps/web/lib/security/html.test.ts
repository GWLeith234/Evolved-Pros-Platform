import { describe, expect, it } from 'vitest'
import { escapeHtml, pinnedBodyToHtml, sanitizeMediaHtml } from './html'

describe('escapeHtml', () => {
  it('escapes markup and quotes', () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    )
  })
})

describe('pinnedBodyToHtml', () => {
  it('escapes HTML then allows bold only', () => {
    const html = pinnedBodyToHtml('Hello **team** <img src=x onerror=alert(1)>')
    expect(html).toBe('Hello <strong>team</strong> &lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })

  it('does not let markup inside the bold markers reopen tags', () => {
    const html = pinnedBodyToHtml('**<script>alert(1)</script>**')
    expect(html).toBe('<strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong>')
  })
})

describe('sanitizeMediaHtml', () => {
  it('keeps safe article markup', () => {
    const html = sanitizeMediaHtml(
      '<h2>Title</h2><p>Hi <strong>there</strong></p><ul><li>One</li></ul>',
    )
    expect(html).toContain('<h2>Title</h2>')
    expect(html).toContain('<strong>there</strong>')
    expect(html).toContain('<li>One</li>')
  })

  it('strips script tags and event handlers', () => {
    const html = sanitizeMediaHtml(
      '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)><p onclick="alert(1)">x</p>',
    )
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('onclick')
    expect(html).toContain('<p>ok</p>')
    expect(html).not.toContain('<img')
  })

  it('drops javascript and data URLs', () => {
    const html = sanitizeMediaHtml(
      '<a href="javascript:alert(1)">x</a><a href="https://evolvedpros.com">ok</a><img src="data:text/html,hi">',
    )
    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="https://evolvedpros.com"')
    expect(html).not.toContain('<img')
  })

  it('escapes text so stray markup cannot land', () => {
    expect(sanitizeMediaHtml('<p>a & b</p>')).toBe('<p>a &amp; b</p>')
    expect(sanitizeMediaHtml('<p>ok</p><bogus>x</bogus>')).toBe('<p>ok</p>x')
  })
})
