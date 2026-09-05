export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { resolveCityStockWithSearch } from '@/lib/events/cityStockFetch'

export async function GET(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const city = new URL(request.url).searchParams.get('city')
  const resolved = await resolveCityStockWithSearch({ city })
  return NextResponse.json(resolved)
}
