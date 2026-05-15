import { Permission, Query, Role } from 'appwrite'
import { APPWRITE_CONFIG, databases, isAppwriteConfigured } from '../appwrite'
import { DEFAULT_JOB_PROFILE, Job, JobAction, JobActionState, JobProfile } from './types'

function docId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-24)
  return `${(h >>> 0).toString(36)}_${safe}`.slice(0, 36)
}

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
  const id = docId(jobId)
  const action: JobAction = { jobId, state, notes, updatedAt: new Date().toISOString() }
  try {
    await databases.updateDocument(DB, C_ACTIONS, id, { data: JSON.stringify(action) })
  } catch {
    await databases.createDocument(DB, C_ACTIONS, id, { data: JSON.stringify(action) }, perms)
  }
}

export async function clearJobAction(jobId: string): Promise<void> {
  try { await databases.deleteDocument(DB, C_ACTIONS, docId(jobId)) } catch {}
}
