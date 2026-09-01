const { chromium } = require('playwright')
const path = require('path')

const JOBS = (process.env.ONLY ? JSON.parse(process.env.ONLY) : [
  { html: 'academy-300x250.html', out: 'academy-300x250.png', w: 300, h: 250 },
  { html: 'academy-728x90.html',  out: 'academy-728x90.png',  w: 728, h: 90 },
  { html: 'academy-portrait.html', out: 'academy-portrait.png', w: 600, h: 900 },
])

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  for (const j of JOBS) {
    const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto('file://' + path.join(__dirname, j.html), { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(__dirname, j.out), clip: { x: 0, y: 0, width: j.w, height: j.h } })
    await ctx.close()
    console.log('rendered', j.out)
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
