import { ID, Permission, Query, Role } from 'appwrite'
import { APPWRITE_CONFIG, databases, isAppwriteConfigured } from '../appwrite'
import { DEFAULT_JOB_PROFILE, Job, JobAction, JobActionState, JobProfile } from './types'

const DB = APPWRITE_CONFIG.databaseId
const C_JOBS = APPWRITE_CONFIG.collections.jobs
const C_ACTIONS = APPWRITE_CONFIG.collections.jobActions
const C_PROFILE = APPWRITE_CONFIG.collections.jobProfile

const perms = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
]

const safeJson = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

export async function getJobProfile(): Promise<JobProfile> {
  if (!isAppwriteConfigured()) return DEFAULT_JOB_PROFILE
  try {
    const doc = await databases.getDocument(DB, C_PROFILE, 'main')
    const parsed = safeJson<Partial<JobProfile>>((doc as { data?: string }).data, {})
    return { ...DEFAULT_JOB_PROFILE, ...parsed }
  } catch {
    return DEFAULT_JOB_PROFILE
  }
}

export async function setJobProfile(p: JobProfile): Promise<void> {
  await databases.updateDocument(DB, C_PROFILE, 'main', { data: JSON.stringify(p) })
}

export async function listJobs(limit = 200): Promise<Job[]> {
  if (!isAppwriteConfigured()) return []
  try {
    const res = await databases.listDocuments(DB, C_JOBS, [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ])
    return res.documents.map((d) => ({ $id: d.$id, ...safeJson<Job>((d as { data?: string }).data, {} as Job) }))
  } catch {
    return []
  }
}

export async function upsertJob(job: Job): Promise<{ created: boolean }> {
  try {
    await databases.updateDocument(DB, C_JOBS, job.id, { data: JSON.stringify(job) })
    return { created: false }
  } catch {
    try {
      await databases.createDocument(DB, C_JOBS, job.id, { data: JSON.stringify(job) }, perms)
      return { created: true }
    } catch (err) {
      console.error('upsertJob failed', job.id, err)
      return { created: false }
    }
  }
}

export async function pruneOldJobs(beforeIso: string): Promise<number> {
  if (!isAppwriteConfigured()) return 0
  const res = await databases.listDocuments(DB, C_JOBS, [Query.limit(500)])
  let removed = 0
  for (const d of res.documents) {
    const j = safeJson<Job>((d as { data?: string }).data, {} as Job)
    if (j.postedAt && j.postedAt < beforeIso) {
      try { await databases.deleteDocument(DB, C_JOBS, d.$id); removed++ } catch {}
    }
  }
  return removed
}

export async function listJobActions(): Promise<JobAction[]> {
  if (!isAppwriteConfigured()) return []
  try {
    const res = await databases.listDocuments(DB, C_ACTIONS, [Query.limit(500)])
    return res.documents.map((d) => ({ $id: d.$id, ...safeJson<JobAction>((d as { data?: string }).data, {} as JobAction) }))
  } catch {
    return []
  }
}

export async function setJobAction(jobId: string, state: JobActionState, notes = ''): Promise<void> {
  const action: JobAction = { jobId, state, notes, updatedAt: new Date().toISOString() }
  try {
    await databases.updateDocument(DB, C_ACTIONS, jobId, { data: JSON.stringify(action) })
  } catch {
    await databases.createDocument(DB, C_ACTIONS, jobId, { data: JSON.stringify(action) }, perms)
  }
}

export async function clearJobAction(jobId: string): Promise<void> {
  try { await databases.deleteDocument(DB, C_ACTIONS, jobId) } catch {}
}
