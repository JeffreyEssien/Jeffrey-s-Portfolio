import { AdapterResult, RawJob } from '../types'

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type LeverJob = {
  id: string
  text: string
  hostedUrl: string
  createdAt: number
  categories?: { location?: string; commitment?: string; team?: string }
  description?: string
  descriptionPlain?: string
}

export async function fetchLever(slugs: string[]): Promise<AdapterResult> {
  const errors: string[] = []
  const out: RawJob[] = []
  await Promise.all(slugs.map(async (slug) => {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`${slug} ${res.status}`)
      const list = await res.json() as LeverJob[]
      for (const j of list) {
        const loc = j.categories?.location ?? ''
        out.push({
          sourceId: `${slug}:${j.id}`,
          title: j.text,
          company: slug,
          location: loc,
          remote: /remote/i.test(loc) || /remote/i.test(j.text),
          url: j.hostedUrl,
          postedAt: new Date(j.createdAt).toISOString(),
          descriptionText: stripHtml(j.descriptionPlain ?? j.description ?? '').slice(0, 4000),
        })
      }
    } catch (e) {
      errors.push(`lever:${slug}: ${(e as Error).message}`)
    }
  }))
  return { source: 'lever', jobs: out, errors }
}
