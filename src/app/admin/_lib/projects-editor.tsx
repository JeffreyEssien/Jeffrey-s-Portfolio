'use client'

import { useEffect, useState } from 'react'
import ProjectDetails from '../../../../components/project-details'
import { fileUrl } from '../../../lib/appwrite'
import { createProject, deleteFile, deleteProject, getProjects, updateProject, uploadFile, type Project } from '../../../lib/content'
import { externalUrl, validateProject } from '../../../lib/project-utils'
import { adminRequestHeaders } from '../../../lib/auth'
import { Field, PageHeader, inputCls } from './forms'

type Draft = { id: string; project: Project }
const DRAFT_KEY = 'portfolio-project-drafts-v1'

export function ProjectsEditor() {
  const [projects, setProjects] = useState<Project[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [ready, setReady] = useState(false)
  const [canPersist, setCanPersist] = useState(false)
  const [storageError, setStorageError] = useState('')
  const reload = async () => setProjects(await getProjects())

  useEffect(() => {
    reload()
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const value = JSON.parse(raw)
        if (!Array.isArray(value) || !value.every((d) => typeof d.id === 'string' && typeof d.project?.title === 'string' && typeof d.project?.description === 'string' && typeof d.project?.link === 'string')) throw new Error('Invalid browser drafts')
        setDrafts(value)
      }
      setCanPersist(true)
    } catch { setStorageError('Could not restore browser drafts. Keep this tab open while editing.') }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !canPersist) return
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)) }
    catch { setStorageError('Browser storage is unavailable. Drafts will be lost if you close this tab.') }
  }, [drafts, ready, canPersist])

  const discard = (id: string) => setDrafts((items) => items.filter((item) => item.id !== id))
  const add = () => setDrafts((items) => [...items, {
    id: crypto.randomUUID(), project: { title: '', description: '', link: '', imageFileId: '', order: projects.length + items.length },
  }])

  return <div>
    <PageHeader title="Projects" description="Draft, preview, and publish your work. New drafts stay in this browser until you publish them." />
    {storageError && <p role="alert" className="text-sm text-red-700 mb-4">{storageError}</p>}
    <div className="flex justify-between items-center gap-4 mb-6">
      <p className="text-sm text-neutral-500">{projects.length} published · {drafts.length} drafts</p>
      <button onClick={add} disabled={!ready} className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-700 disabled:opacity-50">+ Draft a project</button>
    </div>
    <div className="space-y-6">
      {drafts.map((draft) => <ProjectRow key={draft.id} project={draft.project}
        onDraft={(project) => setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, project } : item))}
        onDiscard={() => discard(draft.id)}
        onChanged={async () => { discard(draft.id); await reload() }} />)}
      {projects.map((project) => <ProjectRow key={project.$id} project={project} onChanged={reload} />)}
      {ready && !projects.length && !drafts.length && <p className="text-sm text-neutral-500 p-8 text-center border border-dashed rounded-xl">Start a draft to add your first project.</p>}
    </div>
  </div>
}

function ProjectRow({ project, onChanged, onDraft, onDiscard }: {
  project: Project
  onChanged: () => Promise<void>
  onDraft?: (project: Project) => void
  onDiscard?: () => void
}) {
  const [value, setValue] = useState(project)
  const [baseline, setBaseline] = useState(project)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const dirty = !!image || JSON.stringify(value) !== JSON.stringify(baseline)
  const update = (patch: Partial<Project>) => {
    const next = { ...value, ...patch }
    setValue(next); onDraft?.(next); setMessage('')
  }

  useEffect(() => {
    if (!image) { setImagePreview(''); return }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => {
    if (!dirty || (onDraft && !image)) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const warnOnNavigation = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const destination = new URL(link.href, window.location.href)
      if (destination.pathname === window.location.pathname && destination.origin === window.location.origin) return
      if (!confirm('Leave this page? Your unpublished changes will be lost.')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', warnOnNavigation, true)
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', warnOnNavigation, true) }
  }, [dirty, onDraft, image])

  const chooseImage = (file: File | null) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a PNG, JPEG, WebP, GIF, or SVG image no larger than 10 MB.'); return
    }
    setImage(file); setError(''); setMessage('')
  }

  const fetchPreview = async () => {
    const url = externalUrl(value.link)
    if (!url) { setError('Enter a valid live-site URL first.'); return }
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`, { headers: await adminRequestHeaders() })
      if (!res.ok) throw new Error('Could not fetch a preview. Try uploading a screenshot.')
      const blob = await res.blob()
      const extension = blob.type === 'image/svg+xml' ? 'svg' : (blob.type.split('/')[1] || 'jpg')
      chooseImage(new File([blob], `preview.${extension}`, { type: blob.type }))
    } catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  const publish = async () => {
    const validation = validateProject(value)
    if (validation) { setError(validation); return }
    setBusy(true); setError(''); setMessage('')
    let newImage = ''
    let persisted = false
    try {
      if (image) newImage = await uploadFile(image)
      const { $id, ...data } = value
      const cleaned = { ...data, title: data.title.trim(), description: data.description.trim(), link: externalUrl(data.link), sourceUrl: externalUrl(data.sourceUrl), technologies: (data.technologies || []).map((t) => t.trim()).filter(Boolean), imageFileId: newImage || data.imageFileId }
      if ($id) await updateProject($id, cleaned)
      else await createProject(cleaned)
      persisted = true
      if (newImage && value.imageFileId) await deleteFile(value.imageFileId)
      const next = { ...cleaned, $id }
      setValue(next); setBaseline(next); setImage(null); setMessage('Published')
      await onChanged()
    } catch (err) {
      if (newImage && !persisted) await deleteFile(newImage)
      setError((err as Error).message || 'Could not publish. Your edits are still here.')
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!confirm(`${value.$id ? 'Delete project' : 'Discard draft'} "${value.title || 'Untitled'}"?`)) return
    if (!value.$id) { onDiscard?.(); return }
    setBusy(true); setError('')
    try {
      await deleteProject(value.$id)
      if (value.imageFileId) await deleteFile(value.imageFileId)
      await onChanged()
    } catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return <section className="border border-neutral-200 rounded-xl p-5 bg-white">
    <div className="flex justify-between gap-4 items-center mb-4">
      <p className="text-xs uppercase tracking-widest text-neutral-500">{value.$id ? dirty ? 'Unpublished changes' : 'Published' : 'Browser draft'}</p>
      <button onClick={() => setPreview(!preview)} aria-expanded={preview} className="text-sm underline">{preview ? 'Close preview' : 'Preview case study'}</button>
    </div>
    {error && <p role="alert" className="text-sm text-red-700 mb-4">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-700 mb-4">{message}</p>}
    {preview && <div className="border rounded-xl mb-6 bg-[#fafaf9]"><ProjectDetails project={value} imageUrl={imagePreview || undefined} /></div>}
    <fieldset disabled={busy} className="grid md:grid-cols-[160px_1fr] gap-6 min-w-0 disabled:opacity-60">
      <div>
        {imagePreview || value.imageFileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview || fileUrl(value.imageFileId)} alt="Project preview" className="w-full aspect-[4/3] object-cover rounded-lg border mb-3" />
        ) : <div className="aspect-[4/3] bg-neutral-100 rounded-lg flex items-center justify-center text-xs text-neutral-500 mb-3">No image</div>}
        <input aria-label="Project image" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => chooseImage(event.target.files?.[0] || null)} className="text-xs w-full" />
        <button onClick={fetchPreview} disabled={!value.link} className="text-xs border rounded-lg px-3 py-2 w-full mt-3 disabled:opacity-50">Fetch from link</button>
        {image && <p className="text-xs text-neutral-500 mt-3">Image selected. Publish to upload it; images are not saved in browser drafts.</p>}
      </div>
      <div className="space-y-4 min-w-0">
        <Field label="Title"><input className={inputCls} value={value.title} onChange={(e) => update({ title: e.target.value })} /></Field>
        <Field label="Short description"><textarea className={inputCls + ' h-24'} value={value.description} onChange={(e) => update({ description: e.target.value })} /></Field>
        <Field label="Live-site URL"><input className={inputCls} value={value.link} onChange={(e) => update({ link: e.target.value })} /></Field>
        <Field label="Source-code URL"><input className={inputCls} value={value.sourceUrl || ''} onChange={(e) => update({ sourceUrl: e.target.value })} /></Field>
        <Field label="Technologies" hint="Separate technologies with commas."><input className={inputCls} value={(value.technologies || []).join(',')} onChange={(e) => update({ technologies: e.target.value.split(',') })} /></Field>
        <div className="flex gap-6 items-center">
          <Field label="Order"><input type="number" className={inputCls} value={value.order} onChange={(e) => update({ order: Number(e.target.value) })} /></Field>
          <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={!!value.featured} onChange={(e) => update({ featured: e.target.checked })} />Featured</label>
        </div>
        <details className="border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">Case study details</summary>
          <div className="space-y-4 mt-4">
            <Field label="Your role"><input className={inputCls} value={value.role || ''} onChange={(e) => update({ role: e.target.value })} /></Field>
            <Field label="The challenge" hint="What problem did you solve, and for whom?"><textarea className={inputCls + ' h-32'} value={value.problem || ''} onChange={(e) => update({ problem: e.target.value })} /></Field>
            <Field label="Your approach" hint="Explain your contribution and engineering decisions."><textarea className={inputCls + ' h-32'} value={value.solution || ''} onChange={(e) => update({ solution: e.target.value })} /></Field>
            <Field label="Results and lessons" hint="Describe concrete outcomes and what you learned."><textarea className={inputCls + ' h-32'} value={value.results || ''} onChange={(e) => update({ results: e.target.value })} /></Field>
          </div>
        </details>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={remove} className="text-sm text-red-600 px-4 py-2 rounded-lg hover:bg-red-50">{value.$id ? 'Delete' : 'Discard draft'}</button>
          <button onClick={publish} className="text-sm text-white bg-neutral-900 px-4 py-2 rounded-lg hover:bg-neutral-700">{busy ? 'Working…' : value.$id ? 'Publish changes' : 'Publish project'}</button>
        </div>
      </div>
    </fieldset>
  </section>
}
