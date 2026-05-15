import { AdapterResult, RawJob } from '../types'

const stripHtml = (s: string) => s
  .replace(/<p>/gi, '\n').replace(/<br\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x2F;/g, '/').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
  .replace(/\s+/g, ' ').trim()

type AlgoliaHit = {
  objectID: string
  comment_text?: string
  story_text?: string
  created_at: string
  title?: string
}

async function findLatestHiringThreadId(): Promise<string | null> {
  const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10')
  if (!res.ok) throw new Error(`hn-thread ${res.status}`)
  const json = await res.json() as { hits?: AlgoliaHit[] }
  for (const h of json.hits ?? []) {
    const t = (h.title ?? '').toLowerCase()
    if (t.includes('who is hiring') && !t.includes('wants to be hired') && !t.includes('freelancer')) {
      return h.objectID
    }
  }
  return null
}

function inferMeta(text: string): { title: string; company: string; location: string; remote: boolean } {
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? text.slice(0, 200)
  const remote = /remote/i.test(firstLine) || /\bworldwide\b/i.test(firstLine)
  const parts = firstLine.split(/\s*\|\s*/)
  if (parts.length >= 2) {
    return { company: parts[0].trim(), title: parts[1].trim().slice(0, 140), location: (parts[2] ?? '').trim().slice(0, 80), remote }
  }
  return { company: '', title: firstLine.slice(0, 140), location: '', remote }
}

export async function fetchHnHiring(query: string): Promise<AdapterResult> {
  try {
    const threadId = await findLatestHiringThreadId()
    if (!threadId) return { source: 'hn-hiring', jobs: [], errors: ['no recent "Who is hiring" thread found'] }
    const tags = `comment,story_${threadId}`
    const qs = new URLSearchParams({ tags, query: query.split(/\s+/)[0] || 'react', hitsPerPage: '100' })
    const res = await fetch(`https://hn.algolia.com/api/v1/search?${qs.toString()}`)
    if (!res.ok) throw new Error(`hn ${res.status}`)
    const json = await res.json() as { hits?: AlgoliaHit[] }
    const jobs: RawJob[] = []
    for (const h of json.hits ?? []) {
      const raw = stripHtml(h.comment_text ?? h.story_text ?? '')
      if (!raw) continue
      const meta = inferMeta(raw)
      if (!meta.title) continue
      jobs.push({
        sourceId: h.objectID,
        title: meta.title,
        company: meta.company,
        location: meta.location,
        remote: meta.remote,
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        postedAt: h.created_at,
        descriptionText: raw.slice(0, 4000),
      })
    }
    return { source: 'hn-hiring', jobs, errors: [] }
  } catch (e) {
    return { source: 'hn-hiring', jobs: [], errors: [(e as Error).message] }
  }
}
