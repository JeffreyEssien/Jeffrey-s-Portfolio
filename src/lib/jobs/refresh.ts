import { fetchAdzuna } from './adapters/adzuna'
import { fetchAshby } from './adapters/ashby'
import { fetchGreenhouse } from './adapters/greenhouse'
import { fetchGoogleSearch } from './adapters/google-search'
import { fetchHnHiring } from './adapters/hn-hiring'
import { fetchHotNigerianJobs } from './adapters/hot-nigerian-jobs'
import { fetchJooble } from './adapters/jooble'
import { fetchLever } from './adapters/lever'
import { fetchRemotive } from './adapters/remotive'
import { scoreJob } from './matcher'
import { getJobProfileServer, pruneOldJobsServer, setJobProfileServer, upsertJobServer } from './server-storage'
import { AdapterResult, Job, JobProfile, JobSource } from './types'

const TIMEOUT_MS = 12000

function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timeout`)), TIMEOUT_MS)),
  ])
}

export type RefreshSummary = {
  totalNew: number
  totalUpserted: number
  perSource: Partial<Record<JobSource, number>>
  errors: string[]
  topMatches: Job[]
}

export async function refreshJobs(): Promise<RefreshSummary> {
  const profile = await getJobProfileServer()
  const adapterRuns: Promise<AdapterResult>[] = []

  if (profile.sources.adzuna) adapterRuns.push(withTimeout(fetchAdzuna(profile.roleKeywords, profile.companiesNG), 'adzuna'))
  if (profile.sources.jooble) adapterRuns.push(withTimeout(fetchJooble(profile.roleKeywords), 'jooble'))
  if (profile.sources.greenhouse) adapterRuns.push(withTimeout(fetchGreenhouse(profile.greenhouseSlugs), 'greenhouse'))
  if (profile.sources.lever) adapterRuns.push(withTimeout(fetchLever(profile.leverSlugs), 'lever'))
  if (profile.sources.ashby) adapterRuns.push(withTimeout(fetchAshby(profile.ashbySlugs), 'ashby'))
  if (profile.sources.remotive) adapterRuns.push(withTimeout(fetchRemotive(), 'remotive'))
  if (profile.sources['hn-hiring']) adapterRuns.push(withTimeout(fetchHnHiring(profile.roleKeywords.slice(0, 3).join(' ') || 'react'), 'hn-hiring'))
  if (profile.sources['hot-nigerian-jobs']) adapterRuns.push(withTimeout(fetchHotNigerianJobs(), 'hot-nigerian-jobs'))
  if (profile.sources['google-search']) adapterRuns.push(withTimeout(fetchGoogleSearch(profile.roleKeywords), 'google-search'))

  const settled = await Promise.allSettled(adapterRuns)
  const errors: string[] = []
  const perSource: Partial<Record<JobSource, number>> = {}
  const allScored: Job[] = []

  for (const s of settled) {
    if (s.status === 'rejected') { errors.push(String(s.reason)); continue }
    const { source, jobs, errors: aErrs } = s.value
    errors.push(...aErrs)
    for (const raw of jobs) {
      const j = scoreJob(raw, source, profile)
      if (j) allScored.push(j)
    }
  }

  const byId = new Map<string, Job>()
  for (const j of allScored) {
    const existing = byId.get(j.id)
    if (!existing || j.score > existing.score) byId.set(j.id, j)
  }

  const lastRunAt = profile.lastRunAt
  let totalNew = 0
  let totalUpserted = 0
  const isNew = (j: Job) => !lastRunAt || j.postedAt > lastRunAt

  for (const j of byId.values()) {
    const r = await upsertJobServer(j)
    totalUpserted++
    if (r.created) totalNew++
    perSource[j.source] = (perSource[j.source] ?? 0) + 1
  }

  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString()
  await pruneOldJobsServer(sixtyDaysAgo)

  const newJobs = [...byId.values()].filter(isNew).sort((a, b) => b.score - a.score)
  const topMatches = newJobs.slice(0, 10)

  const updatedProfile: JobProfile = {
    ...profile,
    lastRunAt: new Date().toISOString(),
    lastRunCounts: perSource,
  }
  await setJobProfileServer(updatedProfile)

  return { totalNew, totalUpserted, perSource, errors, topMatches }
}
