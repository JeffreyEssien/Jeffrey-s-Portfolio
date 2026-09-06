import test from 'node:test'
import assert from 'node:assert/strict'
import { externalUrl, sortProjects, validateProject } from '../../src/lib/project-utils.ts'

const project = { title: 'Task board', description: 'An offline task board', link: 'example.com', imageFileId: '', order: 0 }

test('external links normalize domains and reject executable URLs and embedded credentials', () => {
  assert.equal(externalUrl('example.com/demo'), 'https://example.com/demo')
  assert.equal(externalUrl('//example.com'), 'https://example.com/')
  for (const value of ['', 'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'https://user:password@example.com', 'https://']) assert.equal(externalUrl(value), '')
})

test('legacy projects remain publishable without the optional case-study fields', () => {
  assert.equal(validateProject(project), null)
  assert.equal(validateProject({ ...project, link: '' }), null)
})

test('publishing rejects empty content, invalid source links, and invalid ordering', () => {
  assert.match(validateProject({ ...project, title: ' ' }), /title/)
  assert.match(validateProject({ ...project, description: '' }), /description/)
  assert.match(validateProject({ ...project, sourceUrl: 'javascript:alert(1)' }), /source-code/)
  assert.match(validateProject({ ...project, order: NaN }), /order/)
})

test('featured projects sort first without mutating the fetched collection', () => {
  const projects = [{ ...project, title: 'Later', order: 5 }, { ...project, title: 'Featured', featured: true, order: 9 }, { ...project, title: 'Earlier', order: 1 }]
  assert.deepEqual(sortProjects(projects).map((p) => p.title), ['Featured', 'Earlier', 'Later'])
  assert.equal(projects[0].title, 'Later')
})
