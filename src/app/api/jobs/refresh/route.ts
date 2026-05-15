import { NextRequest, NextResponse } from 'next/server'
import { refreshJobs } from '../../../../lib/jobs/refresh'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.JOBS_CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    const expected = `Bearer ${secret}`
    const isCron = auth === expected
    const isSameOrigin = req.headers.get('origin') === req.nextUrl.origin
    if (!isCron && !isSameOrigin) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }
  try {
    const summary = await refreshJobs()
    return NextResponse.json(summary)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
