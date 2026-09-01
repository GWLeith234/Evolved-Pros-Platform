// Polyfill File for Node 18 — Supabase storage-js references File internally.
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

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

// POST /api/admin/episodes/[episodeId]/guest-portrait/publish
// Copies the chosen candidate to the canonical Branding/ep<NN>-<slug>.jpg,
// sets episodes.guest_image_url (the art layer — NEVER thumbnail_url), then
// deletes the other candidates and the uploaded reference photo.
export async function POST(
  request: Request,
  { params }: { params: { episodeId: string } },
) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const episodeId = params.episodeId

  let body: { chosenPath?: string; candidatePaths?: string[]; referencePath?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const chosenPath = typeof body.chosenPath === 'string' ? body.chosenPath : ''
  if (!chosenPath) {
    return NextResponse.json({ error: 'chosenPath is required' }, { status: 422 })
  }
  const candidatePaths = Array.isArray(body.candidatePaths)
    ? body.candidatePaths.filter((p): p is string => typeof p === 'string')
    : []
  const referencePath = typeof body.referencePath === 'string' ? body.referencePath : ''

  // Episode identity for the canonical filename ep<NN>-<slug>.jpg.
  const { data: ep, error: epErr } = await adminClient
    .from('episodes')
    .select('episode_number, slug')
    .eq('id', episodeId)
    .maybeSingle()
  if (epErr || !ep) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
  }
  const nn = String(ep.episode_number ?? 0).padStart(2, '0')
  const slug = String(ep.slug ?? episodeId)
  const finalPath = `ep${nn}-${slug}.jpg`

  // Copy chosen candidate → canonical path (download + upsert so a re-publish
  // overwrites in place rather than orphaning).
  const { data: chosenBlob, error: dlErr } = await adminClient.storage
    .from('Branding')
    .download(chosenPath)
  if (dlErr || !chosenBlob) {
    return NextResponse.json({ error: 'Could not read the chosen candidate.' }, { status: 400 })
  }
  const buffer = Buffer.from(await chosenBlob.arrayBuffer())
  const { error: upErr } = await adminClient.storage
    .from('Branding')
    .upload(finalPath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (upErr) {
    return NextResponse.json({ error: `Publish upload failed: ${upErr.message}` }, { status: 500 })
  }
  const {
    data: { publicUrl },
  } = adminClient.storage.from('Branding').getPublicUrl(finalPath)

  // Cache-bust so a re-publish to the same path is picked up immediately.
  const artUrl = `${publicUrl}?v=${Date.now()}`

  // Set the art layer ONLY. Never touch thumbnail_url.
  const { error: updErr } = await adminClient
    .from('episodes')
    .update({ guest_image_url: artUrl })
    .eq('id', episodeId)
  if (updErr) {
    return NextResponse.json(
      { error: `Could not set guest_image_url: ${updErr.message}` },
      { status: 500 },
    )
  }

  // Cleanup — delete every candidate (including the chosen one's candidate copy)
  // and the reference photo. Best-effort: a cleanup miss must not fail publish.
  const toDelete = Array.from(
    new Set([...candidatePaths, chosenPath, ...(referencePath ? [referencePath] : [])]),
  )
  if (toDelete.length > 0) {
    const { error: delErr } = await adminClient.storage.from('Branding').remove(toDelete)
    if (delErr) {
      console.warn('[guest-portrait/publish] cleanup failed (non-fatal):', delErr.message)
    }
  }

  return NextResponse.json({ url: artUrl })
}
