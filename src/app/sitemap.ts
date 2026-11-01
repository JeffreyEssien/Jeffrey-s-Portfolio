import type { MetadataRoute } from 'next'
import { getPublicProjects } from '../lib/public-content'
import { siteUrl } from '../lib/site-url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const projects = await getPublicProjects()
  return [
    { url: new URL('/', base).toString(), changeFrequency: 'weekly', priority: 1 },
    ...projects.map((p) => ({ url: new URL(`/projects/${p.$id}`, base).toString(), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ]
}
