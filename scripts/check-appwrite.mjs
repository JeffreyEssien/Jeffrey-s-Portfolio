// Authenticated heartbeat write: keeps the Appwrite free-plan project active and
// doubles as an availability check (a paused project returns 403 and fails the run).
// Writes are unambiguous API activity; a public read is not guaranteed to prevent pausing.
const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'portfolio'
const collectionId = process.env.APPWRITE_HEARTBEAT_COLLECTION_ID || 'heartbeat'
const documentId = 'ping'

async function appwrite(method, path, body) {
  const url = new URL(`${endpoint.replace(/\/$/, '')}${path}`)
  if (url.protocol !== 'https:') throw new Error('APPWRITE_ENDPOINT must use HTTPS.')
  const response = await fetch(url, {
    method,
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
  })
  const details = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, type: details.type, details }
}

async function heartbeat() {
  const data = { lastPing: new Date().toISOString() }
  const base = `/databases/${encodeURIComponent(databaseId)}/collections/${encodeURIComponent(collectionId)}/documents`

  // Update the single heartbeat doc; create it on first run (404 document_not_found).
  let r = await appwrite('PATCH', `${base}/${documentId}`, { data })
  if (!r.ok && r.status === 404 && r.type === 'document_not_found') {
    r = await appwrite('POST', base, { documentId, data })
  }
  if (!r.ok) {
    const type = typeof r.type === 'string' ? ` (${r.type})` : ''
    throw new Error(`Appwrite returned HTTP ${r.status}${type}. Check project status and the heartbeat collection/API key in the Console.`)
  }
  console.log(`Keep-alive write succeeded at ${data.lastPing}: ${databaseId}/${collectionId}/${documentId}.`)
}

async function main() {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error('Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID (Actions variables) and APPWRITE_API_KEY (Actions secret).')
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await heartbeat()
      return
    } catch (error) {
      console.error(`Attempt ${attempt}/3: ${error.message}`)
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

main().catch((error) => {
  console.error(`Keep-alive failed: ${error.message}`)
  process.exitCode = 1
})
