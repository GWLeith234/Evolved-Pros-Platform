import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const body   = await req.json() as { order: string[] }

  if (!Array.isArray(body.order) || body.order.length === 0) {
    return NextResponse.json({ error: 'order array required' }, { status: 400 })
  }

  await Promise.all(
    body.order.map((id, index) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (adminClient as any)
        .from('habit_stacks')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('user_id', userId)
    )
  )

  return NextResponse.json({ ok: true })
}
