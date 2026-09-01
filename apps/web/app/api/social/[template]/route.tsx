import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

// Podcast social-image generator (LinkedIn / X). Renders server-side via Satori
// so the real logo / faces / mic (Supabase Storage public URLs) can be fetched
// and composited — the thing that can't be done in a local design tool. Three
// templates × two sizes, from URL params + episode data. Human-in-the-loop:
// generate → George approves → posts manually. Nothing auto-posts.
//
// nodejs runtime (not edge): self-hosted Next (Railway) can't fetch bundled
// assets from the edge runtime, so fonts load from disk via fs instead.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Brand tokens (exact) ────────────────────────────────────────────────────
const NAVY = '#112535'
const DARK = '#09131D'
const RED = '#EF0E30'
const GOLD = '#C79A3B'
const GOLD_LIGHT = '#D6AF5C'
const IVORY = '#F5F0E8'
const MUTED = '#96A5B4'
const FACE = '#1E3448'

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const STORAGE = `${SUPABASE}/storage/v1/object/public/`
const FONT_SANS = 'Barlow Condensed'
const FONT_SERIF = 'Playfair Display'

const ASSET = {
  logo: `${STORAGE}Branding/logo_horizontal_dark.png`,
  mic: `${STORAGE}Branding/ep_podcast_icon_transparent.png`,
  host: `${STORAGE}Branding/george-speaking-hero.jpeg`,
}

type Size = 'square' | 'portrait'
type Template = 'text' | 'guest' | 'faceoff'

interface Episode {
  title: string | null
  episode_number: number | null
  pillar: string | null
  guest_name: string | null
  guest_title: string | null
  thumbnail_url: string | null
}

// ── helpers ─────────────────────────────────────────────────────────────────

function arrayBufferToDataUri(buf: ArrayBuffer, mime: string): string {
  return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
}

function mimeFor(url: string): string {
  const u = url.toLowerCase()
  if (u.endsWith('.png')) return 'image/png'
  if (u.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

/** Fetch an asset → data URI, or null on any failure (missing asset must never
 *  crash the render — we fall back to a solid panel / text). */
async function fetchImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const r = await fetch(url, { cache: 'force-cache' })
    if (!r.ok) return null
    return arrayBufferToDataUri(await r.arrayBuffer(), mimeFor(url))
  } catch {
    return null
  }
}

async function loadEpisode(slug: string | null): Promise<Episode | null> {
  if (!slug || !SUPABASE || !ANON) return null
  try {
    const url =
      `${SUPABASE}/rest/v1/episodes?slug=eq.${encodeURIComponent(slug)}` +
      `&is_published=eq.true&select=title,episode_number,pillar,guest_name,guest_title,thumbnail_url&limit=1`
    const r = await fetch(url, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
    if (!r.ok) return null
    const rows = (await r.json()) as Episode[]
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch {
    return null
  }
}

// Fonts live in public/social-fonts and are read from disk (nodejs runtime).
// process.cwd() is apps/web under `next start`; fall back to the monorepo path.
// Return a standalone ArrayBuffer (a Node Buffer's .buffer is a shared pool —
// passing it to satori makes it read the wrong bytes → "reading '256'").
function loadFont(file: string): ArrayBuffer {
  const candidates = [
    join(process.cwd(), 'public', 'social-fonts', file),
    join(process.cwd(), 'apps', 'web', 'public', 'social-fonts', file),
  ]
  for (const p of candidates) {
    try {
      const b = readFileSync(p)
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
    } catch {
      /* try next */
    }
  }
  throw new Error(`social font not found: ${file}`)
}

function epLabel(n: number | null | undefined): string {
  if (n == null) return 'EP'
  if (n <= 0) return 'PILOT'
  return `EP ${String(n).padStart(2, '0')}`
}

// ── shared UI (Satori-compatible: flexbox only, inline styles) ───────────────

function Star({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
      <path
        fill={GOLD_LIGHT}
        d="M12 2l2.9 6.26L21.8 9l-5 4.6 1.3 6.9L12 17.3 5.9 20.5l1.3-6.9-5-4.6 6.9-.74z"
      />
    </svg>
  )
}

function CredibilityBadge({ scale = 1 }: { scale?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        background: '#0C1A28',
        border: `2px solid ${GOLD}`,
        borderRadius: 14 * scale,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', width: 8 * scale, background: RED }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${16 * scale}px ${28 * scale}px`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 8 * scale }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Star key={i} size={26 * scale} />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: FONT_SANS,
            fontWeight: 700,
            fontSize: 26 * scale,
            letterSpacing: 2 * scale,
            color: IVORY,
          }}
        >
          600+ 5-STAR REVIEWS
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: FONT_SANS,
            fontWeight: 600,
            fontSize: 18 * scale,
            letterSpacing: 2 * scale,
            color: MUTED,
            marginTop: 4 * scale,
          }}
        >
          TOP 10 ENTREPRENEUR PODCAST · SPOTIFY
        </div>
      </div>
    </div>
  )
}

function TopRule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: 12, flexShrink: 0 }}>
      <div style={{ display: 'flex', width: '50%', background: RED }} />
      <div style={{ display: 'flex', width: '50%', background: GOLD }} />
    </div>
  )
}

function Footer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', width: '100%', height: 3, background: RED, marginBottom: 16 }} />
      <div
        style={{
          display: 'flex',
          fontFamily: FONT_SANS,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 4,
          color: GOLD,
        }}
      >
        EVOLVEDPROS.COM/PODCAST
      </div>
    </div>
  )
}

function Logo({ src, height = 56 }: { src: string | null; height?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={src} height={height} style={{ height, objectFit: 'contain' }} />
  }
  return (
    <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: height * 0.8, letterSpacing: 3, color: IVORY }}>
      EVOLVED PROS
    </div>
  )
}

function Kicker({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: FONT_SANS,
        fontWeight: 700,
        fontSize: 32,
        letterSpacing: 5,
        color: RED,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  )
}

function AttrRule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: 220, height: 6, marginBottom: 22 }}>
      <div style={{ display: 'flex', width: 70, background: RED }} />
      <div style={{ display: 'flex', flex: 1, background: GOLD }} />
    </div>
  )
}

function Attribution({ name, role }: { name: string; role: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AttrRule />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 42, letterSpacing: 1, color: GOLD }}>
        {name}
      </div>
      {role ? (
        <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 28, letterSpacing: 1, color: MUTED, marginTop: 2 }}>
          {role}
        </div>
      ) : null}
    </div>
  )
}

function PhotoPanel({ src, w, h, radius = 0 }: { src: string | null; w: number | string; h: number | string; radius?: number }) {
  return (
    <div style={{ display: 'flex', width: w, height: h, background: FACE, borderRadius: radius, overflow: 'hidden' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img src={src} width="100%" height="100%" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : null}
    </div>
  )
}

const PAGE = (bg: React.CSSProperties): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  background: `linear-gradient(180deg, ${NAVY} 0%, ${DARK} 100%)`,
  ...bg,
})

// ── templates ───────────────────────────────────────────────────────────────

function QuoteColumn({ kicker, quote, name, role, badge }: { kicker: string; quote: string; name: string; role: string; badge: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', height: '100%' }}>
      <Kicker text={kicker} />
      <div
        style={{
          display: 'flex',
          fontFamily: FONT_SERIF,
          fontWeight: 700,
          fontSize: 72,
          lineHeight: 1.16,
          color: IVORY,
        }}
      >
        “{quote}”
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Attribution name={name} role={role} />
        {badge ? <div style={{ display: 'flex', marginTop: 30 }}><CredibilityBadge scale={0.85} /></div> : null}
      </div>
    </div>
  )
}

function TemplateText({ w, h, logo, kicker, quote, name, role }: any) {
  return (
    <div style={PAGE({})}>
      <TopRule />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 72 }}>
        <div style={{ display: 'flex', marginBottom: 8 }}><Logo src={logo} height={54} /></div>
        <div style={{ display: 'flex', flex: 1 }}>
          <QuoteColumn kicker={kicker} quote={quote} name={name} role={role} badge />
        </div>
        <Footer />
      </div>
    </div>
  )
}

function TemplateGuest({ w, h, logo, kicker, quote, name, role, guest }: any) {
  return (
    <div style={PAGE({})}>
      <TopRule />
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
        {/* Left 60% — quote column */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '60%', padding: 64 }}>
          <div style={{ display: 'flex', marginBottom: 8 }}><Logo src={logo} height={50} /></div>
          <div style={{ display: 'flex', flex: 1 }}>
            <QuoteColumn kicker={kicker} quote={quote} name={name} role={role} badge />
          </div>
          <Footer />
        </div>
        {/* Divider — gold with red segment */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 10 }}>
          <div style={{ display: 'flex', height: '38%', background: RED }} />
          <div style={{ display: 'flex', flex: 1, background: GOLD }} />
        </div>
        {/* Right 40% — guest photo full-bleed */}
        <PhotoPanel src={guest} w="40%" h="100%" />
      </div>
    </div>
  )
}

function FaceCol({ src, name, role, w }: { src: string | null; name: string; role: string; w: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: w }}>
      <PhotoPanel src={src} w={w} h={w} radius={18} />
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 46, letterSpacing: 1, color: IVORY, marginTop: 22 }}>
        {name}
      </div>
      <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 600, fontSize: 28, letterSpacing: 1, color: MUTED, marginTop: 2 }}>
        {role}
      </div>
    </div>
  )
}

function TemplateFaceoff({ w, h, logo, mic, kicker, title, hostSrc, guestSrc, guestName, guestRole }: any) {
  const panel = Math.round((w - 64 * 2 - 90) / 2) // two panels + center gap
  return (
    <div style={PAGE({ alignItems: 'center' })}>
      <TopRule />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', padding: 64, alignItems: 'center' }}>
        <div style={{ display: 'flex', marginBottom: 10 }}><Logo src={logo} height={50} /></div>
        <Kicker text={kicker} />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 40, position: 'relative' }}>
          <FaceCol src={hostSrc} name="George Leith" role="Host" w={panel} />
          {/* Mic icon in a circle, centered between panels */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: (w - 64 * 2) / 2 - 55 + 64,
              width: 110,
              height: 110,
              borderRadius: 55,
              background: DARK,
              border: `4px solid ${GOLD}`,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            {mic ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img src={mic} width={64} height={64} style={{ width: 64, height: 64, objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', fontFamily: FONT_SANS, fontWeight: 700, fontSize: 40, color: RED }}>EP</div>
            )}
          </div>
          <div style={{ display: 'flex', width: 90 }} />
          <FaceCol src={guestSrc} name={guestName} role={guestRole} w={panel} />
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            fontSize: 44,
            lineHeight: 1.2,
            color: IVORY,
            textAlign: 'center',
            marginTop: 46,
            maxWidth: w - 200,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ display: 'flex', marginBottom: 26 }}><CredibilityBadge scale={0.85} /></div>
        <Footer />
      </div>
    </div>
  )
}

// ── handler ─────────────────────────────────────────────────────────────────

export async function GET(req: Request, { params }: { params: { template: string } }) {
  const url = new URL(req.url)
  const q = url.searchParams
  const template = (params.template as Template) || 'text'
  const size = (q.get('size') as Size) === 'portrait' ? 'portrait' : 'square'
  const W = 1080
  const H = size === 'portrait' ? 1350 : 1080

  const ep = await loadEpisode(q.get('episodeSlug'))

  const epNumber = q.get('ep') != null ? Number(q.get('ep')) : ep?.episode_number ?? null
  const pillar = (q.get('pillar') ?? ep?.pillar ?? '').toString()
  const kicker =
    template === 'faceoff'
      ? `EPISODE ${epNumber != null && epNumber > 0 ? String(epNumber).padStart(2, '0') : '—'}`
      : `${epLabel(epNumber)}${pillar ? ` · ${pillar.toUpperCase()}` : ''}`

  const quote = q.get('quote') ?? 'The framework that makes transformation inevitable.'
  const name = q.get('attribution') ?? ep?.guest_name ?? 'George Leith'
  const role = q.get('attributionRole') ?? ep?.guest_title ?? ''
  const title = ep?.title ?? ''

  const [logo, mic, hostSrc, guestSrc] = await Promise.all([
    fetchImage(ASSET.logo),
    template === 'faceoff' ? fetchImage(ASSET.mic) : Promise.resolve(null),
    template === 'faceoff' ? fetchImage(ASSET.host) : Promise.resolve(null),
    template === 'text' ? Promise.resolve(null) : fetchImage(ep?.thumbnail_url),
  ])
  const pf = loadFont('PlayfairDisplay.ttf')
  const bcSemi = loadFont('BarlowCondensed-SemiBold.ttf')
  const bcBold = loadFont('BarlowCondensed-Bold.ttf')

  const common = { w: W, h: H, logo, kicker }
  let element: React.ReactElement
  if (template === 'guest') {
    element = <TemplateGuest {...common} quote={quote} name={name} role={role} guest={guestSrc} />
  } else if (template === 'faceoff') {
    element = (
      <TemplateFaceoff
        {...common}
        mic={mic}
        title={title}
        hostSrc={hostSrc}
        guestSrc={guestSrc}
        guestName={ep?.guest_name ?? name}
        guestRole={ep?.guest_title ?? role}
      />
    )
  } else {
    element = <TemplateText {...common} quote={quote} name={name} role={role} />
  }

  return new ImageResponse(element, {
    width: W,
    height: H,
    fonts: [
      { name: FONT_SERIF, data: pf, weight: 700, style: 'normal' },
      { name: FONT_SERIF, data: pf, weight: 900, style: 'normal' },
      { name: FONT_SANS, data: bcSemi, weight: 600, style: 'normal' },
      { name: FONT_SANS, data: bcBold, weight: 700, style: 'normal' },
    ],
  })
}
