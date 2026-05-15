import { createHash } from 'crypto'
import { Client, Databases, Permission, Query, Role } from 'node-appwrite'
import { APPWRITE_CONFIG } from '../appwrite'
import { DEFAULT_JOB_PROFILE, Job, JobProfile } from './types'

const docId = (id: string) => createHash('sha1').update(id).digest('hex').slice(0, 32)

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)
  .setKey(process.env.APPWRITE_API_KEY || '')

const databases = new Databases(client)
const DB = APPWRITE_CONFIG.databaseId
const C_JOBS = APPWRITE_CONFIG.collections.jobs
const C_PROFILE = APPWRITE_CONFIG.collections.jobProfile

const perms = [
  Permission.read(Role.any()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
]

const safeJson = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

export async function getJobProfileServer(): Promise<JobProfile> {
  try {
    const doc = await databases.getDocument(DB, C_PROFILE, 'main')
    const parsed = safeJson<Partial<JobProfile>>((doc as { data?: string }).data, {})
    return { ...DEFAULT_JOB_PROFILE, ...parsed }
  } catch {
    return DEFAULT_JOB_PROFILE
  }
}

export async function setJobProfileServer(p: JobProfile): Promise<void> {
  await databases.updateDocument(DB, C_PROFILE, 'main', { data: JSON.stringify(p) })
}

export async function upsertJobServer(job: Job): Promise<{ created: boolean }> {
  const id = docId(job.id)
  try {
    await databases.updateDocument(DB, C_JOBS, id, { data: JSON.stringify(job) })
    return { created: false }
  } catch {
    try {
      await databases.createDocument(DB, C_JOBS, id, { data: JSON.stringify(job) }, perms)
      return { created: true }
    } catch (err) {
      console.error('upsertJobServer failed', job.id, (err as Error).message)
      return { created: false }
    }
  }
}

export async function pruneOldJobsServer(beforeIso: string): Promise<number> {
  try {
    const res = await databases.listDocuments(DB, C_JOBS, [Query.limit(500)])
    let removed = 0
    for (const d of res.documents) {
      const j = safeJson<Job>((d as { data?: string }).data, {} as Job)
      if (j.postedAt && j.postedAt < beforeIso) {
        try { await databases.deleteDocument(DB, C_JOBS, d.$id); removed++ } catch {}
      }
    }
    return removed
  } catch {
    return 0
  }
}
