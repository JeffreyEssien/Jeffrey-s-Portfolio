'use client'

import { useEffect, useState } from 'react'
import PostBody from '../../../../components/post-body'
import { fileUrl } from '../../../lib/appwrite'
import { createPost, deleteFile, deletePost, getPosts, updatePost, uploadFile, type Post } from '../../../lib/content'
import { Field, PageHeader, inputCls } from './forms'

const today = () => new Date().toISOString().slice(0, 10)
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function validatePost(post: Post, others: Post[]): string | null {
  if (!post.title.trim()) return 'Add a title before saving.'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) return 'The URL slug can only use lowercase letters, numbers, and hyphens.'
  if (others.some((p) => p.$id !== post.$id && p.slug === post.slug)) return 'Another post already uses this URL slug.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) return 'Pick a publish date.'
  return null
}

export function PostsEditor() {
  const [posts, setPosts] = useState<Post[]>([])
  const [adding, setAdding] = useState(false)
  const reload = async () => setPosts(await getPosts())
  useEffect(() => { reload() }, [])

  return <div>
    <PageHeader title="Blog" description="Write posts in Markdown. Drafts are saved to the database but stay hidden from the public site." />
    <div className="flex justify-between items-center gap-4 mb-6">
      <p className="text-sm text-neutral-500">{posts.filter((p) => !p.draft).length} live · {posts.filter((p) => p.draft).length} drafts</p>
      <button onClick={() => setAdding(true)} disabled={adding} className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-700 disabled:opacity-50">+ New post</button>
    </div>
    <div className="space-y-6">
      {adding && <PostRow post={{ title: '', slug: '', excerpt: '', body: '', coverFileId: '', date: today(), tags: [], draft: true }} others={posts}
        onDiscard={() => setAdding(false)} onChanged={async () => { setAdding(false); await reload() }} />}
      {posts.map((post) => <PostRow key={post.$id} post={post} others={posts} onChanged={reload} />)}
      {!posts.length && !adding && <p className="text-sm text-neutral-500 p-8 text-center border border-dashed rounded-xl">Start a new post to write your first entry.</p>}
    </div>
  </div>
}

function PostRow({ post, others, onChanged, onDiscard }: {
  post: Post
  others: Post[]
  onChanged: () => Promise<void>
  onDiscard?: () => void
}) {
  const [value, setValue] = useState(post)
  const [baseline, setBaseline] = useState(post)
  const [open, setOpen] = useState(!post.$id)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const dirty = !!image || JSON.stringify(value) !== JSON.stringify(baseline)
  const update = (patch: Partial<Post>) => { setValue({ ...value, ...patch }); setMessage('') }

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
    setImage(file); setError(''); setMessage('')
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
      const cleaned = { ...data, coverFileId: newImage || data.coverFileId }
      if ($id) await updatePost($id, cleaned)
      else await createPost(cleaned)
      persisted = true
      if (newImage && value.coverFileId) await deleteFile(value.coverFileId)
      const saved = { ...cleaned, $id }
      setValue(saved); setBaseline(saved); setImage(null); setMessage(draft ? 'Saved as draft' : 'Published')
      await onChanged()
    } catch (err) {
      if (newImage && !persisted) await deleteFile(newImage)
      setError((err as Error).message || 'Could not save. Your edits are still here.')
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!confirm(`${value.$id ? 'Delete post' : 'Discard'} "${value.title || 'Untitled'}"?`)) return
    if (!value.$id) { onDiscard?.(); return }
    setBusy(true); setError('')
    try {
      await deletePost(value.$id)
      if (value.coverFileId) await deleteFile(value.coverFileId)
      await onChanged()
    } catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  const status = !value.$id ? 'New post' : dirty ? 'Unsaved changes' : value.draft ? 'Draft' : 'Live'

  return <section className="border border-neutral-200 rounded-xl bg-white">
    <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex justify-between gap-4 items-center p-5 text-left">
      <span className="min-w-0">
        <span className="block text-xs uppercase tracking-widest text-neutral-500">{status} · {value.date}</span>
        <span className="block font-medium truncate mt-1">{value.title || 'Untitled post'}</span>
      </span>
      <span className="text-neutral-400 text-sm">{open ? '−' : '+'}</span>
    </button>
    {open && <div className="px-5 pb-5">
      {error && <p role="alert" className="text-sm text-red-700 mb-4">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700 mb-4">{message}</p>}
      <div className="flex justify-end mb-4">
        <button onClick={() => setPreview(!preview)} aria-expanded={preview} className="text-sm underline">{preview ? 'Close preview' : 'Preview post'}</button>
      </div>
      {preview && <div className="border rounded-xl mb-6 bg-[#fafaf9]"><PostBody post={value} coverUrl={imagePreview || (value.coverFileId ? fileUrl(value.coverFileId) : undefined)} /></div>}
      <fieldset disabled={busy} className="space-y-4 min-w-0 disabled:opacity-60">
        <Field label="Title"><input className={inputCls} value={value.title} onChange={(e) => update({ title: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="URL slug" hint={`/blog/${value.slug || slugify(value.title) || '…'}`}><input className={inputCls} value={value.slug} placeholder={slugify(value.title)} onChange={(e) => update({ slug: slugify(e.target.value) })} /></Field>
          <Field label="Publish date"><input type="date" className={inputCls} value={value.date} onChange={(e) => update({ date: e.target.value })} /></Field>
        </div>
        <Field label="Tags" hint="Separate tags with commas."><input className={inputCls} value={(value.tags || []).join(',')} onChange={(e) => update({ tags: e.target.value.split(',') })} /></Field>
        <Field label="Excerpt" hint="Shown on the blog list and in link previews."><textarea className={inputCls + ' h-20'} value={value.excerpt} onChange={(e) => update({ excerpt: e.target.value })} /></Field>
        <Field label="Body" hint="Markdown: ## headings, **bold**, [links](https://…), lists, > quotes, ```code```."><textarea className={inputCls + ' h-96 font-mono'} value={value.body} onChange={(e) => update({ body: e.target.value })} /></Field>
        <div>
          <p className="text-sm font-medium text-neutral-800 mb-1.5">Cover image <span className="font-normal text-neutral-500">— optional</span></p>
          {(imagePreview || value.coverFileId) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview || fileUrl(value.coverFileId)} alt="Cover preview" className="w-48 aspect-[16/9] object-cover rounded-lg border mb-3" />
          )}
          <input aria-label="Cover image" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => chooseImage(event.target.files?.[0] || null)} className="text-xs" />
        </div>
        <div className="flex flex-wrap justify-end gap-3 pt-4">
          <button onClick={remove} className="text-sm text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 mr-auto">{value.$id ? 'Delete' : 'Discard'}</button>
          <button onClick={() => save(true)} className="text-sm border border-neutral-300 px-4 py-2 rounded-lg hover:bg-neutral-50">{value.draft || !value.$id ? 'Save draft' : 'Unpublish'}</button>
          <button onClick={() => save(false)} className="text-sm text-white bg-neutral-900 px-4 py-2 rounded-lg hover:bg-neutral-700">{busy ? 'Working…' : value.draft || !value.$id ? 'Publish' : 'Update'}</button>
        </div>
      </fieldset>
    </div>}
  </section>
}
