import { NextRequest, NextResponse } from 'next/server'
import { probe, serviceTargets } from '../../../../lib/live/status'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// A fresh, uncached probe of one published project host (used by the terminal's `ping`).
export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host')?.toLowerCase().replace(/^www\./, '')
  const target = (await serviceTargets()).find((t) => new URL(t.url).host.replace(/^www\./, '') === host)
  if (!target) return NextResponse.json({ error: 'Unknown host. Only published project hosts can be pinged.' }, { status: 404 })
  return NextResponse.json({ ...(await probe(target.name, target.url)), region: process.env.VERCEL_REGION || 'local' }, { headers: { 'Cache-Control': 'no-store' } })
}
