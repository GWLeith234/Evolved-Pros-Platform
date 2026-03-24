import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Requires requireAdmin helper
async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function POST() {
  const supabase = createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return auth.error

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
