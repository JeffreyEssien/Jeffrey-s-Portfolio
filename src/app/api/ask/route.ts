import { NextRequest, NextResponse } from 'next/server'
import { askAboutJeffrey } from '../../../lib/ask'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Best-effort per-instance limiter; keeps a public endpoint from burning the AI budget.
const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 8
const hits = new Map<string, number[]>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= LIMIT) return NextResponse.json({ error: 'Rate limit reached. Try again in a few minutes.' }, { status: 429 })
  hits.set(ip, [...recent, now])

  let question = ''
  try { question = String((await req.json()).question ?? '').trim() } catch {}
  if (!question || question.length > 300) return NextResponse.json({ error: 'Ask a question of up to 300 characters.' }, { status: 400 })

  try {
    return NextResponse.json(await askAboutJeffrey(question))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 })
  }
}
