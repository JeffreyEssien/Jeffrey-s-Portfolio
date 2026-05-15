import { AdapterResult, RawJob } from '../types'

const KEY = process.env.GOOGLE_SEARCH_API_KEY
const CX = process.env.GOOGLE_SEARCH_CX

type CseItem = {
  title: string
  link: string
  snippet?: string
  displayLink?: string
  pagemap?: {
    jobposting?: Array<{
      title?: string
      hiringorganization?: string
      joblocation?: string
      datePosted?: string
      description?: string
    }>
    metatags?: Array<Record<string, string>>
  }
}

async function search(q: string): Promise<CseItem[]> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(KEY!)}&cx=${encodeURIComponent(CX!)}&q=${encodeURIComponent(q)}&num=10`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Google CSE ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }
  const json = await res.json() as { items?: CseItem[] }
  return json.items ?? []
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export async function fetchGoogleSearch(roleKeywords: string[]): Promise<AdapterResult> {
  const errors: string[] = []
  const seen = new Set<string>()
  const jobs: RawJob[] = []
  if (!KEY || !CX) return { source: 'google-search', jobs, errors: ['GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_CX missing'] }

  const what = roleKeywords.slice(0, 3).join(' ') || 'developer'
  const queries = [
    `"junior ${what}" Nigeria`,
    `"graduate trainee" software developer Nigeria`,
    `"entry level" ${what} Lagos`,
    `${what} intern Nigeria`,
  ]

  for (const q of queries) {
    try {
      const items = await search(q)
      for (const it of items) {
        if (seen.has(it.link)) continue
        seen.add(it.link)
        const jp = it.pagemap?.jobposting?.[0]
        const meta = it.pagemap?.metatags?.[0] ?? {}
        const title = stripHtml(jp?.title || it.title || '')
        const company = jp?.hiringorganization || meta['og:site_name'] || (it.displayLink ?? '').replace(/^www\./, '').split('.')[0]
        const location = jp?.joblocation || 'Nigeria'
        const postedAt = jp?.datePosted ? new Date(jp.datePosted).toISOString() : new Date().toISOString()
        jobs.push({
          sourceId: it.link,
          title,
          company,
          location,
          remote: /remote/i.test(title) || /remote/i.test(location),
          url: it.link,
          postedAt,
          descriptionText: stripHtml(jp?.description || it.snippet || '').slice(0, 4000),
        })
      }
    } catch (e) {
      errors.push(`google-search "${q}": ${(e as Error).message}`)
    }
  }
  return { source: 'google-search', jobs, errors }
}
