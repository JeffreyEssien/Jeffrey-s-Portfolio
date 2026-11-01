import { NextRequest, NextResponse } from 'next/server'
import { tailorCvWithAi } from '../../../../lib/cv/ai-tailor'
import type { Cv } from '../../../../lib/content'
import { isAuthenticatedAdmin } from '../../../../lib/server-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticatedAdmin(req))) {
    return NextResponse.json({ error: 'Sign in to use AI tailoring.' }, { status: 401 })
  }
  let body: { cv?: Cv; jobDescription?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!body.cv || !body.jobDescription?.trim()) {
    return NextResponse.json({ error: 'cv and jobDescription are required.' }, { status: 400 })
  }
  try {
    const result = await tailorCvWithAi(body.cv, body.jobDescription)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
