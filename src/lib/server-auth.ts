import { Account, Client } from 'node-appwrite'
import { APPWRITE_CONFIG } from './appwrite'

// Browser sessions belong to the Appwrite origin. Send a short-lived JWT instead
// of treating an Origin header as authentication on our own API routes.
export async function isAuthenticatedAdmin(request: Request): Promise<boolean> {
  const jwt = request.headers.get('x-appwrite-jwt')
  if (!jwt || jwt.length > 8192) return false
  try {
    const client = new Client().setEndpoint(APPWRITE_CONFIG.endpoint).setProject(APPWRITE_CONFIG.projectId).setJWT(jwt)
    const user = await new Account(client).get()
    const owner = process.env.APPWRITE_ADMIN_USER_ID
    return user.status && (!owner || user.$id === owner)
  } catch { return false }
}
