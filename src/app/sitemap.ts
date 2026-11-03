import type { MetadataRoute } from 'next'
import { getPublicPosts, getPublicProjects } from '../lib/public-content'
import { siteUrl } from '../lib/site-url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const [projects, posts] = await Promise.all([getPublicProjects(), getPublicPosts()])
  return [
    { url: new URL('/', base).toString(), changeFrequency: 'weekly', priority: 1 },
    ...projects.map((p) => ({ url: new URL(`/projects/${p.$id}`, base).toString(), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: new URL('/blog', base).toString(), changeFrequency: 'weekly', priority: 0.8 },
    ...posts.map((p) => ({ url: new URL(`/blog/${p.slug}`, base).toString(), lastModified: p.date, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ]
}
