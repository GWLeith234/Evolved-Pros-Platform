import '@/lib/polyfills/file'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// xAI image-edit calls run 20–40s. Harmless on self-hosted `next start` (this
// hint is Vercel-only) but correct if the app is ever deployed there.
export const maxDuration = 60

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { GUEST_PORTRAIT_MODEL, GUEST_PORTRAIT_PROMPT } from '@/lib/art/guest-portrait-style'

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 10 * 1024 * 1024
const XAI_EDITS_ENDPOINT = 'https://api.x.ai/v1/images/edits'

function stamp(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// POST /api/admin/episodes/[episodeId]/guest-portrait
// Generates ONE watercolour candidate from a reference photo. Not batched — a
// single edit call is slow and batching risks a timeout; the UI offers a
// "Generate another" button instead (which re-posts referencePath, no re-crop).
export async function POST(
  request: Request,
  { params }: { params: { episodeId: string } },
) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const episodeId = params.episodeId

  // Secret is server-side only. Fail loudly — never silently fall back.
  const apiKey = process.env.XAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'XAI_API_KEY is not configured on the server. Set it in Railway (server-side — never NEXT_PUBLIC_) and redeploy.',
      },
      { status: 500 },
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // The input MUST be square before it is sent — on single-image edits the
  // output aspect ratio follows the input aspect ratio.
  let squareBuffer: Buffer
  let referencePath =
    typeof form.get('referencePath') === 'string' ? (form.get('referencePath') as string) : ''

  const file = form.get('file')
  if (file && typeof file !== 'string') {
    const blob = file as Blob
    if (!ACCEPTED_TYPES.has(blob.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a JPEG, PNG, or WEBP.' },
        { status: 422 },
      )
    }
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum is 10MB.' }, { status: 422 })
    }
    const input = Buffer.from(await blob.arrayBuffer())
    try {
      // MANDATORY: centre-crop to 1:1 and resize to 1024×1024. .rotate() first
      // so EXIF-oriented phone photos crop the right way up.
      squareBuffer = await sharp(input)
        .rotate()
        .resize(1024, 1024, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 92 })
        .toBuffer()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `Could not process the image: ${msg}` }, { status: 422 })
    }
    // Persist the square reference so "Generate another" reuses it and publish
    // can clean it up.
    referencePath = `candidates/${episodeId}-ref-${stamp()}.jpg`
    const { error: refErr } = await adminClient.storage
      .from('Branding')
      .upload(referencePath, squareBuffer, { contentType: 'image/jpeg', upsert: true })
    if (refErr) {
      return NextResponse.json(
        { error: `Reference upload failed: ${refErr.message}` },
        { status: 500 },
      )
    }
  } else if (referencePath) {
    const { data, error } = await adminClient.storage.from('Branding').download(referencePath)
    if (error || !data) {
      return NextResponse.json(
        { error: 'Could not load the reference photo. Re-upload it and try again.' },
        { status: 400 },
      )
    }
    squareBuffer = Buffer.from(await data.arrayBuffer())
  } else {
    return NextResponse.json({ error: 'A reference photo is required.' }, { status: 422 })
  }

  const dataUri = `data:image/jpeg;base64,${squareBuffer.toString('base64')}`

  // Raw fetch — the OpenAI SDK sends multipart/form-data, but xAI's edits
  // endpoint requires JSON.
  let xaiRes: Response
  try {
    xaiRes = await fetch(XAI_EDITS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GUEST_PORTRAIT_MODEL,
        prompt: GUEST_PORTRAIT_PROMPT,
        image: { url: dataUri, type: 'image_url' },
        response_format: 'b64_json',
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Could not reach the xAI image API (network/proxy issue, not xAI): ${msg}` },
      { status: 502 },
    )
  }

  const rawBody = await xaiRes.text()
  if (!xaiRes.ok) {
    // Surface the actual xAI response body. Distinguish networking (403
    // host/allowlist) and moderation from a generic image failure.
    const lower = rawBody.toLowerCase()
    if (
      xaiRes.status === 403 &&
      (lower.includes('host') ||
        lower.includes('allowlist') ||
        lower.includes('allow list') ||
        lower.includes('not allowed') ||
        lower.includes('proxy'))
    ) {
      return NextResponse.json(
        {
          error: `Networking/allowlist error reaching xAI (HTTP 403) — this is a proxy/allowlist problem, not an image failure. Response: ${rawBody}`,
        },
        { status: 502 },
      )
    }
    if (
      lower.includes('moderat') ||
      lower.includes('safety') ||
      lower.includes('rejected') ||
      lower.includes('violat') ||
      lower.includes('content policy')
    ) {
      return NextResponse.json(
        { error: `xAI moderation rejected this image. Try a different reference photo. Response: ${rawBody}` },
        { status: 422 },
      )
    }
    return NextResponse.json(
      { error: `xAI image edit failed (HTTP ${xaiRes.status}): ${rawBody}` },
      { status: 502 },
    )
  }

  let parsed: { data?: Array<{ b64_json?: string; url?: string }> }
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: `xAI returned a non-JSON response: ${rawBody.slice(0, 500)}` },
      { status: 502 },
    )
  }

  const item = parsed?.data?.[0]
  let outBuffer: Buffer | null = null
  if (item?.b64_json) {
    outBuffer = Buffer.from(item.b64_json, 'base64')
  } else if (item?.url) {
    // Returned URLs are temporary — download server-side immediately.
    try {
      const dl = await fetch(item.url)
      if (dl.ok) outBuffer = Buffer.from(await dl.arrayBuffer())
    } catch {
      /* handled below */
    }
  }
  if (!outBuffer || outBuffer.length === 0) {
    return NextResponse.json(
      { error: `xAI response contained no image data: ${rawBody.slice(0, 500)}` },
      { status: 502 },
    )
  }

  const candidatePath = `candidates/${episodeId}-${stamp()}.jpg`
  const { error: upErr } = await adminClient.storage
    .from('Branding')
    .upload(candidatePath, outBuffer, { contentType: 'image/jpeg', upsert: true })
  if (upErr) {
    return NextResponse.json({ error: `Candidate upload failed: ${upErr.message}` }, { status: 500 })
  }
  const {
    data: { publicUrl },
  } = adminClient.storage.from('Branding').getPublicUrl(candidatePath)

  return NextResponse.json({ candidateUrl: publicUrl, candidatePath, referencePath })
}
