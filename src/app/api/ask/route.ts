import { NextRequest, NextResponse } from 'next/server'
import { askAboutJeffrey } from '../../../lib/ask'
import { rateLimit } from '../../../lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Keeps a public endpoint from burning the AI budget. Shared across instances when Redis/KV is configured.
const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 8

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!(await rateLimit(`ask:${ip}`, LIMIT, WINDOW_MS))) {
    return NextResponse.json({ error: 'Rate limit reached. Try again in a few minutes.' }, { status: 429 })
  }

  let question = ''
  try { question = String((await req.json()).question ?? '').trim() } catch {}
  if (!question || question.length > 300) return NextResponse.json({ error: 'Ask a question of up to 300 characters.' }, { status: 400 })

  try {
    return NextResponse.json(await askAboutJeffrey(question))
  } catch (e) {
    console.error('ask: failed', e)
    return NextResponse.json({ error: 'The AI assistant is unavailable right now. Try again shortly.' }, { status: 503 })
  }
}
