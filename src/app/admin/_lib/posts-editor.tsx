'use client'

import { useEffect, useRef, useState } from 'react'
import PostBody, { formatPostDate } from '../../../../components/post-body'
import { fileUrl } from '../../../lib/appwrite'
import { createPost, deleteFile, deletePost, getPosts, updatePost, uploadFile, type Post } from '../../../lib/content'
import { inputCls } from './forms'

const today = () => new Date().toISOString().slice(0, 10)
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const blank = (): Post => ({ title: '', slug: '', excerpt: '', body: '', coverFileId: '', date: today(), tags: [], draft: true })

function validatePost(post: Post, others: Post[]): string | null {
  if (!post.title.trim()) return 'Give your post a title first.'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) return 'The URL can only use lowercase letters, numbers, and hyphens.'
  if (others.some((p) => p.$id !== post.$id && p.slug === post.slug)) return 'Another post already uses this URL.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) return 'Pick a publish date.'
  return null
}

type Filter = 'all' | 'live' | 'drafts'

export function PostsEditor() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const reload = async () => { setPosts(await getPosts()); setLoaded(true) }
  useEffect(() => { reload() }, [])

  if (editing) return <PostEditor post={editing} others={posts} onClose={() => { setEditing(null); reload() }} onSaved={reload} />

  const live = posts.filter((p) => !p.draft)
  const drafts = posts.filter((p) => p.draft)
  const shown = filter === 'live' ? live : filter === 'drafts' ? drafts : posts
  const tabs: [Filter, string, number][] = [['all', 'All', posts.length], ['live', 'Live', live.length], ['drafts', 'Drafts', drafts.length]]

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-neutral-200">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="text-sm text-neutral-500 mt-1">Write and publish posts. Drafts are only visible here.</p>
      </div>
      <button onClick={() => setEditing(blank())} className="px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors duration-200">+ New post</button>
    </div>

    {posts.length > 0 && <div role="tablist" aria-label="Filter posts" className="inline-flex gap-1 p-1 mb-6 rounded-lg bg-neutral-100">
      {tabs.map(([key, label, count]) => (
        <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors duration-200 ${filter === key ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}>
          {label} <span className="text-neutral-400">{count}</span>
        </button>
      ))}
    </div>}

    {!loaded ? <p className="text-sm text-neutral-500">Loading posts…</p>
      : !posts.length ? (
        <div className="text-center border border-dashed border-neutral-300 rounded-xl px-6 py-16">
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-neutral-500 mt-1 mb-6">Your first post is one click away. You can save it as a draft and finish it later.</p>
          <button onClick={() => setEditing(blank())} className="px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700">Write your first post</button>
        </div>
      ) : !shown.length ? <p className="text-sm text-neutral-500 py-8 text-center">Nothing here.</p>
      : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
          {shown.map((post) => (
            <li key={post.$id}>
              <button onClick={() => setEditing(post)} className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-neutral-50 transition-colors duration-200">
                {post.coverFileId
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={fileUrl(post.coverFileId)} alt="" className="hidden sm:block w-20 aspect-[4/3] object-cover rounded-md border border-neutral-200 shrink-0" />
                  : <span aria-hidden className="hidden sm:block w-20 aspect-[4/3] rounded-md bg-neutral-100 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium truncate">{post.title || 'Untitled post'}</span>
                  <span className="block text-sm text-neutral-500 truncate mt-0.5">{post.excerpt || 'No excerpt'}</span>
                </span>
                <span className="shrink-0 text-right">
                  <StatusBadge draft={!!post.draft} />
                  <span className="block text-xs text-neutral-500 mt-1.5">{formatPostDate(post.date)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
  </div>
}

function StatusBadge({ draft, dirty }: { draft: boolean; dirty?: boolean }) {
  if (dirty) return <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Unsaved</span>
  return draft
    ? <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">Draft</span>
    : <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Live</span>
}

function PostEditor({ post, others, onClose, onSaved }: {
  post: Post
  others: Post[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [value, setValue] = useState(post)
  const [baseline, setBaseline] = useState(post)
  const [slugTouched, setSlugTouched] = useState(!!post.slug)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeCover, setRemoveCover] = useState(false)
  const body = useRef<HTMLTextAreaElement>(null)
  const dirty = !!image || removeCover || JSON.stringify(value) !== JSON.stringify(baseline)
  const isLive = !!value.$id && !baseline.draft
  const coverSrc = imagePreview || (!removeCover && value.coverFileId ? fileUrl(value.coverFileId) : '')
  const words = value.body.trim() ? value.body.trim().split(/\s+/).length : 0

  const update = (patch: Partial<Post>) => { setValue((v) => ({ ...v, ...patch })); setMessage(''); setError('') }
  const setTitle = (title: string) => update(slugTouched ? { title } : { title, slug: slugify(title) })

  useEffect(() => {
    if (!image) { setImagePreview(''); return }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const chooseImage = (file: File | null) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a PNG, JPEG, WebP, GIF, or SVG image no larger than 10 MB.'); return
    }
    setImage(file); setRemoveCover(false); setError(''); setMessage('')
  }

  const save = async (draft: boolean) => {
    const next = { ...value, draft, title: value.title.trim(), slug: value.slug || slugify(value.title), excerpt: value.excerpt.trim(), tags: (value.tags || []).map((t) => t.trim()).filter(Boolean) }
    const validation = validatePost(next, others)
    if (validation) { setError(validation); return }
    setBusy(true); setError(''); setMessage('')
    let newImage = ''
    let persisted = false
    try {
      if (image) newImage = await uploadFile(image)
      const { $id, ...data } = next
      const cleaned = { ...data, coverFileId: newImage || (removeCover ? '' : data.coverFileId) }
      const id = $id ? (await updatePost($id, cleaned), $id) : (await createPost(cleaned)).$id
      persisted = true
      if ((newImage || removeCover) && value.coverFileId) await deleteFile(value.coverFileId)
      const saved = { ...cleaned, $id: id }
      setValue(saved); setBaseline(saved); setImage(null); setRemoveCover(false); setSlugTouched(true)
      setMessage(draft ? (isLive ? 'Unpublished — now a draft' : 'Draft saved') : isLive ? 'Changes are live' : 'Published')
      await onSaved()
    } catch (err) {
      if (newImage && !persisted) await deleteFile(newImage)
      setError((err as Error).message || 'Could not save. Your edits are still here.')
    } finally { setBusy(false) }
  }

  // Cmd/Ctrl+S saves without changing whether the post is live.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') { event.preventDefault(); saveRef.current(!isLive) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isLive])

  const close = () => {
    if (dirty && !confirm('Leave without saving? Your changes will be lost.')) return
    onClose()
  }

  const remove = async () => {
    if (!value.$id || !confirm(`Delete "${value.title || 'Untitled post'}"? This can't be undone.`)) return
    setBusy(true); setError('')
    try {
      await deletePost(value.$id)
      if (value.coverFileId) await deleteFile(value.coverFileId)
      onClose()
    } catch (err) { setError((err as Error).message); setBusy(false) }
  }

  // Wraps the selection (or a placeholder) in Markdown, or prefixes each selected line.
  const format = (before: string, after = '', placeholder = '', linePrefix = false) => {
    const el = body.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end, value: text } = el
    const selected = text.slice(start, end) || placeholder
    const insert = linePrefix ? selected.split('\n').map((line) => before + line).join('\n') : before + selected + after
    const next = text.slice(0, start) + insert + text.slice(end)
    update({ body: next })
    requestAnimationFrame(() => {
      el.focus()
      const selStart = linePrefix ? start : start + before.length
      el.setSelectionRange(selStart, selStart + (linePrefix ? insert.length : selected.length))
    })
  }
  const tools: [string, string, () => void][] = [
    ['H', 'Heading', () => format('## ', '', 'Heading', true)],
    ['B', 'Bold', () => format('**', '**', 'bold text')],
    ['I', 'Italic', () => format('_', '_', 'italic text')],
    ['Link', 'Link', () => format('[', '](https://)', 'link text')],
    ['• List', 'Bulleted list', () => format('- ', '', 'List item', true)],
    ['1. List', 'Numbered list', () => format('1. ', '', 'List item', true)],
    ['Quote', 'Quote', () => format('> ', '', 'Quote', true)],
    ['Code', 'Code block', () => format('```\n', '\n```', 'code')],
  ]

  const primaryLabel = busy ? 'Saving…' : isLive ? 'Update' : 'Publish'
  const sideLabel = 'block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2'

  return <div>
    <div className="sticky top-14 md:top-0 z-20 -mx-4 sm:-mx-6 md:-mx-10 -mt-6 md:-mt-12 mb-8 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-sm border-b border-neutral-200 flex flex-wrap items-center gap-3">
      <button onClick={close} className="text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1.5 -ml-2 rounded-md hover:bg-neutral-100">← All posts</button>
      <StatusBadge draft={!isLive} dirty={dirty} />
      <p role="status" aria-live="polite" className={`text-sm truncate ${error ? 'text-red-700' : 'text-emerald-700'}`}>{error || message}</p>
      <div className="ml-auto flex items-center gap-2">
        {isLive && <a href={`/blog/${baseline.slug}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-sm text-neutral-600 hover:text-neutral-900 px-3 py-2">View ↗</a>}
        <button onClick={() => save(true)} disabled={busy} className="text-sm border border-neutral-300 px-4 py-2 rounded-lg hover:bg-neutral-50 disabled:opacity-50">{isLive ? 'Unpublish' : 'Save draft'}</button>
        <button onClick={() => save(false)} disabled={busy} className="text-sm font-medium text-white bg-neutral-900 px-4 py-2 rounded-lg hover:bg-neutral-700 disabled:opacity-50">{primaryLabel}</button>
      </div>
    </div>

    <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-10">
      <div className="min-w-0">
        <textarea aria-label="Title" rows={1} placeholder="Post title" value={value.title} onChange={(e) => setTitle(e.target.value)}
          className="w-full resize-none field-sizing-content text-3xl md:text-4xl font-semibold tracking-tight placeholder:text-neutral-300 focus:outline-none" />
        <textarea aria-label="Excerpt" rows={2} placeholder="A one or two sentence summary, shown on the blog list and in link previews." value={value.excerpt} onChange={(e) => update({ excerpt: e.target.value })}
          className="w-full resize-none field-sizing-content mt-3 text-lg text-neutral-600 placeholder:text-neutral-300 focus:outline-none" />

        <div className="mt-8 border border-neutral-200 rounded-xl overflow-hidden focus-within:border-neutral-400 transition-colors duration-200">
          <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-neutral-200 bg-neutral-50">
            <div role="tablist" aria-label="Editor mode" className="flex gap-1 mr-2">
              {(['write', 'preview'] as const).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-md text-sm capitalize ${tab === t ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}>{t}</button>
              ))}
            </div>
            {tab === 'write' && tools.map(([label, title, run]) => (
              <button key={title} type="button" title={title} aria-label={title} onClick={run}
                className={`px-2 py-1 rounded text-sm text-neutral-700 hover:bg-neutral-200 ${label === 'B' ? 'font-bold' : label === 'I' ? 'italic' : ''}`}>{label}</button>
            ))}
          </div>
          {tab === 'write'
            ? <textarea ref={body} aria-label="Post body" value={value.body} onChange={(e) => update({ body: e.target.value })}
                placeholder={'Start writing…\n\nUse the toolbar above, or Markdown: ## for headings, **bold**, - for lists.'}
                className="block w-full min-h-[60vh] p-5 font-mono text-[15px] leading-relaxed resize-y focus:outline-none placeholder:text-neutral-400" />
            : <div className="min-h-[60vh] bg-[#fafaf9]">
                {value.body.trim() || value.title.trim()
                  ? <PostBody post={value} coverUrl={coverSrc || undefined} />
                  : <p className="p-10 text-center text-sm text-neutral-500">Nothing to preview yet.</p>}
              </div>}
          <p className="px-5 py-2 border-t border-neutral-200 text-xs text-neutral-500">{words} words · {Math.max(1, Math.round(words / 200))} min read · ⌘/Ctrl+S to save</p>
        </div>
      </div>

      <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
        <div>
          <span className={sideLabel}>Cover image</span>
          {coverSrc ? <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverSrc} alt="Cover preview" className="w-full aspect-[16/9] object-cover rounded-lg border border-neutral-200" />
            <div className="flex gap-3 mt-2 text-sm">
              <label className="cursor-pointer text-neutral-700 underline underline-offset-2 hover:text-neutral-900">Replace
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => chooseImage(e.target.files?.[0] || null)} className="sr-only" />
              </label>
              <button onClick={() => { setImage(null); setRemoveCover(true) }} className="text-red-600 hover:underline underline-offset-2">Remove</button>
            </div>
          </div> : <label className="flex flex-col items-center justify-center gap-1 w-full aspect-[16/9] rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 cursor-pointer hover:border-neutral-500 hover:text-neutral-700 transition-colors duration-200">
            <span>+ Add cover image</span>
            <span className="text-xs text-neutral-400">PNG, JPG, WebP · up to 10 MB</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => chooseImage(e.target.files?.[0] || null)} className="sr-only" />
          </label>}
        </div>

        <label className="block">
          <span className={sideLabel}>Publish date</span>
          <input type="date" className={inputCls} value={value.date} onChange={(e) => update({ date: e.target.value })} />
        </label>

        <label className="block">
          <span className={sideLabel}>Tags</span>
          <input className={inputCls} placeholder="e.g. React, Career" value={(value.tags || []).join(',')} onChange={(e) => update({ tags: e.target.value.split(',') })} />
          <span className="block text-xs text-neutral-500 mt-1">Separate with commas.</span>
        </label>

        <label className="block">
          <span className={sideLabel}>URL</span>
          <span className="flex items-center rounded-lg border border-neutral-300 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10 overflow-hidden">
            <span className="pl-3 text-sm text-neutral-400">/blog/</span>
            <input className="min-w-0 flex-1 py-2 pr-3 text-sm focus:outline-none" value={value.slug} placeholder="post-url"
              onChange={(e) => { setSlugTouched(true); update({ slug: slugify(e.target.value) }) }} />
          </span>
          <span className="block text-xs text-neutral-500 mt-1">{isLive ? 'Changing this breaks links people already shared.' : 'Filled in from the title automatically.'}</span>
        </label>

        {value.$id && <div className="pt-6 border-t border-neutral-200">
          <button onClick={remove} disabled={busy} className="text-sm text-red-600 hover:underline underline-offset-2 disabled:opacity-50">Delete post</button>
        </div>}
      </aside>
    </div>
  </div>
}
