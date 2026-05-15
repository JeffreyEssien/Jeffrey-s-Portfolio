#!/usr/bin/env node
import { Client, Databases, Storage, Users, ID, Permission, Role } from 'node-appwrite'

const {
  APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env

for (const [k, v] of Object.entries({ APPWRITE_PROJECT_ID, APPWRITE_API_KEY })) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1) }
}

const DB_ID = 'portfolio'
const BUCKET_ID = 'assets'
const COLLECTIONS = ['site', 'hero', 'about', 'projects', 'work', 'contact', 'cv', 'jobs', 'job_actions', 'job_profile']

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY)
const databases = new Databases(client)
const storage = new Storage(client)
const users = new Users(client)

const log = (...a) => console.log('•', ...a)
const swallow409 = async (label, fn) => {
  try { await fn(); log(`created ${label}`) }
  catch (e) {
    if (e.code === 409) log(`exists ${label}`)
    else throw e
  }
}

async function main() {
  try {
    await databases.get(DB_ID)
    log(`exists database ${DB_ID}`)
  } catch (e) {
    if (e.code === 404) {
      await databases.create(DB_ID, 'Portfolio')
      log(`created database ${DB_ID}`)
    } else throw e
  }

  const collectionPerms = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ]

  for (const cid of COLLECTIONS) {
    await swallow409(`collection ${cid}`, () =>
      databases.createCollection(DB_ID, cid, cid, collectionPerms, false))
    await swallow409(`attribute ${cid}.data`, () =>
      databases.createStringAttribute(DB_ID, cid, 'data', 100000, true))
  }

  // wait a sec for attributes to be available
  await new Promise((r) => setTimeout(r, 3000))

  // seed singletons
  for (const cid of ['site', 'hero', 'about', 'contact', 'cv', 'job_profile']) {
    await swallow409(`doc ${cid}/main`, () =>
      databases.createDocument(DB_ID, cid, 'main', { data: '{}' }))
  }

  try {
    await storage.getBucket(BUCKET_ID)
    log(`exists bucket ${BUCKET_ID}`)
  } catch (e) {
    if (e.code === 404) {
      await storage.createBucket(
        BUCKET_ID,
        'Assets',
        [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
        false,
        true,
        10 * 1024 * 1024,
        ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'],
      )
      log(`created bucket ${BUCKET_ID}`)
    } else throw e
  }

  // admin user (only if creds provided)
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    try {
      await users.create(ID.unique(), ADMIN_EMAIL, undefined, ADMIN_PASSWORD)
      log(`created admin user ${ADMIN_EMAIL}`)
    } catch (e) {
      if (e.code === 409) log(`admin user exists ${ADMIN_EMAIL}`)
      else throw e
    }
  } else {
    log('skipped admin user (ADMIN_EMAIL/ADMIN_PASSWORD not set)')
  }

  console.log('\n✅ Appwrite setup complete')
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
