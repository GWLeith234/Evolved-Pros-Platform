// Polyfill File for Node 18 — Supabase storage-js references File internally
if (typeof globalThis.File === 'undefined') {
  ;(globalThis as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any).File = class File extends Blob {
    name: string
    lastModified: number
    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      super(bits, options)
      this.name = name
      this.lastModified = options?.lastModified ?? Date.now()
    }
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { PILLAR_CONFIG } from '@/lib/pillars'

// ---- Geometry (matches the existing 2:3 cover library) -------------------
const W = 800
const H = 1200
const BASE = '#0A0F18'
const GOLD = '#C9A84C'
const MUTED = '#9AA4B2'
const MARGIN = 54

interface CoverBody {
  episodeNumber?: unknown
  guestName?: unknown
  guestTitle?: unknown
  runtime?: unknown
  pillar?: unknown
  photoUrl?: unknown
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Glyphs we always want in a subset so dynamic strings never render tofu.
const SAFETY = " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,&'-:"

// next/og (satori) cannot parse woff2. Passing &text= makes Google Fonts
// serve a subsetted *truetype* face, which satori can read. This is the
// canonical Vercel pattern for runtime font loading.
async function loadGoogleFont(cssFamily: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${cssFamily}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error(`Could not parse font face for ${cssFamily}`)
  const res = await fetch(match[1])
  if (!res.ok) throw new Error(`Failed to fetch font data for ${cssFamily} (${res.status})`)
  return res.arrayBuffer()
}

// Embed the photo as a data URI — more reliable than letting satori fetch it.
async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch guest photo (${res.status})`)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await res.arrayBuffer())
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: CoverBody
  try {
    body = (await request.json()) as CoverBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ---- Validate / normalize inputs ----------------------------------------
  const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : ''
  if (!photoUrl) return NextResponse.json({ error: 'photoUrl is required' }, { status: 422 })

  const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : ''
  if (!guestName) return NextResponse.json({ error: 'guestName is required' }, { status: 422 })

  const pillarKey = typeof body.pillar === 'string' ? body.pillar.trim() : ''
  const pillar = PILLAR_CONFIG[pillarKey]
  if (!pillar) return NextResponse.json({ error: `Unknown pillar "${pillarKey}"` }, { status: 422 })

  const guestTitle = typeof body.guestTitle === 'string' ? body.guestTitle.trim() : ''

  const epNumRaw =
    typeof body.episodeNumber === 'number'
      ? body.episodeNumber
      : typeof body.episodeNumber === 'string' && body.episodeNumber.trim()
        ? parseInt(body.episodeNumber, 10)
        : NaN
  const hasEpNum = Number.isFinite(epNumRaw)
  const epNumStr = hasEpNum
    ? (epNumRaw < 100 ? String(epNumRaw).padStart(2, '0') : String(epNumRaw))
    : '00'

  const runtimeRaw =
    typeof body.runtime === 'number'
      ? body.runtime
      : typeof body.runtime === 'string' && body.runtime.trim()
        ? parseInt(body.runtime, 10)
        : NaN
  const hasRuntime = Number.isFinite(runtimeRaw) && runtimeRaw > 0

  const color = pillar.color
  const pillarLabel = pillar.label.toUpperCase()

  // ---- Shrink the guest name to fit the bottom block width ----------------
  const contentWidth = W - MARGIN * 2 // 692
  const nameLen = Math.max(guestName.length, 1)
  // Playfair 700 averages ~0.52em advance; clamp into a sensible band.
  const nameFontSize = Math.max(36, Math.min(74, Math.floor(contentWidth / (nameLen * 0.52))))

  // ---- Load assets (fonts + photo) in parallel ----------------------------
  let photoDataUri: string
  let bebas: ArrayBuffer
  let barlowCond: ArrayBuffer
  let playfair: ArrayBuffer
  let barlow: ArrayBuffer
  try {
    ;[photoDataUri, bebas, barlowCond, playfair, barlow] = await Promise.all([
      fetchAsDataUri(photoUrl),
      loadGoogleFont('Bebas+Neue', `#THE EVOLVED PROS MIN${epNumStr}${hasRuntime ? runtimeRaw : ''}0123456789`),
      loadGoogleFont('Barlow+Condensed:wght@600', pillarLabel + SAFETY),
      loadGoogleFont('Playfair+Display:wght@700', guestName + SAFETY),
      loadGoogleFont('Barlow:wght@500', (guestTitle || ' ') + SAFETY),
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load cover assets'
    console.error('[episodes/cover] asset load error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // ---- Render -------------------------------------------------------------
  const image = new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: W,
          height: H,
          backgroundColor: BASE,
        }}
      >
        {/* Guest photo — full bleed, face biased to upper third */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoDataUri}
          alt=""
          width={W}
          height={H}
          style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover', objectPosition: '50% 22%' }}
        />

        {/* Pillar-color cohesion tint (~10%) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: hexToRgba(color, 0.1) }} />

        {/* Top scrim — top 22%, dark → transparent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: Math.round(H * 0.22),
            background: 'linear-gradient(to bottom, rgba(10,15,24,0.85), rgba(10,15,24,0))',
          }}
        />

        {/* Bottom scrim — from 40% to 92%, transparent → base */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: W,
            height: Math.round(H * 0.6),
            background: `linear-gradient(to bottom, rgba(10,15,24,0) 0%, ${BASE} 86.7%)`,
          }}
        />

        {/* Pillar frame — 2px at ~28% opacity */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, border: `2px solid ${hexToRgba(color, 0.28)}` }} />

        {/* Solid pillar bar — full width, bottom edge */}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: W, height: 12, backgroundColor: color }} />

        {/* Top-left — hash + two-digit episode number */}
        <div style={{ position: 'absolute', top: 22, left: MARGIN, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 150, lineHeight: 1, color: '#FFFFFF' }}>
          #{epNumStr}
        </div>

        {/* Top-right — pillar tag pill */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: MARGIN,
            display: 'flex',
            alignItems: 'center',
            border: `2px solid ${color}`,
            borderRadius: 999,
            padding: '10px 22px',
            fontFamily: 'Barlow Condensed',
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 3,
            color,
          }}
        >
          {pillarLabel}
        </div>

        {/* Bottom-left block */}
        <div style={{ position: 'absolute', left: MARGIN, bottom: MARGIN, display: 'flex', flexDirection: 'column', width: contentWidth }}>
          {/* Pillar accent rule */}
          <div style={{ width: 70, height: 5, backgroundColor: color, marginBottom: 20 }} />
          {/* Eyebrow */}
          <div style={{ display: 'flex', fontFamily: 'Bebas Neue', fontSize: 34, letterSpacing: 6, color: GOLD }}>
            THE EVOLVED PROS
          </div>
          {/* Guest name */}
          <div style={{ display: 'flex', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: nameFontSize, lineHeight: 1.05, color: '#FFFFFF', marginTop: 10 }}>
            {guestName}
          </div>
          {/* Guest title */}
          {guestTitle ? (
            <div style={{ display: 'flex', fontFamily: 'Barlow', fontWeight: 500, fontSize: 38, color: MUTED, marginTop: 8 }}>
              {guestTitle}
            </div>
          ) : null}
        </div>

        {/* Bottom-right — runtime */}
        {hasRuntime ? (
          <div style={{ position: 'absolute', right: MARGIN, bottom: 60, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 40, color: MUTED }}>
            {runtimeRaw} MIN
          </div>
        ) : null}
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Bebas Neue', data: bebas, weight: 400, style: 'normal' },
        { name: 'Barlow Condensed', data: barlowCond, weight: 600, style: 'normal' },
        { name: 'Playfair Display', data: playfair, weight: 700, style: 'normal' },
        { name: 'Barlow', data: barlow, weight: 500, style: 'normal' },
      ],
    },
  )

  // ---- Upload PNG to Branding ---------------------------------------------
  let publicUrl: string
  try {
    const pngBuffer = Buffer.from(await image.arrayBuffer())
    const slug = slugify(guestName) || 'guest'
    const epSegment = hasEpNum ? epNumRaw : 'na'
    const path = `episode-${epSegment}-${slug}-cover.png`

    const { error: uploadError } = await adminClient.storage
      .from('Branding')
      .upload(path, pngBuffer, { contentType: 'image/png', upsert: true })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: { publicUrl: url } } = adminClient.storage.from('Branding').getPublicUrl(path)
    // Cache-bust so a re-render of the same path shows the new art immediately.
    publicUrl = `${url}?v=${Date.now()}`
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save cover'
    console.error('[episodes/cover] render/upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
