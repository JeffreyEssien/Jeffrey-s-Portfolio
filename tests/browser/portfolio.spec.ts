import { expect, test, type Page } from '@playwright/test'
import snapshot from '../../src/lib/published-content.json'

async function mockAdmin(page: Page) {
  const documents: Array<{ $id: string; data: string }> = []
  const writes: Record<string, unknown>[] = []
  await page.route('https://appwrite.invalid/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const headers = { 'access-control-allow-origin': 'http://127.0.0.1:3100', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    let body: unknown
    if (path.endsWith('/account')) body = { $id: 'owner', email: 'owner@example.test', status: true }
    else if (path.endsWith('/collections/projects/documents')) {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON()
        writes.push(JSON.parse(payload.data.data))
        const doc = { $id: 'test-project', data: payload.data.data }
        documents.push(doc)
        body = doc
      } else body = { total: documents.length, documents }
    } else body = { $id: 'main', data: '{}' }
    await route.fulfill({ status: 200, headers, json: body })
  })
  return writes
}

test('published content and local assets survive an Appwrite outage', async ({ page, request }) => {
  await page.route('https://appwrite.invalid/**', (route) => route.abort())
  await page.goto('/')
  for (const project of snapshot.projects) await expect(page.getByRole('heading', { name: project.title, exact: true })).toBeVisible()
  await page.waitForTimeout(5500)
  for (const project of snapshot.projects) await expect(page.getByRole('heading', { name: project.title, exact: true })).toBeVisible()
  for (const asset of Object.values(snapshot.assets)) expect((await request.get(asset)).ok()).toBeTruthy()
  const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((element) => element.id))
  expect(new Set(ids).size).toBe(ids.length)
})

test('mobile navigation expands, closes on Escape, and follows section links', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.route('https://appwrite.invalid/**', (route) => route.abort())
  await page.goto('/')
  const menu = page.getByRole('button', { name: 'Menu', exact: true })
  await expect(menu).toBeVisible()
  await menu.click()
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
  await page.screenshot({ path: 'test-results/mobile-menu.png' })
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await menu.click()
  await page.locator('#public-navigation a[href="#projects"]').click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(page).toHaveURL(/#projects$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
})

test('a new draft survives reload and only reaches Appwrite when published', async ({ page }) => {
  const writes = await mockAdmin(page)
  await page.goto('/admin/projects')
  await page.getByRole('button', { name: '+ Draft a project' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Offline-first task board')
  await page.getByLabel('Short description').fill('A task board that works without a connection.')
  await page.getByLabel('Live-site URL').fill('example.test')
  await page.getByLabel('Source-code URL').fill('https://github.com/example/tasks')
  await page.getByLabel('Technologies').fill('React,TypeScript')
  await page.getByText('Case study details', { exact: true }).click()
  await page.getByLabel('The challenge').fill('Keep tasks available when connectivity drops.')
  await page.getByLabel('Your role', { exact: true }).fill('Design and implementation')
  await page.getByLabel('Your approach').fill('Used local storage and background synchronization.')
  await page.getByLabel('Results and lessons').fill('Tasks remain accessible offline.')
  await page.reload()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Offline-first task board')
  expect(writes).toHaveLength(0)
  await page.getByRole('button', { name: 'Preview case study' }).click()
  await expect(page.getByRole('heading', { name: 'Offline-first task board' })).toBeVisible()
  await page.screenshot({ path: 'test-results/project-preview.png', fullPage: true })
  await page.getByRole('button', { name: 'Publish project', exact: true }).click()
  await expect(page.getByText('1 published · 0 drafts')).toBeVisible()
  expect(writes).toHaveLength(1)
  expect(writes[0]).toMatchObject({ link: 'https://example.test/', role: 'Design and implementation', problem: 'Keep tasks available when connectivity drops.' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Learn more about Offline-first task board', exact: true }).click()
  const details = page.getByRole('dialog', { name: 'Offline-first task board', exact: true })
  await expect(details).toBeVisible()
  for (const text of ['Design and implementation', 'React', 'TypeScript', 'Keep tasks available when connectivity drops.', 'Used local storage and background synchronization.', 'Tasks remain accessible offline.']) await expect(details.getByText(text, { exact: true })).toBeVisible()
  await expect(details.getByRole('link', { name: 'View source code' })).toHaveAttribute('href', 'https://github.com/example/tasks')
})

for (const mobile of [false, true]) {
  test(`project details modal opens and restores focus on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 375, height: 812 })
    await page.route('https://appwrite.invalid/**', (route) => route.abort())
    await page.goto('/')
    const project = snapshot.projects[0]
    const trigger = page.getByRole('button', { name: `Learn more about ${project.title}`, exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: project.title, exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Close project details' })).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    const bounds = await dialog.boundingBox()
    expect(bounds!.width).toBeLessThanOrEqual(mobile ? 375 : 1280)
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('link', { name: 'Open full project page' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    await trigger.click()
    await dialog.getByRole('button', { name: 'Close project details' }).click()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.screenshot({ path: `test-results/project-modal-${mobile ? 'mobile' : 'desktop'}.png` })
    await page.mouse.click(2, 2)
    await expect(dialog).not.toBeVisible()
  })
}

test('empty projects cannot be published', async ({ page }) => {
  const writes = await mockAdmin(page)
  await page.goto('/admin/projects')
  await page.getByRole('button', { name: '+ Draft a project' }).click()
  await page.getByRole('button', { name: 'Publish project', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Add a project title' })).toHaveText('Add a project title before publishing.')
  expect(writes).toHaveLength(0)
})

test('case-study routes use the snapshot during an outage and missing projects return 404', async ({ page, request }) => {
  const project = snapshot.projects[0]
  await page.goto(`/projects/${project.$id}`)
  await expect(page.getByRole('heading', { name: project.title, exact: true })).toBeVisible()
  await expect(page).toHaveTitle(new RegExp(project.title))
  expect((await request.get('/projects/does-not-exist')).status()).toBe(404)
})

test('anonymous callers cannot refresh jobs or fetch previews, even with same-origin headers', async ({ request }) => {
  const refresh = await request.post('/api/jobs/refresh', { headers: { Origin: 'http://127.0.0.1:3100' } })
  expect(refresh.status()).toBe(401)
  expect((await request.get('/api/og-preview?url=https://example.com')).status()).toBe(401)
})
