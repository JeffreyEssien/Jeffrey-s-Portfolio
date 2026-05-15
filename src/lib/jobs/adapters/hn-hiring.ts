import { AdapterResult, RawJob } from '../types'

type AlgoliaHit = {
  objectID: string
  author: string
  story_text?: string
  comment_text?: string
  created_at: string
  parent_id?: number
  story_id?: number
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function inferTitle(text: string): { title: string; company: string; location: string; remote: boolean } {
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? text.slice(0, 120)
  const remote = /remote/i.test(firstLine) || /remote/i.test(text)
  const m = firstLine.match(/^([^|]+?)\s*[|–-]\s*(.+)/)
  if (m) return { company: m[1].trim(), title: firstLine, location: m[2].trim().slice(0, 80), remote }
  return { company: '', title: firstLine.slice(0, 120), location: '', remote }
}

export async function fetchHnHiring(query: string): Promise<AdapterResult> {
  try {
    const qs = new URLSearchParams({ query, tags: 'comment,story_(Who is hiring?)', hitsPerPage: '50' })
    const res = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${qs.toString()}`)
    if (!res.ok) throw new Error(`hn ${res.status}`)
    const json = await res.json() as { hits?: AlgoliaHit[] }
    const jobs: RawJob[] = []
    for (const h of json.hits ?? []) {
      const raw = stripHtml(h.comment_text ?? h.story_text ?? '')
      if (!raw) continue
      const meta = inferTitle(raw)
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
