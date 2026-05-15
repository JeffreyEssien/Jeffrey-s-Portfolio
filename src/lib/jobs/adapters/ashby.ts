import { AdapterResult, RawJob } from '../types'

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type AshbyJob = {
  id: string
  title: string
  location?: string
  isRemote?: boolean
  jobUrl: string
  publishedAt?: string
  descriptionPlain?: string
  descriptionHtml?: string
}

export async function fetchAshby(slugs: string[]): Promise<AdapterResult> {
  const errors: string[] = []
  const out: RawJob[] = []
  await Promise.all(slugs.map(async (slug) => {
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`${slug} ${res.status}`)
      const json = await res.json() as { jobs?: AshbyJob[] }
      for (const j of json.jobs ?? []) {
        const loc = j.location ?? ''
        out.push({
          sourceId: `${slug}:${j.id}`,
          title: j.title,
          company: slug,
          location: loc,
          remote: !!j.isRemote || /remote/i.test(loc),
          url: j.jobUrl,
          postedAt: j.publishedAt ?? new Date().toISOString(),
          descriptionText: stripHtml(j.descriptionPlain ?? j.descriptionHtml ?? '').slice(0, 4000),
        })
      }
    } catch (e) {
      errors.push(`ashby:${slug}: ${(e as Error).message}`)
    }
  }))
  return { source: 'ashby', jobs: out, errors }
}
