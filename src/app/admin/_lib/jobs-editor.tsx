'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAbout, getHero } from '../../../lib/content'
import {
  clearJobAction, getJobProfile, listJobActions, listJobs, setJobAction, setJobProfile,
} from '../../../lib/jobs/storage'
import { DEFAULT_JOB_PROFILE, Job, JobAction, JobActionState, JobProfile, JobSource } from '../../../lib/jobs/types'
import { Field, FieldGroup, PageHeader, SaveBar, inputCls, useSaveState } from './forms'

type Tab = 'inbox' | 'saved' | 'applied' | 'dismissed' | 'profile'

const SOURCES: JobSource[] = ['adzuna', 'jooble', 'greenhouse', 'lever', 'ashby', 'remotive', 'hn-hiring', 'hot-nigerian-jobs', 'google-search']
const SOURCE_LABELS: Record<JobSource, string> = {
  adzuna: 'Adzuna', jooble: 'Jooble', greenhouse: 'Greenhouse', lever: 'Lever',
  ashby: 'Ashby', remotive: 'Remotive', 'hn-hiring': 'HN Hiring', 'hot-nigerian-jobs': 'Hot Nigerian Jobs',
  'google-search': 'Google Search',
}

export function JobsEditor() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [profile, setProfileState] = useState<JobProfile>(DEFAULT_JOB_PROFILE)
  const [jobs, setJobs] = useState<Job[]>([])
  const [actions, setActions] = useState<JobAction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string>('')
  const [refreshErrors, setRefreshErrors] = useState<string[]>([])
  const [ngOnly, setNgOnly] = useState(true)
  const [saveState, save] = useSaveState()

  const reload = useCallback(async () => {
    setLoading(true)
    const [p, j, a] = await Promise.all([getJobProfile(), listJobs(), listJobActions()])
    setProfileState(p); setJobs(j); setActions(a)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const actionMap = useMemo(() => {
    const m = new Map<string, JobAction>()
    for (const a of actions) m.set(a.jobId, a)
    return m
  }, [actions])

  const filtered = useMemo(() => {
    let list = jobs.slice().sort((a, b) => b.score - a.score)
    if (ngOnly) list = list.filter((j) => j.scoreBreakdown.ngFlag !== 'unclear')
    if (tab === 'inbox') return list.filter((j) => !actionMap.has(j.id))
    if (tab === 'saved') return list.filter((j) => actionMap.get(j.id)?.state === 'saved')
    if (tab === 'applied') return list.filter((j) => actionMap.get(j.id)?.state === 'applied')
    if (tab === 'dismissed') return list.filter((j) => actionMap.get(j.id)?.state === 'dismissed')
    return []
  }, [tab, jobs, actionMap, ngOnly])

  const onAction = async (jobId: string, state: JobActionState) => {
    await setJobAction(jobId, state, actionMap.get(jobId)?.notes ?? '')
    const a = await listJobActions(); setActions(a)
  }
  const onClearAction = async (jobId: string) => {
    await clearJobAction(jobId)
    const a = await listJobActions(); setActions(a)
  }
  const onNotes = async (jobId: string, notes: string) => {
    const existing = actionMap.get(jobId)
    await setJobAction(jobId, existing?.state ?? 'saved', notes)
    const a = await listJobActions(); setActions(a)
  }

  const triggerRefresh = async () => {
    setRefreshing(true); setRefreshMsg('Running…'); setRefreshErrors([])
    try {
      const res = await fetch('/api/jobs/refresh', { method: 'POST' })
      const json = await res.json() as { totalNew?: number; totalUpserted?: number; errors?: string[]; error?: string }
      if (!res.ok) throw new Error(json.error || json.errors?.join('; ') || 'refresh failed')
      setRefreshMsg(`${json.totalNew ?? 0} new · ${json.totalUpserted ?? 0} total upserted${json.errors?.length ? ` · errors: ${json.errors.length}` : ''}`)
      setRefreshErrors(json.errors ?? [])
      await reload()
    } catch (e) {
      setRefreshMsg(`Error: ${(e as Error).message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const seedFromCv = async () => {
    const [hero, about] = await Promise.all([getHero(), getAbout()])
    const role = [hero.taglines?.[0] ?? '', 'graduate', 'junior', 'mid-level', 'frontend', 'react', 'next.js'].filter(Boolean)
    const skills = [...about.skills.map((s) => s.name), ...about.technologies].filter(Boolean)
    setProfileState((p) => ({
      ...p,
      roleKeywords: Array.from(new Set([...p.roleKeywords, ...role.flatMap((r) => r.toLowerCase().split(/\s+/).filter(Boolean))])),
      skillKeywords: Array.from(new Set([...p.skillKeywords, ...skills.map((s) => s.toLowerCase())])),
    }))
  }

  const counts = useMemo(() => {
    const pool = ngOnly ? jobs.filter((j) => j.scoreBreakdown.ngFlag !== 'unclear') : jobs
    const inbox = pool.filter((j) => !actionMap.has(j.id)).length
    const poolIds = new Set(pool.map((j) => j.id))
    const saved = actions.filter((a) => a.state === 'saved' && poolIds.has(a.jobId)).length
    const applied = actions.filter((a) => a.state === 'applied' && poolIds.has(a.jobId)).length
    const dismissed = actions.filter((a) => a.state === 'dismissed' && poolIds.has(a.jobId)).length
    return { inbox, saved, applied, dismissed }
  }, [jobs, actions, actionMap, ngOnly])

  return (
    <div>
      <PageHeader title="Jobs" description="Auto-refreshed twice daily at 07:00 + 19:00 WAT. Manual refresh also available." />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button onClick={triggerRefresh} disabled={refreshing}
          className="px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50">
          {refreshing ? 'Refreshing…' : 'Refresh now'}
        </button>
        <span className="text-xs text-neutral-500">
          {profile.lastRunAt ? `Last run: ${new Date(profile.lastRunAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}` : 'No run yet'}
        </span>
        {refreshMsg && <span className="text-xs text-neutral-700 ml-2">{refreshMsg}</span>}
      </div>

      {refreshErrors.length > 0 && (
        <details className="mb-6 text-xs">
          <summary className="cursor-pointer text-amber-700">Show {refreshErrors.length} adapter error{refreshErrors.length === 1 ? '' : 's'}</summary>
          <ul className="mt-2 space-y-1 text-neutral-600 font-mono">
            {refreshErrors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </details>
      )}

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ngOnly} onChange={(e) => setNgOnly(e.target.checked)} />
          <span className="text-neutral-700">Nigeria-friendly only</span>
          <span className="text-xs text-neutral-400">(hides roles whose Nigeria-eligibility is unclear)</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200 mb-8">
        {([
          ['inbox', `Inbox (${counts.inbox})`],
          ['saved', `Saved (${counts.saved})`],
          ['applied', `Applied (${counts.applied})`],
          ['dismissed', `Dismissed (${counts.dismissed})`],
          ['profile', 'Profile'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${tab === t ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab !== 'profile' && (
        <div className="space-y-4">
          {loading ? <p className="text-sm text-neutral-500">Loading…</p>
            : filtered.length === 0 ? <p className="text-sm text-neutral-500">Nothing here yet. Try “Refresh now”.</p>
            : filtered.map((j) => (
              <JobCard key={j.id} job={j} action={actionMap.get(j.id)}
                onAction={onAction} onClearAction={onClearAction} onNotes={onNotes} />
            ))}
        </div>
      )}

      {tab === 'profile' && (
        <ProfileEditor profile={profile} setProfile={setProfileState} onSeedFromCv={seedFromCv}
          saveState={saveState} onSave={() => save(() => setJobProfile(profile))} />
      )}
    </div>
  )
}

function JobCard({ job, action, onAction, onClearAction, onNotes }: {
  job: Job
  action?: JobAction
  onAction: (id: string, s: JobActionState) => void
  onClearAction: (id: string) => void
  onNotes: (id: string, notes: string) => void
}) {
  const [notes, setNotes] = useState(action?.notes ?? '')
  useEffect(() => { setNotes(action?.notes ?? '') }, [action?.notes])
  const ng = job.scoreBreakdown.ngFlag
  const ngLabel = ng === 'direct' ? '🇳🇬 Nigeria' : ng === 'worldwide' ? '🌍 Worldwide' : 'Unclear'
  const ngCls = ng === 'direct' ? 'bg-emerald-100 text-emerald-700' : ng === 'worldwide' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'
  const hits = job.scoreBreakdown.titleHits.concat(job.scoreBreakdown.bodyHits).slice(0, 8)

  return (
    <div className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-medium ${ngCls}`}>{ngLabel}</span>
        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-900 text-white font-medium">Score {job.score}</span>
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">{SOURCE_LABELS[job.source]}</span>
        <span className="text-xs text-neutral-400 ml-auto">{new Date(job.postedAt).toLocaleDateString()}</span>
      </div>
      <a href={job.url} target="_blank" rel="noreferrer" className="block">
        <h3 className="text-base font-semibold text-neutral-900 hover:underline">{job.title}</h3>
      </a>
      <p className="text-sm text-neutral-600 mt-0.5">{job.company || '—'}{job.location ? ` · ${job.location}` : ''}</p>
      {hits.length > 0 && (
        <p className="text-xs text-neutral-500 mt-2">Matched: {hits.join(', ')}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <a href={job.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs rounded-lg bg-neutral-900 text-white hover:bg-neutral-700">Open ↗</a>
        {action?.state !== 'saved' && <button onClick={() => onAction(job.id, 'saved')} className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 hover:border-neutral-900">Save</button>}
        {action?.state !== 'applied' && <button onClick={() => onAction(job.id, 'applied')} className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 hover:border-neutral-900">Mark applied</button>}
        {action?.state !== 'dismissed' && <button onClick={() => onAction(job.id, 'dismissed')} className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 hover:border-neutral-900">Dismiss</button>}
        {action && <button onClick={() => onClearAction(job.id)} className="px-3 py-1.5 text-xs rounded-lg text-red-600 hover:bg-red-50">Move back to inbox</button>}
      </div>
      {action && (
        <textarea
          className={inputCls + ' mt-3 h-16 text-sm'}
          placeholder="Notes (e.g. recruiter contact, why interested)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onNotes(job.id, notes)}
        />
      )}
    </div>
  )
}

function ProfileEditor({ profile, setProfile, onSeedFromCv, saveState, onSave }: {
  profile: JobProfile
  setProfile: (fn: (p: JobProfile) => JobProfile) => void
  onSeedFromCv: () => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onSave: () => void
}) {
  const csvOf = (arr: string[]) => arr.join(', ')
  const parseCsv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

  return (
    <div>
      <div className="mb-6">
        <button onClick={onSeedFromCv} className="px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:border-neutral-900">
          Seed keywords from CV
        </button>
        <span className="text-xs text-neutral-500 ml-3">Merges your CV skills + technologies into the keyword lists below.</span>
      </div>

      <div className="space-y-10">
        <FieldGroup title="Keywords" description="Comma-separated. Title hits score 8× each; body hits score 2×.">
          <Field label="Role keywords">
            <input className={inputCls} value={csvOf(profile.roleKeywords)} onChange={(e) => setProfile((p) => ({ ...p, roleKeywords: parseCsv(e.target.value) }))} />
          </Field>
          <Field label="Skill keywords">
            <input className={inputCls} value={csvOf(profile.skillKeywords)} onChange={(e) => setProfile((p) => ({ ...p, skillKeywords: parseCsv(e.target.value) }))} />
          </Field>
          <Field label="Excluded terms" hint="Hard reject if any of these appear in title or body.">
            <input className={inputCls} value={csvOf(profile.excludes)} onChange={(e) => setProfile((p) => ({ ...p, excludes: parseCsv(e.target.value) }))} />
          </Field>
        </FieldGroup>

        <FieldGroup title="Seniority">
          <div className="flex flex-wrap gap-3">
            {(['graduate', 'junior', 'mid'] as const).map((lvl) => (
              <label key={lvl} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={profile.seniority.includes(lvl)}
                  onChange={(e) => setProfile((p) => ({
                    ...p,
                    seniority: e.target.checked ? Array.from(new Set([...p.seniority, lvl])) : p.seniority.filter((s) => s !== lvl),
                  }))} />
                {lvl}
              </label>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup title="Locations">
          <Field label="Preferred locations" hint="Used in display and Nigeria-flag heuristics.">
            <input className={inputCls} value={csvOf(profile.locations)} onChange={(e) => setProfile((p) => ({ ...p, locations: parseCsv(e.target.value) }))} />
          </Field>
        </FieldGroup>

        <FieldGroup title="Sources">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SOURCES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={profile.sources[s]}
                  onChange={(e) => setProfile((p) => ({ ...p, sources: { ...p.sources, [s]: e.target.checked } }))} />
                {SOURCE_LABELS[s]}
              </label>
            ))}
          </div>
          <Field label="Greenhouse company slugs"><input className={inputCls} value={csvOf(profile.greenhouseSlugs)} onChange={(e) => setProfile((p) => ({ ...p, greenhouseSlugs: parseCsv(e.target.value) }))} /></Field>
          <Field label="Lever company slugs"><input className={inputCls} value={csvOf(profile.leverSlugs)} onChange={(e) => setProfile((p) => ({ ...p, leverSlugs: parseCsv(e.target.value) }))} /></Field>
          <Field label="Ashby company slugs"><input className={inputCls} value={csvOf(profile.ashbySlugs)} onChange={(e) => setProfile((p) => ({ ...p, ashbySlugs: parseCsv(e.target.value) }))} /></Field>
        </FieldGroup>

        <FieldGroup title="Nigerian companies of interest" description="Used to query Adzuna NG by company name; rotated across days to respect rate limits.">
          <Field label="Companies">
            <textarea className={inputCls + ' h-32'} value={csvOf(profile.companiesNG)}
              onChange={(e) => setProfile((p) => ({ ...p, companiesNG: parseCsv(e.target.value) }))} />
          </Field>
        </FieldGroup>

        <FieldGroup title="Last run">
          <p className="text-sm text-neutral-700">
            {profile.lastRunAt ? new Date(profile.lastRunAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }) + ' WAT' : '—'}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Per-source counts: {Object.entries(profile.lastRunCounts).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}
          </p>
        </FieldGroup>
      </div>

      <SaveBar state={saveState} onSave={onSave} />
    </div>
  )
}
