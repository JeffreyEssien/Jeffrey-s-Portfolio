import type { Project } from './content'

export function externalUrl(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const normalized = trimmed.startsWith('//') ? `https:${trimmed}`
    : /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(normalized)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''
  } catch { return '' }
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || a.order - b.order)
}

export function validateProject(project: Project): string | null {
  if (!project.title.trim()) return 'Add a project title before publishing.'
  if (!project.description.trim()) return 'Add a short description before publishing.'
  if (project.link.trim() && !externalUrl(project.link)) return 'Enter a valid HTTP or HTTPS live-site URL.'
  if (project.sourceUrl?.trim() && !externalUrl(project.sourceUrl)) return 'Enter a valid HTTP or HTTPS source-code URL.'
  if (!Number.isFinite(project.order)) return 'Project order must be a number.'
  return null
}
