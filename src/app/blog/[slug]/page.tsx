import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PostBody from '../../../../components/post-body'
import { getPublicPosts, getPublicSite } from '../../../lib/public-content'

export const dynamic = 'force-dynamic'

const findPost = cache(async (slug: string) => (await getPublicPosts()).find((post) => post.slug === slug))
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findPost((await params).slug)
  if (!post) return { title: 'Post not found', robots: { index: false } }
  const site = await getPublicSite()
  const url = `/blog/${post.slug}`
  return {
    title: `${post.title} — ${site.brand}`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.date, url },
    twitter: { card: 'summary', title: post.title, description: post.excerpt },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await findPost((await params).slug)
  if (!post) notFound()
  return <main className="site min-h-screen">
    <nav aria-label="Post navigation" className="max-w-3xl mx-auto px-6 pt-8">
      <Link href="/blog" className="text-sm text-muted hover:text-fg">← All posts</Link>
    </nav>
    <PostBody post={post} />
  </main>
}
