'use client'

// ⌘K command palette + a working terminal. Both run on the live CMS content and
// the /api/status, /api/status/ping and /api/ask endpoints.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  publishedAbout, publishedContact, publishedHero, publishedProjects, publishedSite, publishedWork,
  getPublicAbout, getPublicContact, getPublicHero, getPublicProjects, getPublicSite, getPublicWork, publicAssetUrl,
} from '../src/lib/public-content'
import { externalUrl, sortProjects } from '../src/lib/project-utils'
import type { Telemetry } from '../src/lib/live/status'
import { timeAgo } from './ops'

type Line = { kind: 'in' | 'out' | 'err' | 'ok' | 'dim'; text: string }
type Item = { group: string; label: string; hint?: string; run: () => void }

const PROMPT = 'guest@jeffrey:~$'
const COMMANDS = ['help', 'whoami', 'about', 'skills', 'experience', 'projects', 'open', 'status', 'ping', 'git', 'ci', 'ask', 'contact', 'cv', 'history', 'clear', 'sudo', 'exit']
const REPO_URL = 'https://github.com/JeffreyEssien/Jeffrey-s-Portfolio'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function fuzzy(query: string, text: string) {
  const q = query.toLowerCase().replace(/\s+/g, '')
  const t = text.toLowerCase()
  let i = 0
  for (const ch of t) if (ch === q[i]) i++
  return i === q.length
}

export function openProject(id: string) {
  window.dispatchEvent(new CustomEvent('open-project', { detail: id }))
}

export default function Console() {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'palette' | 'terminal'>('palette')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'dim', text: "jeffrey-os 1.0 — a real shell over this site's live data." },
    { kind: 'dim', text: "Type 'help' to see commands. Try 'status', 'ping xelle.ng' or 'ask what does Jeffrey do at Access Bank?'" },
  ])
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const [busy, setBusy] = useState(false)

  const { data: hero = publishedHero } = useSWR('hero', getPublicHero, { fallbackData: publishedHero })
  const { data: about = publishedAbout } = useSWR('about', getPublicAbout, { fallbackData: publishedAbout })
  const { data: work = publishedWork } = useSWR('work', getPublicWork, { fallbackData: publishedWork })
  const { data: projectsRaw = publishedProjects } = useSWR('projects', getPublicProjects, { fallbackData: publishedProjects })
  const { data: contact = publishedContact } = useSWR('contact', getPublicContact, { fallbackData: publishedContact })
  const { data: site = publishedSite } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const projects = useMemo(() => sortProjects(projectsRaw), [projectsRaw])
  const cvHref = contact.cvFileId ? publicAssetUrl(contact.cvFileId) : '/Jeffrey_Essien_CV.pdf'
  const hosts = useMemo(() => projects.map((p) => externalUrl(p.link)).filter(Boolean).map((u) => new URL(u).host.replace(/^www\./, '')), [projects])

  const show = useCallback((next: 'palette' | 'terminal') => {
    setMode(next)
    setQuery('')
    setActive(0)
    if (!dialog.current?.open) dialog.current?.showModal()
    setOpen(true)
  }, [])

  // Focus once the panel for the current mode has actually rendered.
  useEffect(() => { if (open) input.current?.focus() }, [open, mode])
  const close = () => dialog.current?.close()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (dialog.current?.open) close()
        else show('palette')
      }
    }
    const onOpen = (e: Event) => show((e as CustomEvent).detail === 'terminal' ? 'terminal' : 'palette')
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-console', onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('open-console', onOpen) }
  }, [show])

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }) }, [lines])

  const print = (...out: Line[]) => setLines((l) => [...l, ...out])
  const out = (text: string, kind: Line['kind'] = 'out') => print({ kind, text })

  const run = async (raw: string) => {
    const cmd = raw.trim()
    print({ kind: 'in', text: `${PROMPT} ${cmd}` })
    if (!cmd) return
    setHistory((h) => [...h, cmd])
    setCursor(-1)
    const [name, ...args] = cmd.split(/\s+/)
    const rest = cmd.slice(name.length).trim()
    setBusy(true)
    try {
      switch (name.toLowerCase()) {
        case 'help':
          out([
            'whoami            who is Jeffrey',
            'about | skills    profile and skill levels',
            'experience        work history',
            'projects          shipped projects;  open <n> to view one',
            'status            live health of production services',
            'ping <host>       real latency probes, e.g. ping xelle.ng',
            'git log | ci      recent commits / CI runs of this site',
            'ask <question>    ask an AI grounded in this portfolio',
            'contact | cv      reach out or download the CV',
            'clear | history | exit',
          ].join('\n'))
          break
        case 'whoami':
          out(`${hero.name} — ${hero.subheadline}\nroles: ${hero.taglines.join(', ')}`)
          break
        case 'about':
          out(`${about.headlinePrefix}${about.headlineAccent}${about.headlineSuffix}\n\n${about.extraParagraph ?? ''}\n\n${about.educationDegree} · ${about.educationSchool}`)
          break
        case 'skills':
          out(about.skills.map((s) => `${s.name.padEnd(24)} ${'█'.repeat(Math.round(s.level / 5)).padEnd(20, '░')} ${s.level}%`).join('\n') + `\n\nstack: ${about.technologies.join(', ')}`)
          break
        case 'experience':
          out(work.map((w) => `▸ ${w.role} @ ${w.company}\n  ${w.period}${w.location ? ` · ${w.location}` : ''}`).join('\n'))
          break
        case 'projects':
          out(projects.map((p, i) => `[${i + 1}] ${p.title.padEnd(14)} ${externalUrl(p.link) || ''}`).join('\n') + "\n\nopen <number> for the case study")
          break
        case 'open': {
          const p = projects[Number(args[0]) - 1] ?? projects.find((x) => x.title.toLowerCase().includes(rest.toLowerCase()))
          if (!rest || !p) { out('usage: open <number|name>', 'err'); break }
          out(`opening ${p.title}…`, 'ok')
          close()
          if (p.$id) setTimeout(() => openProject(p.$id!), 150)
          break
        }
        case 'status': {
          out('probing production services…', 'dim')
          const t: Telemetry = await (await fetch('/api/status', { cache: 'no-store' })).json()
          out([`  ${'SERVICE'.padEnd(12)} ${'STATE'.padEnd(9)} ${'LATENCY'.padStart(7)}  HOST`, ...t.services.map((s) =>
            `${s.ok ? '●' : '○'} ${s.name.slice(0, 12).padEnd(12)} ${(s.ok ? 'up' : s.status ? `http ${s.status}` : 'timeout').padEnd(9)} ${(s.latencyMs !== null ? `${s.latencyMs}ms` : '—').padStart(7)}  ${s.host}`,
          ), `\nprobe region: ${t.region} · ${t.services.filter((s) => s.ok).length}/${t.services.length} healthy`].join('\n'))
          break
        }
        case 'ping': {
          const host = args.find((a) => !a.startsWith('-'))?.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
          if (!host) { out(`usage: ping <host>   known hosts: ${hosts.join(', ')}`, 'err'); break }
          out(`PING ${host}: 4 probes from this server`)
          const times: number[] = []
          for (let i = 0; i < 4; i++) {
            const res = await fetch(`/api/status/ping?host=${encodeURIComponent(host)}`, { cache: 'no-store' })
            const p = await res.json()
            if (!res.ok) { out(p.error ?? 'ping failed', 'err'); break }
            if (p.latencyMs === null) out(`probe ${i + 1}: request timed out`, 'err')
            else { times.push(p.latencyMs); out(`HTTP ${p.status} from ${p.host}: probe=${i + 1} region=${p.region} time=${p.latencyMs} ms`, p.ok ? 'out' : 'err') }
            if (i < 3) await sleep(500)
          }
          if (times.length) out(`--- ${host} ping statistics ---\nmin/avg/max = ${Math.min(...times)}/${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}/${Math.max(...times)} ms`, 'ok')
          break
        }
        case 'git': {
          if (args[0] !== 'log') { out('usage: git log', 'err'); break }
          const t: Telemetry = await (await fetch('/api/status', { cache: 'no-store' })).json()
          out(t.commits.length ? t.commits.map((c) => `${c.sha}  ${c.message}  (${timeAgo(c.date)})`).join('\n') : 'commit history unavailable right now', t.commits.length ? 'out' : 'err')
          break
        }
        case 'ci': {
          const t: Telemetry = await (await fetch('/api/status', { cache: 'no-store' })).json()
          out(t.ci.length ? t.ci.map((r) => `${(r.conclusion ?? r.status).padEnd(10)} ${r.sha}  ${r.branch.slice(0, 28).padEnd(29)} ${timeAgo(r.startedAt)}`).join('\n') : 'CI history unavailable right now', t.ci.length ? 'out' : 'err')
          break
        }
        case 'ask': {
          if (!rest) { out('usage: ask <question>', 'err'); break }
          out('thinking…', 'dim')
          const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: rest }) })
          const data = await res.json()
          setLines((l) => l.slice(0, -1))
          if (!res.ok) { out(data.error ?? 'The assistant is unavailable.', 'err'); break }
          // Type the answer out so it reads like a live response.
          let shown = ''
          print({ kind: 'ok', text: '' })
          for (const word of String(data.answer).split(/(\s+)/)) {
            shown += word
            const text = shown
            setLines((l) => [...l.slice(0, -1), { kind: 'ok', text }])
            await sleep(18)
          }
          out(`— answered by ${data.provider}, from this portfolio's content only`, 'dim')
          break
        }
        case 'contact':
          out(`email: ${contact.email}\nopening your mail client…`)
          window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(contact.ctaSubject)}`
          break
        case 'cv':
          out('downloading CV…', 'ok')
          window.open(cvHref, '_blank', 'noopener,noreferrer')
          break
        case 'history':
          out(history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n') || 'no history yet')
          break
        case 'clear':
          setLines([])
          break
        case 'sudo':
          if (rest === 'hire-jeffrey' || rest === 'hire jeffrey') {
            out('[sudo] permission granted. Drafting an offer email…', 'ok')
            window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("We'd like to hire you")}`
          } else out(`guest is not in the sudoers file. Try: sudo hire-jeffrey`, 'err')
          break
        case 'exit':
          close()
          break
        default:
          out(`command not found: ${name}. Type 'help'.`, 'err')
      }
    } catch {
      out('network error — try again', 'err')
    } finally {
      setBusy(false)
    }
  }

  const sectionItems: Item[] = [
    ['hero', site.navHome], ['about', site.navAbout], ['work', site.navWork], ['projects', site.navProjects], ['ops', 'Live telemetry'], ['contact', site.navContact],
  ].map(([id, label]) => ({ group: 'Navigate', label: `Go to ${label}`, run: () => { close(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) } }))
  const items: Item[] = [
    ...sectionItems,
    ...projects.flatMap((p) => [
      { group: 'Projects', label: `${p.title} — case study`, run: () => { close(); if (p.$id) setTimeout(() => openProject(p.$id!), 150) } },
      ...(externalUrl(p.link) ? [{ group: 'Projects', label: `${p.title} — visit live site`, hint: '↗', run: () => window.open(externalUrl(p.link), '_blank', 'noopener,noreferrer') }] : []),
    ]),
    { group: 'Actions', label: 'Open terminal', hint: '>_', run: () => show('terminal') },
    { group: 'Actions', label: 'Run live status check', run: () => { show('terminal'); setTimeout(() => run('status'), 50) } },
    { group: 'Actions', label: 'Copy email address', run: () => { navigator.clipboard?.writeText(contact.email); close() } },
    { group: 'Actions', label: 'Send an email', run: () => { window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(contact.ctaSubject)}` } },
    { group: 'Actions', label: 'Download CV', run: () => window.open(cvHref, '_blank', 'noopener,noreferrer') },
    { group: 'Actions', label: 'View this site’s source on GitHub', hint: '↗', run: () => window.open(REPO_URL, '_blank', 'noopener,noreferrer') },
  ]
  const results = query.trim()
    ? [
        ...items.filter((i) => fuzzy(query, `${i.group} ${i.label}`)),
        { group: 'AI', label: `Ask AI: “${query.trim()}”`, run: () => { show('terminal'); const q = query.trim(); setTimeout(() => run(`ask ${q}`), 50) } },
      ]
    : items

  const complete = () => {
    const parts = query.split(/\s+/)
    const pool = parts.length > 1 && parts[0] === 'ping' ? hosts : parts.length > 1 && parts[0] === 'git' ? ['log'] : COMMANDS
    const last = parts[parts.length - 1]
    const match = pool.filter((c) => c.startsWith(last))
    if (match.length === 1) setQuery([...parts.slice(0, -1), match[0]].join(' ') + ' ')
    else if (match.length > 1) out(match.join('  '), 'dim')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => show('palette')}
        className="fixed bottom-5 right-5 z-[55] inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2.5 font-mono text-xs text-muted backdrop-blur-xl hover:border-accent hover:text-accent transition-colors"
        aria-label="Open command console"
      >
        <span aria-hidden className="text-accent">&gt;_</span> Console <kbd className="hidden md:inline rounded border border-line px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <dialog
        ref={dialog}
        aria-label={mode === 'terminal' ? 'Terminal' : 'Command palette'}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) close() }}
        className="fixed inset-x-0 top-[10vh] mx-auto w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-line bg-[#0e0e10]/95 p-0 text-fg shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(200,245,96,0.08)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="flex max-h-[70vh] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              </span>
              <div role="tablist" className="ml-2 flex gap-1 font-mono text-xs">
                {(['palette', 'terminal'] as const).map((m) => (
                  <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => show(m)} className={`rounded-md px-2.5 py-1 ${mode === m ? 'bg-white/10 text-fg' : 'text-faint hover:text-fg'}`}>
                    {m === 'palette' ? '⌘K commands' : '>_ terminal'}
                  </button>
                ))}
              </div>
              <button type="button" onClick={close} className="ml-auto font-mono text-xs text-faint hover:text-fg">esc</button>
            </div>

            {mode === 'palette' ? (
              <>
                <input
                  ref={input}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0) }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
                    if (e.key === 'Enter') results[active]?.run()
                  }}
                  placeholder="Search sections, projects, actions — or ask a question…"
                  aria-label="Search commands"
                  aria-controls="console-results"
                  aria-activedescendant={results[active] ? `console-item-${active}` : undefined}
                  className="w-full bg-transparent px-5 py-4 text-base text-fg placeholder:text-faint outline-none"
                />
                <ul id="console-results" role="listbox" className="overflow-y-auto border-t border-line p-2">
                  {results.map((item, i) => (
                    <li key={`${item.group}-${item.label}`} id={`console-item-${i}`} role="option" aria-selected={i === active}>
                      {(i === 0 || results[i - 1].group !== item.group) && <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{item.group}</p>}
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseEnter={() => setActive(i)}
                        onClick={item.run}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${i === active ? 'bg-accent text-accent-fg' : 'text-muted'}`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.hint && <span className="font-mono text-xs opacity-70">{item.hint}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex min-h-[50vh] flex-col font-mono text-[13px] leading-relaxed" onClick={() => input.current?.focus()}>
                <div ref={scroller} className="flex-1 overflow-y-auto px-5 py-4" role="log" aria-live="polite">
                  {lines.map((l, i) => (
                    <pre key={i} className={`whitespace-pre-wrap break-words ${l.kind === 'in' ? 'text-fg' : l.kind === 'err' ? 'text-red-300' : l.kind === 'ok' ? 'text-accent' : l.kind === 'dim' ? 'text-faint' : 'text-muted'}`}>{l.text}</pre>
                  ))}
                </div>
                <label className="flex items-center gap-2 border-t border-line px-5 py-3">
                  <span className="text-accent shrink-0">{PROMPT}</span>
                  <input
                    ref={input}
                    value={query}
                    disabled={busy}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { const q = query; setQuery(''); run(q) }
                      if (e.key === 'Tab') { e.preventDefault(); complete() }
                      if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); const c = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1); setCursor(c); setQuery(history[c]) }
                      if (e.key === 'ArrowDown' && cursor >= 0) { e.preventDefault(); const c = cursor + 1; if (c >= history.length) { setCursor(-1); setQuery('') } else { setCursor(c); setQuery(history[c]) } }
                      if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]) }
                    }}
                    aria-label="Terminal command"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent text-fg caret-accent outline-none disabled:opacity-50"
                  />
                  {busy && <span className="text-faint animate-pulse">running…</span>}
                </label>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}
