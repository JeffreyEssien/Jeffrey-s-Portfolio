// AI CV tailoring — server-only. Rephrases existing CV content to emphasise relevance
// to a job description. Provider-agnostic with fallback: tries Google Gemini first
// (free tier), then Claude. It only rewrites text that already exists — it never
// invents employers, metrics, or skills, and never drops or adds bullets.
//
// Uses REST (fetch) for both providers deliberately: one uniform code path, no added
// npm dependencies. Model IDs are env-configurable.
import type { Cv, CvSection } from '../content'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-8'

export type AiProvider = 'gemini' | 'claude'
export type AiTailorResult = { cv: Cv; provider: AiProvider }

type Edits = { headline?: string; summary?: string; bullets?: Record<string, string> }

// The minimal, ID-keyed view of the CV we send to the model.
function extractPayload(cv: Cv) {
  const experience: { id: string; role: string; company: string; bullets: { id: string; text: string }[] }[] = []
  const projects: { id: string; title: string; bullets: { id: string; text: string }[] }[] = []
  let summary = ''
  for (const s of cv.sections) {
    if (s.type === 'summary' && !summary) summary = s.body
    if (s.type === 'experience') for (const it of s.items) experience.push({ id: it.id, role: it.role, company: it.company, bullets: it.bullets.map((b) => ({ id: b.id, text: b.text })) })
    if (s.type === 'projects') for (const it of s.items) projects.push({ id: it.id, title: it.title, bullets: it.bullets.map((b) => ({ id: b.id, text: b.text })) })
  }
  return { headline: cv.personal.headline, summary, experience, projects }
}

function buildPrompt(cv: Cv, jobDescription: string): string {
  const payload = extractPayload(cv)
  return [
    'You tailor an existing CV to a specific job. You rephrase wording only — you never invent experience, employers, metrics, technologies, or achievements that are not already present, and you never add or remove bullets.',
    '',
    'Rewrite rules (from CV best practice):',
    '- Emphasise the candidate experience most relevant to the job, using the job\'s own terminology where it is TRUTHFULLY supported by the existing text.',
    '- Concise, active voice, strong action verbs. One line per bullet.',
    '- No first-person pronouns ("I", "we"). No abbreviations or jargon.',
    '- Keep every bullet id you are given; return rewritten text for each (or the original text unchanged if nothing should change).',
    '- The summary: 1–2 sentences tailored to this role, grounded only in the CV content.',
    '',
    'Return ONLY a JSON object, no prose, no code fences, with this exact shape:',
    '{"headline": string, "summary": string, "bullets": { "<bulletId>": "<rewritten text>", ... }}',
    '',
    'JOB DESCRIPTION:',
    jobDescription,
    '',
    'CURRENT CV (ids must be preserved):',
    JSON.stringify(payload),
  ].join('\n')
}

function parseEdits(raw: string): Edits {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('model did not return JSON')
  return JSON.parse(cleaned.slice(start, end + 1)) as Edits
}

function applyEdits(cv: Cv, edits: Edits): Cv {
  const bullets = edits.bullets ?? {}
  const sections: CvSection[] = cv.sections.map((s) => {
    if (s.type === 'summary' && edits.summary) return { ...s, body: edits.summary }
    if (s.type === 'experience') return { ...s, items: s.items.map((it) => ({ ...it, bullets: it.bullets.map((b) => (bullets[b.id] ? { ...b, text: bullets[b.id] } : b)) })) }
    if (s.type === 'projects') return { ...s, items: s.items.map((it) => ({ ...it, bullets: it.bullets.map((b) => (bullets[b.id] ? { ...b, text: bullets[b.id] } : b)) })) }
    return s
  })
  return {
    ...cv,
    personal: { ...cv.personal, headline: edits.headline?.trim() || cv.personal.headline },
    sections,
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? ''
  if (!text) throw new Error('Gemini returned no text')
  return text
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: 'You output only a single JSON object, with no surrounding prose or code fences.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text = (data?.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
  if (!text) throw new Error('Claude returned no text')
  return text
}

export async function tailorCvWithAi(cv: Cv, jobDescription: string): Promise<AiTailorResult> {
  const googleKey = process.env.GOOGLE_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // Gemini first (free tier), Claude as fallback. Order follows which keys are set.
  const providers: { name: AiProvider; run: () => Promise<string> }[] = []
  if (googleKey) providers.push({ name: 'gemini', run: () => callGemini(buildPrompt(cv, jobDescription), googleKey) })
  if (anthropicKey) providers.push({ name: 'claude', run: () => callClaude(buildPrompt(cv, jobDescription), anthropicKey) })

  if (providers.length === 0) {
    throw new Error('No AI key configured. Set GOOGLE_API_KEY (free from Google AI Studio) and/or ANTHROPIC_API_KEY.')
  }

  const errors: string[] = []
  for (const p of providers) {
    try {
      const edits = parseEdits(await p.run())
      return { cv: applyEdits(cv, edits), provider: p.name }
    } catch (e) {
      errors.push(`${p.name}: ${(e as Error).message}`)
    }
  }
  throw new Error(`All AI providers failed — ${errors.join(' | ')}`)
}
