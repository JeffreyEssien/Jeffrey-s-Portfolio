import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function fixture(t, complete = true) {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-snapshot-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'scripts'))
  mkdirSync(join(root, 'src/lib'), { recursive: true })
  mkdirSync(join(root, 'public'))
  copyFileSync(new URL('../../scripts/publish-content.mjs', import.meta.url), join(root, 'scripts/publish-content.mjs'))
  const snapshot = JSON.stringify({ publishedAt: '2026-01-01T00:00:00Z', projects: [{ title: 'Keep me' }], assets: { image: '/image.png' } })
  writeFileSync(join(root, 'src/lib/published-content.json'), snapshot)
  if (complete) writeFileSync(join(root, 'public/image.png'), 'test-image')
  return { root, snapshot }
}

function run(root, optional) {
  return spawnSync(process.execPath, [join(root, 'scripts/publish-content.mjs'), ...(optional ? ['--optional'] : [])], {
    encoding: 'utf8',
    env: { ...process.env, NEXT_PUBLIC_APPWRITE_ENDPOINT: 'http://invalid.test/v1', NEXT_PUBLIC_APPWRITE_PROJECT_ID: 'test' },
  })
}

test('a failed manual snapshot refresh preserves the previous content', (t) => {
  const { root, snapshot } = fixture(t)
  assert.equal(run(root, false).status, 1)
  assert.equal(readFileSync(join(root, 'src/lib/published-content.json'), 'utf8'), snapshot)
})

test('builds can retain a complete snapshot when Appwrite is unavailable', (t) => {
  const { root, snapshot } = fixture(t)
  assert.equal(run(root, true).status, 0)
  assert.equal(readFileSync(join(root, 'src/lib/published-content.json'), 'utf8'), snapshot)
})

test('builds fail if a fallback snapshot references missing assets', (t) => {
  const { root } = fixture(t, false)
  assert.equal(run(root, true).status, 1)
})
