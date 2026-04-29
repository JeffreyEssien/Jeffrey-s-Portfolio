#!/usr/bin/env node
import { Client, Databases, Storage, Users, ID, Permission, Role } from 'node-appwrite'

const {
  APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env

for (const [k, v] of Object.entries({ APPWRITE_PROJECT_ID, APPWRITE_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD })) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1) }
}

const DB_ID = 'portfolio'
const BUCKET_ID = 'assets'
const COLLECTIONS = ['site', 'hero', 'about', 'projects', 'contact']

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
  await swallow409(`database ${DB_ID}`, () => databases.create(DB_ID, 'Portfolio'))

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
  for (const cid of ['site', 'hero', 'about', 'contact']) {
    await swallow409(`doc ${cid}/main`, () =>
      databases.createDocument(DB_ID, cid, 'main', { data: '{}' }))
  }

  await swallow409(`bucket ${BUCKET_ID}`, () =>
    storage.createBucket(
      BUCKET_ID,
      'Assets',
      [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
      false,
      true,
      10 * 1024 * 1024,
      ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'],
    ))

  // admin user
  try {
    await users.create(ID.unique(), ADMIN_EMAIL, undefined, ADMIN_PASSWORD)
    log(`created admin user ${ADMIN_EMAIL}`)
  } catch (e) {
    if (e.code === 409) log(`admin user exists ${ADMIN_EMAIL}`)
    else throw e
  }

  console.log('\n✅ Appwrite setup complete')
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
