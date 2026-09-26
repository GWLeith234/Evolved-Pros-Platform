import { serveWeeklyReport } from '@/lib/reports/serve'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  return serveWeeklyReport(request)
}
