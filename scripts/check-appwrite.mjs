// Read the public projects collection directly: no API key or database writes.
// This checks availability; API traffic is not guaranteed to prevent free-plan pausing.
const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'portfolio'
const collectionId = process.env.APPWRITE_PROJECTS_COLLECTION_ID || process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS || 'projects'

async function main() {
  if (!endpoint || !projectId) {
    throw new Error('Set APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID in GitHub repository Actions variables.')
  }
  const url = new URL(`${endpoint.replace(/\/$/, '')}/databases/${encodeURIComponent(databaseId)}/collections/${encodeURIComponent(collectionId)}/documents`)
  if (url.protocol !== 'https:') throw new Error('APPWRITE_ENDPOINT must use HTTPS.')
  url.searchParams.append('queries[]', JSON.stringify({ method: 'limit', values: [1] }))

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'X-Appwrite-Project': projectId, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      })
      if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        const type = typeof details.type === 'string' ? ` (${details.type})` : ''
        throw new Error(`Appwrite returned HTTP ${response.status}${type}. Check project status and public read permissions in the Console.`)
      }
      const result = await response.json()
      if (!Array.isArray(result.documents) || typeof result.total !== 'number') {
        throw new Error('Appwrite did not return a valid document list.')
      }
      console.log(`Database check passed at ${new Date().toISOString()}: projects collection accessible (${result.total} documents).`)
      return
    } catch (error) {
      console.error(`Attempt ${attempt}/3: ${error.message}`)
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

main().catch((error) => {
  console.error(`Database check failed: ${error.message}`)
  process.exitCode = 1
})
