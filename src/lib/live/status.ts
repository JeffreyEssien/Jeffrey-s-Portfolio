// Live telemetry for the public "Ops" section — server-only.
// Uptime probes hit the published project URLs; GitHub data comes from public
// endpoints (an optional GITHUB_TOKEN only raises the rate limit).
import { getPublicProjects } from '../public-content'
import { externalUrl } from '../project-utils'

export const GITHUB_USER = process.env.GITHUB_USER || 'JeffreyEssien'
export const GITHUB_REPO = process.env.GITHUB_REPO || 'JeffreyEssien/Jeffrey-s-Portfolio'
const CI_WORKFLOW = process.env.GITHUB_CI_WORKFLOW || 'ci.yml'

export type Probe = { name: string; host: string; url: string; ok: boolean; status: number | null; latencyMs: number | null; checkedAt: string }
export type CiRun = { title: string; branch: string; conclusion: string | null; status: string; url: string; startedAt: string; durationS: number | null; sha: string }
export type Commit = { sha: string; message: string; date: string; url: string }
export type Contributions = { total: number; days: { date: string; level: number; count: number }[] }
export type Telemetry = {
  region: string
  services: Probe[]
  ci: CiRun[]
  commits: Commit[]
  contributions: Contributions | null
  generatedAt: string
}

// Small per-instance cache so a burst of visitors doesn't turn into a burst of probes.
const cache = new Map<string, { at: number; value: unknown }>()
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T
  const value = await load()
  cache.set(key, { at: Date.now(), value })
  return value
}

export async function probe(name: string, url: string): Promise<Probe> {
  const started = performance.now()
  const checkedAt = new Date().toISOString()
  const host = new URL(url).host
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'jeffrey-portfolio-uptime/1.0' } })
    const latencyMs = Math.round(performance.now() - started)
    res.body?.cancel().catch(() => {})
    return { name, host, url, ok: res.ok, status: res.status, latencyMs, checkedAt }
  } catch {
    return { name, host, url, ok: false, status: null, latencyMs: null, checkedAt }
  }
}

// Only hosts of published projects are ever probed — never arbitrary input.
export async function serviceTargets() {
  const projects = await getPublicProjects()
  return projects
    .map((p) => ({ name: p.title, url: externalUrl(p.link) }))
    .filter((t) => t.url.startsWith('https://'))
}

async function github(path: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'jeffrey-portfolio' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com${path}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  return res.json()
}

async function loadCi(): Promise<CiRun[]> {
  const data = await github(`/repos/${GITHUB_REPO}/actions/workflows/${CI_WORKFLOW}/runs?per_page=6`)
  return (data.workflow_runs ?? []).map((r: Record<string, string>) => ({
    title: r.display_title,
    branch: r.head_branch,
    conclusion: r.conclusion,
    status: r.status,
    url: r.html_url,
    startedAt: r.run_started_at,
    durationS: r.updated_at && r.run_started_at ? Math.round((Date.parse(r.updated_at) - Date.parse(r.run_started_at)) / 1000) : null,
    sha: r.head_sha?.slice(0, 7),
  }))
}

async function loadCommits(): Promise<Commit[]> {
  const data = await github(`/repos/${GITHUB_REPO}/commits?per_page=6`)
  return data.map((c: { sha: string; html_url: string; commit: { message: string; author: { date: string } } }) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    date: c.commit.author.date,
    url: c.html_url,
  }))
}

// GitHub's public contribution calendar (the same HTML the profile page renders).
async function loadContributions(): Promise<Contributions> {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(GITHUB_USER)}/contributions`, { cache: 'no-store', signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'jeffrey-portfolio' } })
  if (!res.ok) throw new Error(`GitHub contributions ${res.status}`)
  const html = await res.text()
  const counts = new Map<string, number>()
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</g)) {
    const n = m[2].match(/^(\d+) contribution/)
    counts.set(m[1], n ? Number(n[1]) : 0)
  }
  const days: Contributions['days'] = []
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"\s+id="([^"]+)"\s+data-level="(\d)"/g)) {
    days.push({ date: m[1], level: Number(m[3]), count: counts.get(m[2]) ?? 0 })
  }
  days.sort((a, b) => a.date.localeCompare(b.date))
  const totalMatch = html.replace(/\s+/g, ' ').match(/([\d,]+) contributions? in the last year/)
  return { total: totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : days.reduce((s, d) => s + d.count, 0), days }
}

const settle = async <T,>(p: Promise<T>, fallback: T) => { try { return await p } catch { return fallback } }

export async function telemetry(): Promise<Telemetry> {
  const [services, ci, commits, contributions] = await Promise.all([
    cached('services', 20_000, async () => Promise.all((await serviceTargets()).map((t) => probe(t.name, t.url)))),
    settle(cached('ci', 300_000, loadCi), []),
    settle(cached('commits', 300_000, loadCommits), []),
    settle(cached('contributions', 3_600_000, loadContributions), null),
  ])
  return { region: process.env.VERCEL_REGION || 'local', services, ci, commits, contributions, generatedAt: new Date().toISOString() }
}
