'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useSWR from 'swr'
import { publishedSite, publishedWork, getPublicSite, getPublicWork } from '../src/lib/public-content'
import type { WorkEntry } from '../src/lib/content'
import { Scramble } from './effects'

const METRIC = /(\d+(?:\.\d+)?\s?(?:%|\+|\s(?:hours?|minutes|applications|projects)\+?))/g
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function Highlight({ text }: { text: string }) {
  return <>{text.split(METRIC).map((part, i) => i % 2 ? <span key={i} className="text-accent font-medium">{part}</span> : part)}</>
}

// "October 2025 - present" → month indexes since year 0; the end is null while ongoing.
function parsePeriod(period: string) {
  const dates = [...period.toLowerCase().matchAll(/([a-z]{3})[a-z]*\.?\s+(\d{4})/g)]
    .map((m) => Number(m[2]) * 12 + Math.max(0, MONTHS.indexOf(m[1])))
  const current = /present|now|current/i.test(period)
  return { start: dates[0] ?? 0, end: current ? null : dates[1] ?? dates[0] ?? 0, current }
}

function monthsNow() {
  const d = new Date()
  return d.getFullYear() * 12 + d.getMonth()
}

function duration(months: number) {
  const y = Math.floor(months / 12), m = months % 12
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ') || '1 mo'
}

const years = (period: string) => period.match(/\d{4}/g)?.join(' – ').concat(/present|now|current/i.test(period) ? ' – Now' : '') ?? period

type Role = WorkEntry & { lines: string[]; months: number; current: boolean }

function toRole(entry: WorkEntry): Role {
  const { start, end, current } = parsePeriod(entry.period)
  const lines = (entry.description ?? '').split(/\n|•/).map((l) => l.trim()).filter(Boolean)
  return { ...entry, lines, months: Math.max(1, (end ?? monthsNow()) - start + 1), current }
}

function Details({ role }: { role: Role }) {
  return (
    <motion.div
      key={role.$id}
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-faint">{role.period}{role.location ? ` · ${role.location}` : ''}</p>
      <h3 className="mt-4 text-3xl md:text-4xl font-medium tracking-tight text-fg">
        {role.role} <span className="font-serif italic font-normal text-accent">at</span> {role.company}
      </h3>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-2xl border border-line bg-bg/40 px-4 py-3">
          <span className="block font-serif italic text-2xl text-accent">{duration(role.months)}</span>
          <span className="block text-xs text-faint mt-0.5">{role.current ? 'and counting' : 'in the role'}</span>
        </span>
      </div>
      <ul className="mt-8 space-y-4">
        {role.lines.map((line, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 + i * 0.04 }}
            className="flex gap-3 text-sm md:text-base text-muted leading-relaxed"
          >
            <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-accent/60" />
            <span><Highlight text={line} /></span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function Work() {
  const { data: siteData } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const { data: entries, isLoading } = useSWR('work', getPublicWork, { fallbackData: publishedWork })
  const site = siteData ?? publishedSite
  // Newest first, current roles on top, whatever order they were entered in.
  const roles = useMemo(() => (entries ?? []).map(toRole).sort((a, b) =>
    Number(b.current) - Number(a.current) || parsePeriod(b.period).start - parsePeriod(a.period).start), [entries])
  const total = roles.length ? monthsNow() - Math.min(...roles.map((r) => parsePeriod(r.period).start)) : 0
  const current = roles.find((r) => r.current)
  const [active, setActive] = useState(0)
  const [fine, setFine] = useState(false)
  useEffect(() => { setFine(window.matchMedia('(hover: hover) and (pointer: fine)').matches) }, [])
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (active + step + roles.length) % roles.length
    setActive(next)
    document.getElementById(`role-tab-${next}`)?.focus()
  }

  return (
    <section id="work" className="py-32 md:py-40 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-10">
          <div className="md:col-span-3">
            <Scramble text={site.workEyebrow} className="text-xs uppercase tracking-[0.2em] text-accent" />
          </div>
          <div className="md:col-span-9">
            <h2 className="text-4xl md:text-7xl font-medium tracking-tight leading-[1.02] text-fg max-w-3xl">
              {site.workHeadlinePrefix}
              <span className="font-serif italic font-normal text-accent">{site.workHeadlineAccent}</span>
              {site.workHeadlineSuffix}
            </h2>
          </div>
        </div>

        {roles.length > 0 && (
          <p className="mb-10 md:mb-14 text-sm text-muted">
            <span className="font-serif italic text-2xl text-accent">{Math.floor(total / 12)}+</span> years ·{' '}
            <span className="font-serif italic text-2xl text-accent">{roles.length}</span> roles ·{' '}
            {current ? <>now {current.role} at {current.company}</> : 'open to work'}
          </p>
        )}

        {isLoading && roles.length === 0 && (
          <div className="grid md:grid-cols-12 gap-8 animate-pulse">
            <div className="md:col-span-5 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}</div>
            <div className="md:col-span-7 h-80 bg-white/5 rounded-3xl" />
          </div>
        )}

        {roles.length > 0 && (
          <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-start">
            <div role="tablist" aria-label={site.workEyebrow} aria-orientation="vertical" className="md:col-span-5 space-y-2" onKeyDown={onKey}>
              {roles.map((r, i) => {
                const on = i === active
                return (
                  <div key={r.$id ?? i}>
                    <button
                      type="button"
                      role="tab"
                      id={`role-tab-${i}`}
                      aria-selected={on}
                      aria-controls="role-panel"
                      tabIndex={on ? 0 : -1}
                      onClick={() => setActive(i)}
                      onMouseEnter={() => fine && setActive(i)}
                      className={`group relative w-full overflow-hidden rounded-2xl border px-5 py-4 text-left transition-colors duration-200 ${on ? 'border-accent/40 bg-surface/80' : 'border-line bg-surface/30 hover:bg-surface/60'} backdrop-blur`}
                    >
                      {on && <motion.span layoutId="role-glow" aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent shadow-[0_0_24px_var(--accent)]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                      <span className="flex items-baseline justify-between gap-4">
                        <span className={`font-serif italic text-xl md:text-2xl transition-colors duration-200 ${on ? 'text-accent' : 'text-fg'}`}>{r.company}</span>
                        <span className="shrink-0 text-xs tabular-nums text-faint">{years(r.period)}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-sm text-muted">
                        {r.role}
                        {r.current && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-accent">
                            <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-accent" /></span>
                            Now
                          </span>
                        )}
                      </span>
                    </button>
                    {/* Phones: the selected role opens in place, like an accordion. */}
                    {on && <div className="md:hidden rounded-3xl border border-line bg-surface/80 backdrop-blur-md p-6 mt-2"><Details role={r} /></div>}
                  </div>
                )
              })}
            </div>
            <div id="role-panel" role="tabpanel" aria-labelledby={`role-tab-${active}`} className="hidden md:block md:col-span-7 md:sticky md:top-28 rounded-3xl border border-line bg-surface/70 backdrop-blur-md p-10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
              <AnimatePresence mode="wait">{roles[active] && <Details role={roles[active]} />}</AnimatePresence>
            </div>
          </div>
        )}

        {!isLoading && roles.length === 0 && (
          <p className="py-10 text-sm text-faint">{site.workEmpty}</p>
        )}
      </div>
    </section>
  )
}
