import { mkdir, writeFile, rename, readFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Only public portfolio content belongs in this snapshot. Never export CV drafts,
// job profiles, application notes, account data, or API keys.
const root = fileURLToPath(new URL('../', import.meta.url))
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.replace(/\/$/, '')
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const database = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'portfolio'
const bucket = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'assets'
const collection = (name) => process.env[`NEXT_PUBLIC_APPWRITE_COLLECTION_${name.toUpperCase()}`] || name
const fields = {
  site: ['brand', 'navHome', 'navAbout', 'navWork', 'navProjects', 'navContact', 'metaTitle', 'metaDescription', 'footerCopyright', 'footerTagline', 'workEyebrow', 'workHeadlinePrefix', 'workHeadlineAccent', 'workHeadlineSuffix', 'workEmpty', 'projectsEyebrow', 'projectsHeadlinePrefix', 'projectsHeadlineAccent', 'projectsHeadlineSuffix', 'projectsEmpty'],
  hero: ['availabilityLabel', 'greeting', 'name', 'subheadline', 'taglines', 'ctaPrimary', 'ctaSecondary'],
  about: ['eyebrow', 'headlinePrefix', 'headlineAccent', 'headlineSuffix', 'extraHeading', 'extraParagraph', 'educationLabel', 'educationDegree', 'educationSchool', 'educationPeriod', 'certificationsLabel', 'certifications', 'skillsLabel', 'skills', 'stackLabel', 'technologies'],
  contact: ['eyebrow', 'headlinePrefix', 'headlineAccent', 'headlineSuffix', 'body', 'ctaEmailLabel', 'ctaCvLabel', 'emailLinkLabel', 'email', 'ctaSubject', 'cvFileId'],
  projects: ['title', 'description', 'link', 'imageFileId', 'order', 'sourceUrl', 'technologies', 'role', 'problem', 'solution', 'results', 'featured'],
  work: ['role', 'company', 'period', 'location', 'description', 'order'],
}

async function request(path) {
  const response = await fetch(`${endpoint}${path}`, {
    headers: { 'X-Appwrite-Project': project },
    signal: AbortSignal.timeout(20000),
    redirect: 'error',
  })
  if (!response.ok) throw new Error(`Snapshot request failed: HTTP ${response.status}. Previous snapshot was not replaced.`)
  return response
}

function decode(doc, name) {
  const value = JSON.parse(doc.data)
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${name} content`)
  return Object.fromEntries(fields[name].filter((key) => key in value).map((key) => [key, value[key]]))
}

async function list(name) {
  const items = []
  let cursor
  do {
    const query = new URLSearchParams()
    query.append('queries[]', JSON.stringify({ method: 'limit', values: [100] }))
    query.append('queries[]', JSON.stringify({ method: 'orderAsc', attribute: '$id' }))
    if (cursor) query.append('queries[]', JSON.stringify({ method: 'cursorAfter', values: [cursor] }))
    const response = await request(`/databases/${encodeURIComponent(database)}/collections/${encodeURIComponent(collection(name))}/documents?${query}`)
    const page = await response.json()
    if (!Array.isArray(page.documents)) throw new Error(`Invalid ${name} document list`)
    items.push(...page.documents.map((doc) => ({ ...decode(doc, name), $id: doc.$id })))
    cursor = page.documents.length === 100 ? page.documents.at(-1).$id : undefined
  } while (cursor)
  return items.sort((a, b) => (a.order || 0) - (b.order || 0))
}

async function main() {
  if (!endpoint || !project) throw new Error('Missing public Appwrite endpoint or project ID')
  if (new URL(endpoint).protocol !== 'https:') throw new Error('Appwrite endpoint must use HTTPS')
  const snapshot = { publishedAt: new Date().toISOString(), assets: {} }
  await Promise.all(['site', 'hero', 'about', 'contact'].map(async (name) => {
    const response = await request(`/databases/${encodeURIComponent(database)}/collections/${encodeURIComponent(collection(name))}/documents/main`)
    snapshot[name] = decode(await response.json(), name)
  }))
  ;[snapshot.projects, snapshot.work] = await Promise.all([list('projects'), list('work')])
  const files = new Set([...snapshot.projects.map((p) => p.imageFileId), snapshot.contact.cvFileId].filter(Boolean))
  const assets = []
  for (const id of files) {
    const response = await request(`/storage/buckets/${encodeURIComponent(bucket)}/files/${encodeURIComponent(id)}/view`)
    const mime = response.headers.get('content-type')?.split(';')[0]
    const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf' }
    if (!extensions[mime]) throw new Error(`Unsupported public asset type: ${mime}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > 10 * 1024 * 1024) throw new Error('Public asset exceeds 10 MB')
    const name = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.${extensions[mime]}`
    snapshot.assets[id] = `/published-assets/${name}`
    assets.push({ name, bytes })
  }
  // Fetch everything successfully before writing. Content-addressed filenames
  // keep the previous snapshot valid if a subsequent write fails.
  await mkdir(`${root}public/published-assets`, { recursive: true })
  for (const asset of assets) await writeFile(`${root}public/published-assets/${asset.name}`, asset.bytes)
  const destination = `${root}src/lib/published-content.json`
  await writeFile(`${destination}.tmp`, JSON.stringify(snapshot, null, 2) + '\n')
  await rename(`${destination}.tmp`, destination)
  console.log(`Published snapshot: ${snapshot.projects.length} projects, ${snapshot.work.length} experience entries, ${assets.length} assets.`)
  console.log('Include the snapshot and public/published-assets in your next deployment. Refresh after publishing content changes.')
}

main().catch(async (error) => {
  console.error(error.message)
  if (process.argv.includes('--optional')) {
    try {
      const previous = JSON.parse(await readFile(`${root}src/lib/published-content.json`, 'utf8'))
      if (!previous.publishedAt) throw new Error('No published snapshot')
      await Promise.all(Object.values(previous.assets).map((path) => access(`${root}public${path}`)))
      console.warn(`Keeping the published snapshot from ${previous.publishedAt}.`)
      return
    } catch { console.error('No complete fallback snapshot is available.') }
  }
  process.exitCode = 1
})
