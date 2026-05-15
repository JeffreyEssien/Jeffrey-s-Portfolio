import { AdapterResult, RawJob } from '../types'

const KEY = process.env.JOOBLE_API_KEY

const stripHtml = (s: string) =>
  s.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type JoobleJob = {
  title: string
  location: string
  snippet: string
  salary: string
  source: string
  type: string
  link: string
  company: string
  updated: string
  id: number
}

async function search(body: Record<string, string>): Promise<JoobleJob[]> {
  if (!KEY) return []
  const res = await fetch(`https://jooble.org/api/${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Jooble ${res.status}`)
  const json = await res.json() as { jobs?: JoobleJob[] }
  return json.jobs ?? []
}

export async function fetchJooble(roleKeywords: string[]): Promise<AdapterResult> {
  const errors: string[] = []
  const seen = new Set<number>()
  const jobs: RawJob[] = []
  if (!KEY) return { source: 'jooble', jobs, errors: ['JOOBLE_API_KEY missing'] }

  const what = roleKeywords.slice(0, 4).join(' ')
  const queries: Record<string, string>[] = [
    { keywords: `${what} remote` },
    { keywords: `${what} junior` },
    { keywords: `${what} graduate` },
    { keywords: `${what}`, location: 'Nigeria' },
  ]

  for (const q of queries) {
    try {
      const page = await search(q)
      for (const j of page) {
        if (seen.has(j.id)) continue
        seen.add(j.id)
        jobs.push({
          sourceId: String(j.id),
          title: j.title,
          company: j.company,
          location: j.location,
          remote: /remote/i.test(j.location) || /remote/i.test(j.title),
          url: j.link,
          postedAt: j.updated,
          descriptionText: stripHtml(j.snippet).slice(0, 4000),
        })
      }
    } catch (e) {
      errors.push(`jooble: ${(e as Error).message}`)
    }
  }
  return { source: 'jooble', jobs, errors }
}
