import { AdapterResult, RawJob } from '../types'

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type GhJob = {
  id: number | string
  title: string
  absolute_url: string
  updated_at: string
  location?: { name?: string }
  content?: string
  metadata?: unknown
  departments?: { name: string }[]
}

export async function fetchGreenhouse(slugs: string[]): Promise<AdapterResult> {
  const errors: string[] = []
  const out: RawJob[] = []
  await Promise.all(slugs.map(async (slug) => {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`${slug} ${res.status}`)
      const json = await res.json() as { jobs?: GhJob[] }
      for (const j of json.jobs ?? []) {
        const loc = j.location?.name ?? ''
        out.push({
          sourceId: `${slug}:${j.id}`,
          title: j.title,
          company: slug,
          location: loc,
          remote: /remote/i.test(loc) || /remote/i.test(j.title),
          url: j.absolute_url,
          postedAt: j.updated_at,
          descriptionText: stripHtml(j.content ?? '').slice(0, 4000),
        })
      }
    } catch (e) {
      errors.push(`greenhouse:${slug}: ${(e as Error).message}`)
    }
  }))
  return { source: 'greenhouse', jobs: out, errors }
}
