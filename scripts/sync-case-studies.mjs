// One-off: copy the case-study fields and new screenshots from the local snapshot
// into Appwrite, so the next build's content pull keeps them.
// Usage: APPWRITE_API_KEY=... node --env-file-if-exists=.env.local scripts/sync-case-studies.mjs
import { readFile } from 'node:fs/promises'

const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '')
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '69f183a50036207ea3c3'
const database = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'portfolio'
const collection = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS || 'projects'
const bucket = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'assets'
const key = process.env.APPWRITE_API_KEY
if (!key) throw new Error('Set APPWRITE_API_KEY (databases.write + files.write scopes) in .env.local')

const headers = { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key }
async function call(path, init = {}) {
  const res = await fetch(`${endpoint}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path}: HTTP ${res.status} ${await res.text()}`)
  return res.json()
}

const screenshots = { '69f314f900193946bad1': 'xelle.jpg', '69f316400002936d7e87': 'zuta.jpg', '6a0acad30012f28f5297': 'chatmate.jpg' }
const snapshot = JSON.parse(await readFile(new URL('../src/lib/published-content.json', import.meta.url)))

for (const local of snapshot.projects) {
  const docPath = `/databases/${database}/collections/${collection}/documents/${local.$id}`
  const doc = await call(docPath)
  const data = JSON.parse(doc.data || '{}')
  for (const field of ['problem', 'features', 'steps']) if (local[field]) data[field] = local[field]

  const shot = screenshots[local.$id]
  if (shot) {
    const form = new FormData()
    form.append('fileId', 'unique()')
    form.append('file', new Blob([await readFile(new URL(`../../project-screenshots/${shot}`, import.meta.url))], { type: 'image/jpeg' }), shot)
    form.append('permissions[]', 'read("any")')
    const file = await call(`/storage/buckets/${bucket}/files`, { method: 'POST', body: form })
    data.imageFileId = file.$id
  }

  await call(docPath, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { data: JSON.stringify(data) } }) })
  console.log(`synced ${data.title}${shot ? ` (new image ${data.imageFileId})` : ''}`)
}
