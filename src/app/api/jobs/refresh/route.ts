import { NextRequest, NextResponse } from 'next/server'
import { refreshJobs } from '../../../../lib/jobs/refresh'
import { isAuthenticatedAdmin } from '../../../../lib/server-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.JOBS_CRON_SECRET
  const isCron = !!secret && req.headers.get('authorization') === `Bearer ${secret}`
  if (!isCron && !(await isAuthenticatedAdmin(req))) {
    return NextResponse.json({ error: 'Sign in to refresh jobs.' }, { status: 401 })
  }
  try {
    const summary = await refreshJobs()
    return NextResponse.json(summary)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
