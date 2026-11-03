import Link from 'next/link'
import type { Metadata } from 'next'
import { formatPostDate } from '../../../components/post-body'
import { getPublicPosts, getPublicSite } from '../../lib/public-content'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSite()
  return { title: `Blog — ${site.brand}`, description: `Writing by ${site.brand}.` }
}

export default async function BlogPage() {
  const posts = await getPublicPosts()
  return <main className="site min-h-screen text-fg">
    <nav aria-label="Blog navigation" className="max-w-3xl mx-auto px-6 pt-8">
      <Link href="/" className="text-sm text-muted hover:text-fg">← Back to portfolio</Link>
    </nav>
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint mb-6">Blog</p>
      <h1 className="text-4xl md:text-6xl tracking-tight font-medium">Notes &amp; <span className="font-serif italic text-accent">writing</span>.</h1>
      {posts.length ? (
        <ul className="mt-16 border-t border-line">
          {posts.map((post) => (
            <li key={post.$id} className="border-b border-line">
              <Link href={`/blog/${post.slug}`} className="group block py-8 md:py-10">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                  {!!post.tags?.length && <> · {post.tags.join(' · ')}</>}
                </p>
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight mt-3 transition-colors duration-200 group-hover:text-accent">{post.title}</h2>
                {post.excerpt && <p className="text-muted leading-relaxed mt-3">{post.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="mt-16 text-muted">No posts yet — check back soon.</p>}
    </div>
  </main>
}
