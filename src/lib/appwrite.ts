import { Client, Account, Databases, Storage } from 'appwrite'

export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'portfolio',
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'assets',
  collections: {
    hero: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_HERO || 'hero',
    about: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ABOUT || 'about',
    projects: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS || 'projects',
    contact: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CONTACT || 'contact',
    work: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_WORK || 'work',
    cv: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CV || 'cv',
    jobs: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_JOBS || 'jobs',
    jobActions: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_JOB_ACTIONS || 'job_actions',
    jobProfile: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_JOB_PROFILE || 'job_profile',
  },
}

export const isAppwriteConfigured = () =>
  !!APPWRITE_CONFIG.endpoint && !!APPWRITE_CONFIG.projectId

const client = new Client()
if (isAppwriteConfigured()) {
  client.setEndpoint(APPWRITE_CONFIG.endpoint).setProject(APPWRITE_CONFIG.projectId)
}

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export function fileUrl(fileId: string): string {
  if (!isAppwriteConfigured() || !fileId) return ''
  const { endpoint, projectId, bucketId } = APPWRITE_CONFIG
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`
}
