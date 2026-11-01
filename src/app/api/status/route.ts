import { NextResponse } from 'next/server'
import { telemetry } from '../../../lib/live/status'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await telemetry(), { headers: { 'Cache-Control': 'no-store' } })
}

// Lets the browser measure its own round trip to this server.
export function HEAD() {
  return new Response(null, { headers: { 'Cache-Control': 'no-store' } })
}
