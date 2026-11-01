'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import useSWR from 'swr'
import { publishedSite, publishedWork, getPublicSite, getPublicWork } from '../src/lib/public-content'
import type { WorkEntry } from '../src/lib/content'
import { Scramble } from './effects'

const PREVIEW = 2
const METRIC = /(\d+(?:\.\d+)?\s?(?:%|\+|\s(?:hours?|minutes|applications|projects)\+?))/g

function Highlight({ text }: { text: string }) {
  return <>{text.split(METRIC).map((part, i) => i % 2 ? <span key={i} className="text-accent font-medium">{part}</span> : part)}</>
}

function Entry({ entry, index }: { entry: WorkEntry; index: number }) {
  const [open, setOpen] = useState(false)
  const lines = (entry.description ?? '').split('\n').map((l) => l.replace(/^\s*•\s*/, '').trim()).filter(Boolean)
  const bulleted = (entry.description ?? '').includes('•')
  const shown = open ? lines : lines.slice(0, PREVIEW)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative grid md:grid-cols-12 gap-4 md:gap-8 py-12 pl-10 md:pl-0"
    >
      <span aria-hidden className="absolute left-0 md:left-[calc(25%-5px)] top-14 h-2.5 w-2.5 rounded-full border border-accent bg-bg transition-colors duration-300 group-hover:bg-accent" />
      <div className="md:col-span-3 md:pr-10">
        <p className="text-sm text-muted leading-relaxed">{entry.period}</p>
        {entry.location && <p className="text-xs text-faint mt-1">{entry.location}</p>}
      </div>
      <div className="md:col-span-9 md:pl-6">
        <p className="text-xs text-faint tabular-nums mb-3">{String(index + 1).padStart(2, '0')}</p>
        <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-fg">{entry.role}</h3>
        <p className="font-serif italic text-lg text-accent mt-1">{entry.company}</p>
        {lines.length > 0 && (
          bulleted ? (
            <ul className="mt-6 space-y-3 max-w-2xl">
              <AnimatePresence initial={false}>
                {shown.map((line, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 text-sm md:text-base text-muted leading-relaxed overflow-hidden"
                  >
                    <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-faint" />
                    <span><Highlight text={line} /></span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="mt-6 text-sm md:text-base text-muted leading-relaxed whitespace-pre-line max-w-2xl"><Highlight text={entry.description ?? ''} /></p>
          )
        )}
        {bulleted && lines.length > PREVIEW && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-fg hover:border-accent hover:text-accent transition-colors duration-200"
          >
            {open ? 'Show less' : `Show ${lines.length - PREVIEW} more`}
            <span aria-hidden className={`transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function Work() {
  const { data: siteData } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const { data: entries, isLoading } = useSWR('work', getPublicWork, { fallbackData: publishedWork })
  const site = siteData ?? publishedSite
  const items = entries ?? []
  const list = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="work" className="py-32 md:py-40 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-16">
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

        <div ref={list} className="relative">
          <div aria-hidden className="absolute left-[4px] md:left-[25%] top-0 bottom-0 w-px bg-line">
            <motion.div style={{ scaleY: fill }} className="h-full w-full origin-top bg-accent" />
          </div>

          {isLoading && items.length === 0 && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="grid md:grid-cols-12 gap-8 py-12 pl-10 md:pl-0 animate-pulse">
              <div className="md:col-span-3 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
              <div className="md:col-span-9 md:pl-6 space-y-3">
                <div className="h-6 bg-white/10 rounded w-1/3" />
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-4 bg-white/10 rounded w-full" />
              </div>
            </div>
          ))}

          {items.map((entry, i) => <Entry key={entry.$id ?? i} entry={entry} index={i} />)}

          {!isLoading && items.length === 0 && (
            <p className="py-10 pl-10 md:pl-0 text-sm text-faint">{site.workEmpty}</p>
          )}
        </div>
      </div>
    </section>
  )
}
