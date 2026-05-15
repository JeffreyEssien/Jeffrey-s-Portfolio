import { AdapterResult, RawJob } from '../types'

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type RemotiveJob = {
  id: number
  url: string
  title: string
  company_name: string
  category: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  description: string
}

export async function fetchRemotive(): Promise<AdapterResult> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`remotive ${res.status}`)
    const json = await res.json() as { jobs?: RemotiveJob[] }
    const jobs: RawJob[] = (json.jobs ?? []).map((j) => ({
      sourceId: String(j.id),
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location,
      remote: true,
      url: j.url,
      postedAt: j.publication_date,
      descriptionText: stripHtml(j.description).slice(0, 4000),
    }))
    return { source: 'remotive', jobs, errors: [] }
  } catch (e) {
    return { source: 'remotive', jobs: [], errors: [(e as Error).message] }
  }
}
