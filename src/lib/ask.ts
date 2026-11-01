// "Ask my AI" — answers visitor questions about Jeffrey, grounded only in the
// published portfolio content. Same provider order as CV tailoring: Gemini first
// (free tier), Claude as fallback. Server-only.
import { getPublicAbout, getPublicContact, getPublicHero, getPublicProjects, getPublicWork } from './public-content'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const CLAUDE_MODEL = process.env.ASK_CLAUDE_MODEL || 'claude-haiku-5-5'

async function profile() {
  const [hero, about, work, projects, contact] = await Promise.all([getPublicHero(), getPublicAbout(), getPublicWork(), getPublicProjects(), getPublicContact()])
  return JSON.stringify({
    name: hero.name,
    headline: hero.subheadline,
    roles: hero.taglines,
    about: `${about.headlinePrefix}${about.headlineAccent}${about.headlineSuffix} ${about.extraParagraph ?? ''}`.trim(),
    education: `${about.educationDegree}, ${about.educationSchool} (${about.educationPeriod})`,
    certifications: about.certifications,
    skills: about.skills.map((s) => `${s.name} (${s.level}/100)`),
    stack: about.technologies,
    experience: work.map((w) => ({ role: w.role, company: w.company, period: w.period, location: w.location, details: w.description })),
    projects: projects.map((p) => ({ title: p.title, description: p.description, link: p.link, technologies: p.technologies, role: p.role, challenge: p.problem, features: p.features, howItWorks: p.steps, approach: p.solution, results: p.results })),
    contact: contact.email,
  })
}

const SYSTEM = [
  "You are the assistant on Jeffrey Essien's portfolio site, answering recruiters and engineers.",
  'Answer ONLY from the PROFILE JSON. If the profile does not say, reply that you do not know and suggest emailing Jeffrey.',
  'Never invent employers, dates, metrics or skills. Speak about Jeffrey in the third person.',
  'Be concise: at most 4 short sentences or 4 bullets, plain text, no markdown headings.',
].join('\n')

async function gemini(prompt: string, key: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 400 } }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
  const data = await res.json()
  return (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text || '').join('')
}

async function claude(prompt: string, key: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 400, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}`)
  const data = await res.json()
  return (data?.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
}

export async function askAboutJeffrey(question: string): Promise<{ answer: string; provider: string }> {
  const prompt = `PROFILE:\n${await profile()}\n\nQUESTION:\n${question}`
  const providers: [string, () => Promise<string>][] = []
  if (process.env.GOOGLE_API_KEY) providers.push(['gemini', () => gemini(prompt, process.env.GOOGLE_API_KEY!)])
  if (process.env.ANTHROPIC_API_KEY) providers.push(['claude', () => claude(prompt, process.env.ANTHROPIC_API_KEY!)])
  if (!providers.length) throw new Error('The AI assistant is not configured on this deployment.')
  for (const [name, run] of providers) {
    try {
      const answer = (await run()).trim()
      if (answer) return { answer, provider: name }
    } catch (e) {
      console.error(`ask: ${name} failed`, e)
    }
  }
  throw new Error('The AI assistant is unavailable right now. Try again shortly.')
}
