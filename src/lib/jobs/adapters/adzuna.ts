import { AdapterResult, RawJob } from '../types'

const APP_ID = process.env.ADZUNA_APP_ID
const APP_KEY = process.env.ADZUNA_APP_KEY
const COUNTRY = (process.env.ADZUNA_COUNTRY || 'gb').toLowerCase()

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type AdzunaResult = {
  id: string
  title: string
  company?: { display_name?: string }
  location?: { display_name?: string }
  redirect_url: string
  created: string
  description: string
}

async function fetchPage(params: Record<string, string>): Promise<AdzunaResult[]> {
  if (!APP_ID || !APP_KEY) return []
  const qs = new URLSearchParams({ app_id: APP_ID, app_key: APP_KEY, results_per_page: '20', ...params })
  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1?${qs.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'portfolio-jobs/1.0' },
  })
  if (!res.ok) throw new Error(`Adzuna ${res.status}`)
  const json = await res.json() as { results?: AdzunaResult[] }
  return json.results ?? []
}

export async function fetchAdzuna(roleKeywords: string[], companies: string[]): Promise<AdapterResult> {
  const errors: string[] = []
  const seen = new Set<string>()
  const jobs: RawJob[] = []
  if (!APP_ID || !APP_KEY) return { source: 'adzuna', jobs, errors: ['ADZUNA_APP_ID / ADZUNA_APP_KEY missing'] }

  void companies
  const queries: Record<string, string>[] = []
  const what = roleKeywords.slice(0, 5).join(' ')
  if (what) {
    queries.push({ what })
    queries.push({ what: `${what} junior` })
    queries.push({ what: `${what} graduate` })
  }

  for (const q of queries) {
    try {
      const page = await fetchPage(q)
      for (const r of page) {
        if (seen.has(r.id)) continue
        seen.add(r.id)
        jobs.push({
          sourceId: r.id,
          title: r.title,
          company: r.company?.display_name ?? '',
          location: r.location?.display_name ?? '',
          remote: /remote/i.test(r.title) || /remote/i.test(r.description),
          url: r.redirect_url,
          postedAt: r.created,
          descriptionText: stripHtml(r.description).slice(0, 4000),
        })
      }
    } catch (e) {
      errors.push(`adzuna: ${(e as Error).message}`)
    }
  }
  return { source: 'adzuna', jobs, errors }
}
