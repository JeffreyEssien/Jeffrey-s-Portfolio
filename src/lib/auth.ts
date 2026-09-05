import { account, isAppwriteConfigured } from './appwrite'

export async function login(email: string, password: string) {
  await account.createEmailPasswordSession(email, password)
}

export async function adminRequestHeaders(): Promise<Record<string, string>> {
  const { jwt } = await account.createJWT()
  return { 'X-Appwrite-JWT': jwt }
}

export async function logout() {
  try {
    await account.deleteSession('current')
  } catch {
    // already logged out
  }
}

export async function currentUser() {
  if (!isAppwriteConfigured()) return null
  try {
    return await account.get()
  } catch {
    return null
  }
}
