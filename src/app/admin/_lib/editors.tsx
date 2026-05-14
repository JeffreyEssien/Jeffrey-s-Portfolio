'use client'

import { useEffect, useState } from 'react'
import { fileUrl } from '../../../lib/appwrite'
import {
  About, Contact, DEFAULT_ABOUT, DEFAULT_CONTACT, DEFAULT_HERO, DEFAULT_SITE, Hero, Project, Site, WorkEntry,
  createProject, createWorkEntry, deleteFile, deleteProject, deleteWorkEntry, getAbout, getContact,
  getHero, getProjects, getSite, getWorkEntries, setAbout, setContact, setHero, setSite,
  updateProject, updateWorkEntry, uploadFile,
} from '../../../lib/content'
import { Field, FieldGroup, PageHeader, SaveBar, inputCls, useSaveState } from './forms'

const linesToList = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

export function SiteEditor() {
  const [s, setS] = useState<Site>(DEFAULT_SITE)
  const [state, save] = useSaveState()
  useEffect(() => { getSite().then(setS) }, [])

  return (
    <div>
      <PageHeader title="Site" description="Brand, navigation, page metadata, and section headings." />
      <div className="space-y-10">
        <FieldGroup title="Brand">
          <Field label="Brand name" hint="Shown in the navbar.">
            <input className={inputCls} value={s.brand} onChange={(e) => setS({ ...s, brand: e.target.value })} />
          </Field>
        </FieldGroup>

        <FieldGroup title="Navigation labels">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Home"><input className={inputCls} value={s.navHome} onChange={(e) => setS({ ...s, navHome: e.target.value })} /></Field>
            <Field label="About"><input className={inputCls} value={s.navAbout} onChange={(e) => setS({ ...s, navAbout: e.target.value })} /></Field>
            <Field label="Experience"><input className={inputCls} value={s.navWork} onChange={(e) => setS({ ...s, navWork: e.target.value })} /></Field>
            <Field label="Projects"><input className={inputCls} value={s.navProjects} onChange={(e) => setS({ ...s, navProjects: e.target.value })} /></Field>
            <Field label="Contact"><input className={inputCls} value={s.navContact} onChange={(e) => setS({ ...s, navContact: e.target.value })} /></Field>
          </div>
        </FieldGroup>

        <FieldGroup title="Experience section heading" description="Shown above the work history list.">
          <Field label="Eyebrow label"><input className={inputCls} value={s.workEyebrow} onChange={(e) => setS({ ...s, workEyebrow: e.target.value })} /></Field>
          <Field label="Headline — start"><input className={inputCls} value={s.workHeadlinePrefix} onChange={(e) => setS({ ...s, workHeadlinePrefix: e.target.value })} /></Field>
          <Field label="Headline — italic accent word" hint="Rendered in italic serif."><input className={inputCls} value={s.workHeadlineAccent} onChange={(e) => setS({ ...s, workHeadlineAccent: e.target.value })} /></Field>
          <Field label="Headline — end"><input className={inputCls} value={s.workHeadlineSuffix} onChange={(e) => setS({ ...s, workHeadlineSuffix: e.target.value })} /></Field>
          <Field label="Empty state text"><input className={inputCls} value={s.workEmpty} onChange={(e) => setS({ ...s, workEmpty: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Browser tab & SEO">
          <Field label="Page title"><input className={inputCls} value={s.metaTitle} onChange={(e) => setS({ ...s, metaTitle: e.target.value })} /></Field>
          <Field label="Meta description"><textarea className={inputCls + ' h-20'} value={s.metaDescription} onChange={(e) => setS({ ...s, metaDescription: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Projects section heading" description="Shown above the project grid.">
          <Field label="Eyebrow label"><input className={inputCls} value={s.projectsEyebrow} onChange={(e) => setS({ ...s, projectsEyebrow: e.target.value })} /></Field>
          <Field label="Headline — start"><input className={inputCls} value={s.projectsHeadlinePrefix} onChange={(e) => setS({ ...s, projectsHeadlinePrefix: e.target.value })} /></Field>
          <Field label="Headline — italic accent word" hint="Rendered in italic serif."><input className={inputCls} value={s.projectsHeadlineAccent} onChange={(e) => setS({ ...s, projectsHeadlineAccent: e.target.value })} /></Field>
          <Field label="Headline — end"><input className={inputCls} value={s.projectsHeadlineSuffix} onChange={(e) => setS({ ...s, projectsHeadlineSuffix: e.target.value })} /></Field>
          <Field label="Empty state text"><input className={inputCls} value={s.projectsEmpty} onChange={(e) => setS({ ...s, projectsEmpty: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Footer">
          <Field label="Copyright" hint="Use {year} for the current year."><input className={inputCls} value={s.footerCopyright} onChange={(e) => setS({ ...s, footerCopyright: e.target.value })} /></Field>
          <Field label="Tagline"><input className={inputCls} value={s.footerTagline} onChange={(e) => setS({ ...s, footerTagline: e.target.value })} /></Field>
        </FieldGroup>
      </div>
      <SaveBar state={state} onSave={() => save(() => setSite(s))} />
    </div>
  )
}

export function HeroEditor() {
  const [h, setH] = useState<Hero>(DEFAULT_HERO)
  const [state, save] = useSaveState()
  useEffect(() => { getHero().then(setH) }, [])

  return (
    <div>
      <PageHeader title="Hero" description="The first thing visitors see." />
      <div className="space-y-10">
        <FieldGroup title="Availability badge">
          <Field label="Label" hint="Leave empty to hide the badge."><input className={inputCls} value={h.availabilityLabel} onChange={(e) => setH({ ...h, availabilityLabel: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Headline">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Greeting"><input className={inputCls} value={h.greeting} onChange={(e) => setH({ ...h, greeting: e.target.value })} /></Field>
            <Field label="Name (italic)"><input className={inputCls} value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} /></Field>
          </div>
          <Field label="Subheadline" hint="Shown in muted gray below the name."><input className={inputCls} value={h.subheadline} onChange={(e) => setH({ ...h, subheadline: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Rotating taglines" description="One per line. Cycles in a typewriter effect.">
          <textarea
            className={inputCls + ' h-32'}
            value={h.taglines.join('\n')}
            onChange={(e) => setH({ ...h, taglines: linesToList(e.target.value) })}
          />
        </FieldGroup>

        <FieldGroup title="Call to action buttons">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary (filled)"><input className={inputCls} value={h.ctaPrimary} onChange={(e) => setH({ ...h, ctaPrimary: e.target.value })} /></Field>
            <Field label="Secondary (outline)"><input className={inputCls} value={h.ctaSecondary} onChange={(e) => setH({ ...h, ctaSecondary: e.target.value })} /></Field>
          </div>
        </FieldGroup>
      </div>
      <SaveBar state={state} onSave={() => save(() => setHero(h))} />
    </div>
  )
}

export function AboutEditor() {
  const [a, setA] = useState<About>(DEFAULT_ABOUT)
  const [state, save] = useSaveState()
  useEffect(() => { getAbout().then(setA) }, [])

  return (
    <div>
      <PageHeader title="About" description="Education, certifications, skills, and stack." />
      <div className="space-y-10">
        <FieldGroup title="Section heading">
          <Field label="Eyebrow label"><input className={inputCls} value={a.eyebrow} onChange={(e) => setA({ ...a, eyebrow: e.target.value })} /></Field>
          <Field label="Headline — start"><input className={inputCls} value={a.headlinePrefix} onChange={(e) => setA({ ...a, headlinePrefix: e.target.value })} /></Field>
          <Field label="Headline — italic accent word"><input className={inputCls} value={a.headlineAccent} onChange={(e) => setA({ ...a, headlineAccent: e.target.value })} /></Field>
          <Field label="Headline — end"><input className={inputCls} value={a.headlineSuffix} onChange={(e) => setA({ ...a, headlineSuffix: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Education">
          <Field label="Label"><input className={inputCls} value={a.educationLabel} onChange={(e) => setA({ ...a, educationLabel: e.target.value })} /></Field>
          <Field label="Degree"><input className={inputCls} value={a.educationDegree} onChange={(e) => setA({ ...a, educationDegree: e.target.value })} /></Field>
          <Field label="School"><input className={inputCls} value={a.educationSchool} onChange={(e) => setA({ ...a, educationSchool: e.target.value })} /></Field>
          <Field label="Period / note"><input className={inputCls} value={a.educationPeriod} onChange={(e) => setA({ ...a, educationPeriod: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Certifications">
          <Field label="Label"><input className={inputCls} value={a.certificationsLabel} onChange={(e) => setA({ ...a, certificationsLabel: e.target.value })} /></Field>
          <Field label="Items" hint="One per line.">
            <textarea className={inputCls + ' h-32'} value={a.certifications.join('\n')} onChange={(e) => setA({ ...a, certifications: linesToList(e.target.value) })} />
          </Field>
        </FieldGroup>

        <FieldGroup title="Skills">
          <Field label="Label"><input className={inputCls} value={a.skillsLabel} onChange={(e) => setA({ ...a, skillsLabel: e.target.value })} /></Field>
          <Field label="Items" hint="One per line: name|level (0–100). Example: React|95">
            <textarea
              className={inputCls + ' h-32'}
              value={a.skills.map((sk) => `${sk.name}|${sk.level}`).join('\n')}
              onChange={(e) => setA({
                ...a,
                skills: linesToList(e.target.value).map((line) => {
                  const [name, level] = line.split('|')
                  return { name: (name ?? '').trim(), level: Math.max(0, Math.min(100, Number(level) || 0)) }
                }),
              })}
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="Stack">
          <Field label="Label"><input className={inputCls} value={a.stackLabel} onChange={(e) => setA({ ...a, stackLabel: e.target.value })} /></Field>
          <Field label="Items" hint="One per line.">
            <textarea className={inputCls + ' h-32'} value={a.technologies.join('\n')} onChange={(e) => setA({ ...a, technologies: linesToList(e.target.value) })} />
          </Field>
        </FieldGroup>
      </div>
      <SaveBar state={state} onSave={() => save(() => setAbout(a))} />
    </div>
  )
}

export function ProjectsEditor() {
  const [projects, setProjects] = useState<Project[]>([])
  const [busy, setBusy] = useState(false)

  const reload = async () => setProjects(await getProjects())
  useEffect(() => { reload() }, [])

  const add = async () => {
    setBusy(true)
    try {
      await createProject({ title: '', description: '', link: '', imageFileId: '', order: projects.length })
      await reload()
    } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Projects" description="The work shown on your portfolio. Section headings live under Site." />
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-neutral-500">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
        <button onClick={add} disabled={busy} className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-medium disabled:opacity-50 transition-colors duration-200">
          + Add project
        </button>
      </div>
      <div className="space-y-6">
        {projects.map((p) => <ProjectRow key={p.$id} project={p} onChanged={reload} />)}
        {projects.length === 0 && <p className="text-sm text-neutral-500 py-8 text-center border border-dashed border-neutral-300 rounded-lg">No projects yet.</p>}
      </div>
    </div>
  )
}

function ProjectRow({ project, onChanged }: { project: Project; onChanged: () => void }) {
  const [p, setP] = useState<Project>(project)
  const [state, save] = useSaveState()
  const [uploading, setUploading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const normalizeLink = (u: string) => {
    const v = (u || '').trim()
    if (!v) return ''
    if (/^https?:\/\//i.test(v)) return v
    if (v.startsWith('//')) return 'https:' + v
    return 'https://' + v
  }

  const persist = async (next: Project) => {
    const id = next.$id
    if (!id) return
    const link = normalizeLink(next.link)
    if (link !== next.link) { next = { ...next, link }; setP(next) }
    await updateProject(id, { title: next.title, description: next.description, link, imageFileId: next.imageFileId, order: next.order })
  }

  const onFile = async (f: File | null) => {
    if (!f || !p.$id) return
    setUploading(true)
    try {
      const oldId = p.imageFileId
      const newId = await uploadFile(f)
      const next = { ...p, imageFileId: newId }
      setP(next)
      await persist(next)
      if (oldId) await deleteFile(oldId)
    } finally { setUploading(false) }
  }

  const fetchFromLink = async () => {
    if (!p.link || !p.$id) return
    setFetching(true)
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(normalizeLink(p.link))}`)
      if (!res.ok) throw new Error(`Preview fetch failed (${res.status})`)
      const blob = await res.blob()
      const ext = (blob.type.split('/')[1] || 'jpg').split(';')[0]
      const file = new File([blob], `preview.${ext}`, { type: blob.type || 'image/jpeg' })
      const oldId = p.imageFileId
      const newId = await uploadFile(file)
      const next = { ...p, imageFileId: newId }
      setP(next)
      await persist(next)
      if (oldId) await deleteFile(oldId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not fetch preview')
    } finally { setFetching(false) }
  }

  const remove = async () => {
    if (!p.$id) return
    if (!confirm(`Delete "${p.title || 'this project'}"?`)) return
    if (p.imageFileId) await deleteFile(p.imageFileId)
    await deleteProject(p.$id)
    onChanged()
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-white">
      <div className="grid md:grid-cols-[180px_1fr] gap-5">
        <div>
          <div className="aspect-[4/3] bg-neutral-100 border border-neutral-200 rounded-lg overflow-hidden mb-2">
            {p.imageFileId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(p.imageFileId)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No image</div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="text-xs w-full" />
          <button
            type="button"
            onClick={fetchFromLink}
            disabled={!p.link || fetching || uploading}
            className="mt-2 w-full px-3 py-1.5 rounded-md text-xs font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors duration-200"
          >
            {fetching ? 'Fetching…' : 'Fetch from link'}
          </button>
          {uploading && <p className="text-xs text-neutral-500 mt-1">Uploading…</p>}
        </div>
        <div className="space-y-4">
          <Field label="Title"><input className={inputCls} value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} /></Field>
          <Field label="Description"><textarea className={inputCls + ' h-20'} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
          <div className="grid grid-cols-[1fr_100px] gap-4">
            <Field label="Link"><input className={inputCls} value={p.link} onChange={(e) => setP({ ...p, link: e.target.value })} /></Field>
            <Field label="Order"><input type="number" className={inputCls} value={p.order} onChange={(e) => setP({ ...p, order: Number(e.target.value) || 0 })} /></Field>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={remove} className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200">Delete</button>
            <button
              onClick={() => save(() => persist(p))}
              disabled={state === 'saving'}
              className={`px-5 py-2 rounded-lg font-medium text-white text-sm disabled:opacity-50 transition-colors duration-200 ${
                state === 'error' ? 'bg-red-600 hover:bg-red-700' : state === 'saved' ? 'bg-emerald-600' : 'bg-neutral-900 hover:bg-neutral-700'
              }`}
            >
              {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Retry' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WorkEditor() {
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [busy, setBusy] = useState(false)

  const reload = async () => setEntries(await getWorkEntries())
  useEffect(() => { reload() }, [])

  const add = async () => {
    setBusy(true)
    try {
      await createWorkEntry({ role: '', company: '', period: '', location: '', description: '', order: entries.length })
      await reload()
    } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Experience" description="Your work history shown on the portfolio. Section headings live under Site." />
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-neutral-500">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
        <button onClick={add} disabled={busy} className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-medium disabled:opacity-50 transition-colors duration-200">
          + Add entry
        </button>
      </div>
      <div className="space-y-6">
        {entries.map((e) => <WorkEntryRow key={e.$id} entry={e} onChanged={reload} />)}
        {entries.length === 0 && <p className="text-sm text-neutral-500 py-8 text-center border border-dashed border-neutral-300 rounded-lg">No entries yet.</p>}
      </div>
    </div>
  )
}

function WorkEntryRow({ entry, onChanged }: { entry: WorkEntry; onChanged: () => void }) {
  const [e, setE] = useState<WorkEntry>(entry)
  const [state, save] = useSaveState()

  const persist = async (next: WorkEntry) => {
    if (!next.$id) return
    await updateWorkEntry(next.$id, { role: next.role, company: next.company, period: next.period, location: next.location, description: next.description, order: next.order })
  }

  const remove = async () => {
    if (!e.$id) return
    if (!confirm(`Delete "${e.role || e.company || 'this entry'}"?`)) return
    await deleteWorkEntry(e.$id)
    onChanged()
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Role"><input className={inputCls} value={e.role} onChange={(ev) => setE({ ...e, role: ev.target.value })} /></Field>
        <Field label="Company"><input className={inputCls} value={e.company} onChange={(ev) => setE({ ...e, company: ev.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-[1fr_1fr_80px] gap-4">
        <Field label="Period" hint='e.g. "Jan 2023 – Present"'><input className={inputCls} value={e.period} onChange={(ev) => setE({ ...e, period: ev.target.value })} /></Field>
        <Field label="Location"><input className={inputCls} value={e.location} onChange={(ev) => setE({ ...e, location: ev.target.value })} /></Field>
        <Field label="Order"><input type="number" className={inputCls} value={e.order} onChange={(ev) => setE({ ...e, order: Number(ev.target.value) || 0 })} /></Field>
      </div>
      <Field label="Description" hint="What you did — plain text or one bullet per line using •.">
        <textarea className={inputCls + ' h-28'} value={e.description} onChange={(ev) => setE({ ...e, description: ev.target.value })} />
      </Field>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={remove} className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200">Delete</button>
        <button
          onClick={() => save(() => persist(e))}
          disabled={state === 'saving'}
          className={`px-5 py-2 rounded-lg font-medium text-white text-sm disabled:opacity-50 transition-colors duration-200 ${
            state === 'error' ? 'bg-red-600 hover:bg-red-700' : state === 'saved' ? 'bg-emerald-600' : 'bg-neutral-900 hover:bg-neutral-700'
          }`}
        >
          {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Retry' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export function ContactEditor() {
  const [c, setC] = useState<Contact>(DEFAULT_CONTACT)
  const [state, save] = useSaveState()
  const [uploading, setUploading] = useState(false)
  useEffect(() => { getContact().then(setC) }, [])

  const onCv = async (f: File | null) => {
    if (!f) return
    setUploading(true)
    try {
      const oldId = c.cvFileId
      const newId = await uploadFile(f)
      const next = { ...c, cvFileId: newId }
      setC(next)
      await setContact(next)
      if (oldId) await deleteFile(oldId)
    } finally { setUploading(false) }
  }

  return (
    <div>
      <PageHeader title="Contact" description="How visitors get in touch and download your CV." />
      <div className="space-y-10">
        <FieldGroup title="Section heading">
          <Field label="Eyebrow label"><input className={inputCls} value={c.eyebrow} onChange={(e) => setC({ ...c, eyebrow: e.target.value })} /></Field>
          <Field label="Headline — start"><input className={inputCls} value={c.headlinePrefix} onChange={(e) => setC({ ...c, headlinePrefix: e.target.value })} /></Field>
          <Field label="Headline — italic accent word"><input className={inputCls} value={c.headlineAccent} onChange={(e) => setC({ ...c, headlineAccent: e.target.value })} /></Field>
          <Field label="Headline — end"><input className={inputCls} value={c.headlineSuffix} onChange={(e) => setC({ ...c, headlineSuffix: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Body">
          <Field label="Paragraph"><textarea className={inputCls + ' h-24'} value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="Buttons">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email button label"><input className={inputCls} value={c.ctaEmailLabel} onChange={(e) => setC({ ...c, ctaEmailLabel: e.target.value })} /></Field>
            <Field label="CV button label"><input className={inputCls} value={c.ctaCvLabel} onChange={(e) => setC({ ...c, ctaCvLabel: e.target.value })} /></Field>
          </div>
        </FieldGroup>

        <FieldGroup title="Email">
          <Field label="Email address"><input className={inputCls} type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></Field>
          <Field label="Email subject line"><input className={inputCls} value={c.ctaSubject} onChange={(e) => setC({ ...c, ctaSubject: e.target.value })} /></Field>
          <Field label="Display label" hint="Shown below the buttons. Leave empty to show the email itself."><input className={inputCls} value={c.emailLinkLabel} onChange={(e) => setC({ ...c, emailLinkLabel: e.target.value })} /></Field>
        </FieldGroup>

        <FieldGroup title="CV file" description="PDF, max 10 MB.">
          {c.cvFileId ? (
            <a href={fileUrl(c.cvFileId)} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-900 underline">View current CV</a>
          ) : (
            <p className="text-sm text-neutral-500">No CV uploaded — visitors get the bundled file.</p>
          )}
          <input type="file" accept="application/pdf" onChange={(e) => onCv(e.target.files?.[0] ?? null)} className="text-sm" />
          {uploading && <p className="text-xs text-neutral-500">Uploading…</p>}
        </FieldGroup>
      </div>
      <SaveBar state={state} onSave={() => save(() => setContact(c))} />
    </div>
  )
}
