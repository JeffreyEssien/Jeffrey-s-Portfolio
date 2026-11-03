import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Post } from '../src/lib/content'
import { publicAssetUrl } from '../src/lib/public-content'

const label = 'font-mono text-xs uppercase tracking-[0.2em] text-faint'

// Raw HTML in post bodies is dropped (skipHtml), so posts can't inject markup.
// `node` is react-markdown's AST node; keep it off the DOM.
const components: Components = {
  h2: ({ node: _node, ...props }) => <h2 className="text-2xl md:text-3xl font-medium tracking-tight mt-16 mb-6" {...props} />,
  h3: ({ node: _node, ...props }) => <h3 className="text-xl font-medium tracking-tight mt-12 mb-4" {...props} />,
  p: ({ node: _node, ...props }) => <p className="text-muted leading-relaxed my-6" {...props} />,
  a: ({ node: _node, ...props }) => <a className="text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="list-disc pl-6 my-6 space-y-2 text-muted marker:text-faint" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="list-decimal pl-6 my-6 space-y-2 text-muted marker:text-faint" {...props} />,
  blockquote: ({ node: _node, ...props }) => <blockquote className="border-l-2 border-accent pl-6 my-8 text-fg italic" {...props} />,
  pre: ({ node: _node, ...props }) => <pre className="my-8 overflow-x-auto rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed" {...props} />,
  code: ({ node: _node, className, ...props }) => <code className={className || 'font-mono text-[0.9em] rounded bg-surface border border-line px-1.5 py-0.5 text-fg'} {...props} />,
  hr: () => <hr className="my-16 border-line" />,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  img: ({ node: _node, ...props }) => <img className="w-full h-auto rounded-2xl border border-line my-10" {...props} />,
  table: ({ node: _node, ...props }) => <div className="my-8 overflow-x-auto"><table className="w-full text-sm border-collapse" {...props} /></div>,
  th: ({ node: _node, ...props }) => <th className="border-b border-line py-2 pr-4 text-left font-medium" {...props} />,
  td: ({ node: _node, ...props }) => <td className="border-b border-line py-2 pr-4 text-muted" {...props} />,
}

export function formatPostDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function PostBody({ post, coverUrl }: { post: Post; coverUrl?: string }) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 md:py-24 text-fg">
      <p className={`${label} mb-6`}>
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        {!!post.tags?.length && <> · {post.tags.join(' · ')}</>}
      </p>
      <h1 className="text-4xl md:text-5xl tracking-tight font-medium break-words">{post.title || 'Untitled post'}</h1>
      {post.excerpt && <p className="text-lg md:text-xl text-muted leading-relaxed mt-8">{post.excerpt}</p>}
      {(coverUrl || post.coverFileId) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl || publicAssetUrl(post.coverFileId)} alt="" className="w-full h-auto rounded-2xl border border-line mt-12" />
      )}
      <div className="mt-12 break-words">
        <Markdown remarkPlugins={[remarkGfm]} components={components} skipHtml>{post.body}</Markdown>
      </div>
    </article>
  )
}
