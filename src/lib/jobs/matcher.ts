import { Job, JobProfile, NgFlag, RawJob, ScoreBreakdown } from './types'

const SENIORITY_REJECTS_BY_PROFILE: Record<string, string[]> = {
  graduate: ['senior', 'staff', 'principal', 'lead', 'manager', 'director', 'head of', 'vp ', 'iii', ' iv', '10+ years', '8+ years', '7+ years', '6+ years', '5+ years'],
  junior: ['senior', 'staff', 'principal', 'lead', 'manager', 'director', 'head of', 'vp ', '10+ years', '8+ years', '7+ years'],
  mid: ['principal', 'director', 'head of', 'vp '],
}

const NG_DIRECT_TERMS = ['nigeria', 'lagos', 'abuja', 'port harcourt', 'ibadan', 'kano']
const WORLDWIDE_TERMS = ['worldwide', 'anywhere', 'any country', 'remote-first', 'remote first', 'fully remote', 'global remote', 'any timezone']
const LOC_EXCLUDES = ['us only', 'usa only', 'us-only', 'us residents', 'us citizens', 'eu only', 'eu-only', 'europe only', 'uk only', 'canada only', 'must reside in', 'must be located in the us', 'must be based in']

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function uniqueHits(haystack: string, needles: string[]): string[] {
  const hits = new Set<string>()
  for (const n of needles) {
    if (!n) continue
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(n.toLowerCase())}([^a-z0-9]|$)`, 'i')
    if (re.test(haystack)) hits.add(n)
  }
  return [...hits]
}

function decideNgFlag(titleLc: string, bodyLc: string, locLc: string): NgFlag {
  if (NG_DIRECT_TERMS.some((t) => locLc.includes(t) || titleLc.includes(t))) return 'direct'
  if (WORLDWIDE_TERMS.some((t) => bodyLc.includes(t) || titleLc.includes(t) || locLc.includes(t))) return 'worldwide'
  return 'unclear'
}

export function scoreJob(raw: RawJob, source: Job['source'], profile: JobProfile): Job | null {
  const title = raw.title || ''
  const body = raw.descriptionText || ''
  const loc = raw.location || ''
  const titleLc = title.toLowerCase()
  const bodyLc = body.toLowerCase()
  const locLc = loc.toLowerCase()
  const fullLc = `${titleLc}\n${bodyLc}`

  for (const ex of profile.excludes) {
    const e = ex.toLowerCase().trim()
    if (e && fullLc.includes(e)) return reject(raw, source, `excluded: ${ex}`, titleLc, bodyLc, locLc)
  }

  const seniorityRejectTerms = new Set<string>()
  for (const lvl of profile.seniority) (SENIORITY_REJECTS_BY_PROFILE[lvl] ?? []).forEach((t) => seniorityRejectTerms.add(t))
  for (const lvl of (['graduate', 'junior', 'mid'] as const)) {
    if (profile.seniority.includes(lvl)) continue
    ;(SENIORITY_REJECTS_BY_PROFILE[lvl] ?? []).forEach((t) => seniorityRejectTerms.delete(t))
  }
  for (const t of seniorityRejectTerms) {
    if (titleLc.includes(t)) return reject(raw, source, `seniority mismatch: ${t}`, titleLc, bodyLc, locLc)
  }

  for (const ex of LOC_EXCLUDES) {
    if (fullLc.includes(ex)) {
      const ngFlag = decideNgFlag(titleLc, bodyLc, locLc)
      if (ngFlag !== 'direct') return reject(raw, source, `location excludes Nigeria: "${ex}"`, titleLc, bodyLc, locLc)
    }
  }

  const titleHits = uniqueHits(titleLc, profile.roleKeywords.map((k) => k.toLowerCase()))
  if (titleHits.length === 0) return null
  const bodyHits = uniqueHits(bodyLc, profile.skillKeywords.map((k) => k.toLowerCase()))
  const titleScore = titleHits.length * 8
  const bodyScore = Math.min(20, bodyHits.length * 2)
  const ageDays = raw.postedAt ? Math.max(0, (Date.now() - new Date(raw.postedAt).getTime()) / 86400000) : 30
  const recencyBoost = Math.max(0, Math.min(10, 10 - ageDays))
  const ngFlag = decideNgFlag(titleLc, bodyLc, locLc)
  const score = Math.round(titleScore + bodyScore + recencyBoost + (ngFlag === 'direct' ? 2 : ngFlag === 'worldwide' ? 1 : 0))

  if (score < 8) return null

  const breakdown: ScoreBreakdown = { titleHits, bodyHits, recencyBoost: Math.round(recencyBoost), ngFlag }
  return {
    id: `${source}:${raw.sourceId}`,
    source, sourceId: raw.sourceId,
    title: raw.title, company: raw.company, location: raw.location,
    remote: raw.remote, url: raw.url, postedAt: raw.postedAt,
    descriptionText: raw.descriptionText,
    score, scoreBreakdown: breakdown,
    fetchedAt: new Date().toISOString(),
  }
}

function reject(raw: RawJob, source: Job['source'], reason: string, titleLc: string, bodyLc: string, locLc: string): null {
  // Keep the reject signature for symmetry / debugging — return null since rejected jobs aren't stored.
  void titleLc; void bodyLc; void locLc; void raw; void source; void reason
  return null
}
