import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  // Mux direct upload — only available if credentials are configured
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    return NextResponse.json(
      { error: 'Mux credentials not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET.' },
      { status: 503 },
    )
  }

  try {
    // Dynamic import to avoid build errors when Mux is not configured
    const Mux = (await import('@mux/mux-node')).default
    const mux = new Mux({ tokenId, tokenSecret })
    const upload = await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ['signed'] },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
    })
    return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mux upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
