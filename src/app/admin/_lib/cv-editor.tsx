'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { pdf } from '@react-pdf/renderer'
import {
  Contact, Cv, CvExperienceItem, CvEducationItem, CvProjectItem, CvSection, CvSimpleItem, CvSkillGroup,
  DEFAULT_CV, getAbout, getContact, getCv, getHero, getProjects, getWorkEntries, seedCvFromSite, setContact, setCv,
  uploadFile, deleteFile,
} from '../../../lib/content'
import { CvDocument, TEMPLATE_OPTIONS } from './cv-pdf'
import { Field, FieldGroup, PageHeader, SaveBar, inputCls, useSaveState } from './forms'

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFViewer),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center text-sm text-neutral-500">Loading preview…</div> },
)

const newId = () => Math.random().toString(36).slice(2, 10)

const FONT_OPTIONS: Cv['fontFamily'][] = ['Helvetica', 'Times-Roman', 'Courier']

const SECTION_LIBRARY: { type: CvSection['type']; heading: string }[] = [
  { type: 'summary', heading: 'Summary' },
  { type: 'experience', heading: 'Experience' },
  { type: 'education', heading: 'Education' },
  { type: 'skills', heading: 'Skills' },
  { type: 'projects', heading: 'Projects' },
  { type: 'certifications', heading: 'Certifications' },
  { type: 'custom', heading: 'Custom Section' },
]

function cleanCv(cv: Cv): Cv {
  return {
    ...cv,
    sections: cv.sections.map((s) => {
      if (s.type === 'experience') return { ...s, items: s.items.map((it) => ({ ...it, bullets: it.bullets.filter((b) => b.text.trim()) })) }
      if (s.type === 'projects') return { ...s, items: s.items.map((it) => ({ ...it, bullets: it.bullets.filter((b) => b.text.trim()) })) }
      if (s.type === 'certifications' || s.type === 'custom') return { ...s, items: s.items.filter((it) => it.text.trim()) }
      return s
    }),
  }
}

function emptySection(type: CvSection['type'], heading: string): CvSection {
  const base = { id: newId(), visible: true, heading }
  switch (type) {
    case 'summary': return { ...base, type, body: '' }
    case 'experience': return { ...base, type, items: [] }
    case 'education': return { ...base, type, items: [] }
    case 'skills': return { ...base, type, groups: [] }
    case 'projects': return { ...base, type, items: [] }
    case 'certifications': return { ...base, type, items: [] }
    case 'custom': return { ...base, type, items: [] }
  }
}

function moveItem<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const next = arr.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export function CvEditor() {
  const [cv, setCvState] = useState<Cv>(DEFAULT_CV)
  const [state, save] = useSaveState()
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle')
  const [contact, setContactState] = useState<Contact | null>(null)
  const [seedBusy, setSeedBusy] = useState(false)

  useEffect(() => {
    getCv().then(setCvState)
    getContact().then(setContactState)
  }, [])

  const update = useCallback((patch: Partial<Cv>) => setCvState((c) => ({ ...c, ...patch })), [])
  const updatePersonal = (patch: Partial<Cv['personal']>) =>
    setCvState((c) => ({ ...c, personal: { ...c.personal, ...patch } }))
  const updateSection = (idx: number, patch: Partial<CvSection>) =>
    setCvState((c) => {
      const next = c.sections.slice()
      next[idx] = { ...next[idx], ...patch } as CvSection
      return { ...c, sections: next }
    })
  const removeSection = (idx: number) =>
    setCvState((c) => ({ ...c, sections: c.sections.filter((_, i) => i !== idx) }))
  const moveSection = (idx: number, dir: -1 | 1) =>
    setCvState((c) => ({ ...c, sections: moveItem(c.sections, idx, dir) }))
  const addSection = (type: CvSection['type']) => {
    const tpl = SECTION_LIBRARY.find((t) => t.type === type)!
    setCvState((c) => ({ ...c, sections: [...c.sections, emptySection(type, tpl.heading)] }))
  }

  const seed = async () => {
    setSeedBusy(true)
    try {
      const [hero, about, work, projects, ctc] = await Promise.all([
        getHero(), getAbout(), getWorkEntries(), getProjects(), getContact(),
      ])
      setCvState((c) => seedCvFromSite(hero, about, work, projects, ctc, c))
    } finally { setSeedBusy(false) }
  }

  const downloadPdf = async () => {
    const blob = await pdf(<CvDocument cv={cleanCv(cv)} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(cv.personal.fullName || 'cv').replace(/\s+/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const publish = async () => {
    if (!contact) return
    setPublishState('publishing')
    try {
      const cleaned = cleanCv(cv)
      const blob = await pdf(<CvDocument cv={cleaned} />).toBlob()
      const file = new File([blob], `${(cv.personal.fullName || 'cv').replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' })
      const newId = await uploadFile(file)
      const prev = contact.cvFileId
      const nextContact = { ...contact, cvFileId: newId }
      await setContact(nextContact)
      await setCv(cleaned)
      setContactState(nextContact)
      if (prev && prev !== newId) await deleteFile(prev)
      setPublishState('published')
      setTimeout(() => setPublishState('idle'), 2500)
    } catch (e) {
      console.error(e)
      setPublishState('error')
    }
  }

  const doc = useMemo(() => <CvDocument cv={cleanCv(cv)} />, [cv])

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
      <div className="min-w-0">
        <PageHeader
          title="CV / Resume"
          description="Edit every field. Pulls initial data from the site. Publish to update the public Download CV link."
        />

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={seed} disabled={seedBusy}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:border-neutral-900 disabled:opacity-50">
            {seedBusy ? 'Pulling…' : 'Pull from site'}
          </button>
          <button onClick={downloadPdf}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:border-neutral-900">
            Download PDF
          </button>
          <button onClick={publish} disabled={publishState === 'publishing'}
            className={`px-3 py-2 text-sm rounded-lg text-white ${
              publishState === 'error' ? 'bg-red-600' :
              publishState === 'published' ? 'bg-emerald-600' :
              'bg-neutral-900 hover:bg-neutral-700'
            } disabled:opacity-50`}>
            {publishState === 'publishing' ? 'Publishing…'
              : publishState === 'published' ? 'Published'
              : publishState === 'error' ? 'Error — retry'
              : 'Publish to site'}
          </button>
        </div>

        <div className="space-y-10">
          <FieldGroup title="Template & layout" description="ATS templates are single-column, safe-font, parseable. Creative is for human readers only.">
            <Field label="Template">
              <div className="space-y-2">
                {TEMPLATE_OPTIONS.map((t) => (
                  <label key={t.value} className={`block border rounded-lg p-3 cursor-pointer transition-colors ${cv.template === t.value ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="template"
                        checked={cv.template === t.value}
                        onChange={() => update({ template: t.value })}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {t.label}
                          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${t.atsSafe ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {t.atsSafe ? 'ATS-safe' : 'Not ATS-safe'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{t.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Font">
                <select className={inputCls} value={cv.fontFamily} onChange={(e) => update({ fontFamily: e.target.value as Cv['fontFamily'] })}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Font size (pt)">
                <input type="number" step="0.5" min={8} max={14} className={inputCls} value={cv.fontSize}
                  onChange={(e) => update({ fontSize: Number(e.target.value) || DEFAULT_CV.fontSize })} />
              </Field>
              <Field label="Margin (pt)">
                <input type="number" step="2" min={20} max={72} className={inputCls} value={cv.margin}
                  onChange={(e) => update({ margin: Number(e.target.value) || DEFAULT_CV.margin })} />
              </Field>
              <Field label="Accent color">
                <input type="color" className="w-full h-10 border border-neutral-300 rounded-lg" value={cv.accentColor}
                  onChange={(e) => update({ accentColor: e.target.value })} />
              </Field>
            </div>
          </FieldGroup>

          <FieldGroup title="Personal info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name"><input className={inputCls} value={cv.personal.fullName} onChange={(e) => updatePersonal({ fullName: e.target.value })} /></Field>
              <Field label="Headline / title"><input className={inputCls} value={cv.personal.headline} onChange={(e) => updatePersonal({ headline: e.target.value })} /></Field>
              <Field label="Email"><input className={inputCls} value={cv.personal.email} onChange={(e) => updatePersonal({ email: e.target.value })} /></Field>
              <Field label="Phone"><input className={inputCls} value={cv.personal.phone} onChange={(e) => updatePersonal({ phone: e.target.value })} /></Field>
              <Field label="Location"><input className={inputCls} value={cv.personal.location} onChange={(e) => updatePersonal({ location: e.target.value })} /></Field>
              <Field label="Website"><input className={inputCls} value={cv.personal.website} onChange={(e) => updatePersonal({ website: e.target.value })} /></Field>
            </div>
            <Field label="Links" hint="Add as many as you need. Label is shown in Creative; URL is shown in all templates.">
              <div className="space-y-2">
                {cv.personal.links.map((l, i) => (
                  <div key={l.id} className="flex gap-2">
                    <input className={inputCls + ' flex-1'} placeholder="Label (e.g. GitHub)" value={l.label}
                      onChange={(e) => {
                        const links = cv.personal.links.slice()
                        links[i] = { ...l, label: e.target.value }
                        updatePersonal({ links })
                      }} />
                    <input className={inputCls + ' flex-[2]'} placeholder="https://…" value={l.url}
                      onChange={(e) => {
                        const links = cv.personal.links.slice()
                        links[i] = { ...l, url: e.target.value }
                        updatePersonal({ links })
                      }} />
                    <button onClick={() => updatePersonal({ links: cv.personal.links.filter((_, j) => j !== i) })}
                      className="px-3 text-sm text-red-600 hover:bg-red-50 rounded-lg">Remove</button>
                  </div>
                ))}
                <button onClick={() => updatePersonal({ links: [...cv.personal.links, { id: newId(), label: '', url: '' }] })}
                  className="text-sm text-neutral-700 underline">+ Add link</button>
              </div>
            </Field>
          </FieldGroup>

          {cv.sections.map((section, idx) => (
            <FieldGroup key={section.id} title={`${section.heading || section.type}`}>
              <div className="flex flex-wrap items-center gap-2 -mt-3 mb-3">
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                  className="text-xs px-2 py-1 border border-neutral-300 rounded disabled:opacity-30">↑</button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === cv.sections.length - 1}
                  className="text-xs px-2 py-1 border border-neutral-300 rounded disabled:opacity-30">↓</button>
                <label className="text-xs text-neutral-600 flex items-center gap-1.5">
                  <input type="checkbox" checked={section.visible} onChange={(e) => updateSection(idx, { visible: e.target.checked })} />
                  Visible
                </label>
                <button onClick={() => removeSection(idx)}
                  className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded ml-auto">Remove section</button>
              </div>
              <Field label="Heading"><input className={inputCls} value={section.heading} onChange={(e) => updateSection(idx, { heading: e.target.value })} /></Field>
              <SectionBody section={section} onChange={(patch) => updateSection(idx, patch)} />
            </FieldGroup>
          ))}

          <FieldGroup title="Add section">
            <div className="flex flex-wrap gap-2">
              {SECTION_LIBRARY.map((t) => (
                <button key={t.type} onClick={() => addSection(t.type)}
                  className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:border-neutral-900">
                  + {t.heading}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>

        <SaveBar state={state} onSave={() => save(async () => { const cleaned = cleanCv(cv); await setCv(cleaned); setCvState(cleaned) })} />
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-3rem)] border border-neutral-200 rounded-xl overflow-hidden bg-neutral-100">
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} showToolbar>
          {doc}
        </PDFViewer>
      </div>
    </div>
  )
}

function SectionBody({ section, onChange }: { section: CvSection; onChange: (patch: Partial<CvSection>) => void }) {
  if (section.type === 'summary') {
    return (
      <Field label="Body">
        <textarea className={inputCls + ' h-28'} value={section.body}
          onChange={(e) => onChange({ body: e.target.value } as Partial<CvSection>)} />
      </Field>
    )
  }
  if (section.type === 'experience') return <ExperienceEditor section={section} onChange={onChange} />
  if (section.type === 'education') return <EducationEditor section={section} onChange={onChange} />
  if (section.type === 'skills') return <SkillsEditor section={section} onChange={onChange} />
  if (section.type === 'projects') return <ProjectsListEditor section={section} onChange={onChange} />
  return <SimpleListEditor section={section} onChange={onChange} />
}

function ItemBox({ children, onUp, onDown, onRemove, canUp, canDown }: {
  children: React.ReactNode; onUp: () => void; onDown: () => void; onRemove: () => void; canUp: boolean; canDown: boolean
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex gap-2 -mt-1 -mr-1 justify-end">
        <button onClick={onUp} disabled={!canUp} className="text-xs px-2 py-0.5 border border-neutral-300 rounded disabled:opacity-30">↑</button>
        <button onClick={onDown} disabled={!canDown} className="text-xs px-2 py-0.5 border border-neutral-300 rounded disabled:opacity-30">↓</button>
        <button onClick={onRemove} className="text-xs text-red-600 hover:bg-red-50 px-2 py-0.5 rounded">Remove</button>
      </div>
      {children}
    </div>
  )
}

function BulletsEditor({ bullets, onChange }: { bullets: { id: string; text: string }[]; onChange: (b: { id: string; text: string }[]) => void }) {
  return (
    <Field label="Bullets" hint="One bullet per line.">
      <textarea className={inputCls + ' h-28'} value={bullets.map((b) => b.text).join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n').map((text) => ({ id: newId(), text })))}
      />
    </Field>
  )
}

function ExperienceEditor({ section, onChange }: { section: Extract<CvSection, { type: 'experience' }>; onChange: (p: Partial<CvSection>) => void }) {
  const update = (items: CvExperienceItem[]) => onChange({ items } as Partial<CvSection>)
  return (
    <div className="space-y-3">
      {section.items.map((it, i) => (
        <ItemBox key={it.id}
          canUp={i > 0} canDown={i < section.items.length - 1}
          onUp={() => update(moveItem(section.items, i, -1))}
          onDown={() => update(moveItem(section.items, i, 1))}
          onRemove={() => update(section.items.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role"><input className={inputCls} value={it.role} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, role: e.target.value }; update(n) }} /></Field>
            <Field label="Company"><input className={inputCls} value={it.company} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, company: e.target.value }; update(n) }} /></Field>
            <Field label="Location"><input className={inputCls} value={it.location} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, location: e.target.value }; update(n) }} /></Field>
            <Field label="Period"><input className={inputCls} value={it.period} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, period: e.target.value }; update(n) }} /></Field>
          </div>
          <BulletsEditor bullets={it.bullets} onChange={(bs) => { const n = section.items.slice(); n[i] = { ...it, bullets: bs }; update(n) }} />
        </ItemBox>
      ))}
      <button onClick={() => update([...section.items, { id: newId(), role: '', company: '', location: '', period: '', bullets: [] }])}
        className="text-sm text-neutral-700 underline">+ Add entry</button>
    </div>
  )
}

function EducationEditor({ section, onChange }: { section: Extract<CvSection, { type: 'education' }>; onChange: (p: Partial<CvSection>) => void }) {
  const update = (items: CvEducationItem[]) => onChange({ items } as Partial<CvSection>)
  return (
    <div className="space-y-3">
      {section.items.map((it, i) => (
        <ItemBox key={it.id}
          canUp={i > 0} canDown={i < section.items.length - 1}
          onUp={() => update(moveItem(section.items, i, -1))}
          onDown={() => update(moveItem(section.items, i, 1))}
          onRemove={() => update(section.items.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree"><input className={inputCls} value={it.degree} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, degree: e.target.value }; update(n) }} /></Field>
            <Field label="School"><input className={inputCls} value={it.school} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, school: e.target.value }; update(n) }} /></Field>
            <Field label="Location"><input className={inputCls} value={it.location} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, location: e.target.value }; update(n) }} /></Field>
            <Field label="Period"><input className={inputCls} value={it.period} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, period: e.target.value }; update(n) }} /></Field>
          </div>
          <Field label="Details"><input className={inputCls} value={it.details} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, details: e.target.value }; update(n) }} /></Field>
        </ItemBox>
      ))}
      <button onClick={() => update([...section.items, { id: newId(), degree: '', school: '', location: '', period: '', details: '' }])}
        className="text-sm text-neutral-700 underline">+ Add entry</button>
    </div>
  )
}

function SkillsEditor({ section, onChange }: { section: Extract<CvSection, { type: 'skills' }>; onChange: (p: Partial<CvSection>) => void }) {
  const update = (groups: CvSkillGroup[]) => onChange({ groups } as Partial<CvSection>)
  return (
    <div className="space-y-3">
      {section.groups.map((g, i) => (
        <ItemBox key={g.id}
          canUp={i > 0} canDown={i < section.groups.length - 1}
          onUp={() => update(moveItem(section.groups, i, -1))}
          onDown={() => update(moveItem(section.groups, i, 1))}
          onRemove={() => update(section.groups.filter((_, j) => j !== i))}
        >
          <Field label="Group label"><input className={inputCls} value={g.label} onChange={(e) => { const n = section.groups.slice(); n[i] = { ...g, label: e.target.value }; update(n) }} /></Field>
          <Field label="Items" hint="Comma-separated.">
            <input className={inputCls} value={g.items.join(', ')}
              onChange={(e) => { const n = section.groups.slice(); n[i] = { ...g, items: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }; update(n) }} />
          </Field>
        </ItemBox>
      ))}
      <button onClick={() => update([...section.groups, { id: newId(), label: '', items: [] }])}
        className="text-sm text-neutral-700 underline">+ Add group</button>
    </div>
  )
}

function ProjectsListEditor({ section, onChange }: { section: Extract<CvSection, { type: 'projects' }>; onChange: (p: Partial<CvSection>) => void }) {
  const update = (items: CvProjectItem[]) => onChange({ items } as Partial<CvSection>)
  return (
    <div className="space-y-3">
      {section.items.map((it, i) => (
        <ItemBox key={it.id}
          canUp={i > 0} canDown={i < section.items.length - 1}
          onUp={() => update(moveItem(section.items, i, -1))}
          onDown={() => update(moveItem(section.items, i, 1))}
          onRemove={() => update(section.items.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title"><input className={inputCls} value={it.title} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, title: e.target.value }; update(n) }} /></Field>
            <Field label="Link"><input className={inputCls} value={it.link} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, link: e.target.value }; update(n) }} /></Field>
          </div>
          <Field label="Description"><textarea className={inputCls + ' h-20'} value={it.description} onChange={(e) => { const n = section.items.slice(); n[i] = { ...it, description: e.target.value }; update(n) }} /></Field>
          <BulletsEditor bullets={it.bullets} onChange={(bs) => { const n = section.items.slice(); n[i] = { ...it, bullets: bs }; update(n) }} />
        </ItemBox>
      ))}
      <button onClick={() => update([...section.items, { id: newId(), title: '', description: '', link: '', bullets: [] }])}
        className="text-sm text-neutral-700 underline">+ Add project</button>
    </div>
  )
}

function SimpleListEditor({ section, onChange }: { section: Extract<CvSection, { type: 'certifications' | 'custom' }>; onChange: (p: Partial<CvSection>) => void }) {
  const update = (items: CvSimpleItem[]) => onChange({ items } as Partial<CvSection>)
  return (
    <Field label="Items" hint="One per line.">
      <textarea className={inputCls + ' h-28'} value={section.items.map((i) => i.text).join('\n')}
        onChange={(e) => update(e.target.value.split('\n').map((text) => ({ id: newId(), text })))}
      />
    </Field>
  )
}
