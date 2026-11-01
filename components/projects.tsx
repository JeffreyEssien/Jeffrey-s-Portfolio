'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { publicAssetUrl } from '../src/lib/public-content'
import { publishedSite, publishedProjects, getPublicProjects, getPublicSite } from '../src/lib/public-content'
import { externalUrl, sortProjects } from '../src/lib/project-utils'
import type { Project } from '../src/lib/content'
import ProjectDialog from './project-dialog'
import { Magnetic, Scramble, VelocityMarquee, trackPointer } from './effects'

function TiltImage({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const reduce = useReducedMotion()
  const rotateX = useSpring(0, { stiffness: 200, damping: 20 })
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 })

  return (
    <motion.div
      initial={{ clipPath: 'inset(12% 12% 12% 12% round 24px)', opacity: 0 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 24px)', opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`View details for ${project.title}`}
        aria-haspopup="dialog"
        style={{ rotateX, rotateY }}
        onPointerMove={(e) => {
          trackPointer(e)
          if (reduce || e.pointerType !== 'mouse') return
          const box = e.currentTarget.getBoundingClientRect()
          rotateY.set(((e.clientX - box.left) / box.width - 0.5) * 10)
          rotateX.set(-((e.clientY - box.top) / box.height - 0.5) * 10)
        }}
        onPointerLeave={() => { rotateX.set(0); rotateY.set(0) }}
        className="group/img relative block w-full aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]"
      >
        {project.imageFileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={publicAssetUrl(project.imageFileId)}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl font-serif italic text-accent/40">
            {project.title.charAt(0) || '·'}
          </div>
        )}
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/img:opacity-100 bg-[radial-gradient(500px_circle_at_var(--mx)_var(--my),rgba(255,255,255,0.18),transparent_45%)]" />
        <span aria-hidden className="absolute bottom-5 right-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg text-xl scale-0 transition-transform duration-300 group-hover/img:scale-100">↗</span>
      </motion.button>
    </motion.div>
  )
}

// The pitch's first sentence, so cards never cut off mid-thought.
const lead = (text: string) => text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text

const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }

// Cards pin one after another and the ones underneath sink back as the stack grows.
function StackCard({ index, total, progress, children }: { index: number; total: number; progress: MotionValue<number>; children: React.ReactNode }) {
  const scale = useTransform(progress, [index / total, 1], [1, 1 - (total - index - 1) * 0.05])
  const dim = useTransform(progress, [index / total, 1], [0, (total - index - 1) * 0.25])
  return (
    <div className={`md:sticky ${index < total - 1 ? 'md:h-[calc(100svh-6rem)]' : ''}`} style={{ top: `${96 + index * 28}px` }}>
      <motion.article style={{ scale }} className="relative w-full origin-top rounded-[32px] border border-line bg-surface p-6 md:p-10 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.9)]">
        {children}
        <motion.div aria-hidden style={{ opacity: dim }} className="pointer-events-none absolute inset-0 rounded-[32px] bg-black" />
      </motion.article>
    </div>
  )
}

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const { data: projects, isLoading } = useSWR('projects', getPublicProjects, { fallbackData: publishedProjects })
  const { data: siteData } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const site = siteData ?? publishedSite
  const sorted = sortProjects(projects ?? [])
  const stack = useRef<HTMLDivElement>(null)

  // The console can open a case study by id.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const p = sorted.find((x) => x.$id === (e as CustomEvent).detail)
      if (p) setSelectedProject(p)
    }
    window.addEventListener('open-project', onOpen)
    return () => window.removeEventListener('open-project', onOpen)
  }, [sorted])
  const { scrollYProgress } = useScroll({ target: stack, offset: ['start start', 'end end'] })

  return (
    <section id="projects" className="pb-32 md:pb-40">
      <VelocityMarquee text={site.projectsEyebrow} />
      <div className="max-w-6xl mx-auto px-6 md:px-8 pt-8">
        <div className="grid md:grid-cols-12 gap-8 mb-24">
          <div className="md:col-span-3">
            <Scramble text={site.projectsEyebrow} className="text-xs uppercase tracking-[0.2em] text-accent" />
          </div>
          <div className="md:col-span-9">
            <h2 className="text-4xl md:text-7xl font-medium tracking-tight leading-[1.02] text-fg max-w-3xl">
              {site.projectsHeadlinePrefix}
              <span className="font-serif italic font-normal text-accent">{site.projectsHeadlineAccent}</span>
              {site.projectsHeadlineSuffix}
            </h2>
          </div>
        </div>

        <div ref={stack} className="space-y-8 md:space-y-0">
          {isLoading && projects?.length === 0 && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="grid md:grid-cols-12 gap-10 animate-pulse">
              <div className="md:col-span-7 aspect-[4/3] bg-white/5 rounded-3xl" />
              <div className="md:col-span-5 space-y-3">
                <div className="h-8 bg-white/10 rounded w-1/2" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
              </div>
            </div>
          ))}

          {sorted.map((p, i) => (
            <StackCard key={p.$id ?? i} index={i} total={sorted.length} progress={scrollYProgress}>
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className={`md:col-span-7 ${i % 2 ? 'md:order-2' : ''}`}>
                <TiltImage project={p} onOpen={() => setSelectedProject(p)} />
                {!!p.features?.length && (
                  <ul className="mt-6 space-y-2.5" aria-label="What I built">
                    {p.features.filter((f) => f.trim()).slice(0, 3).map((f, k) => (
                      <li key={k} className="flex gap-3 text-sm text-muted leading-relaxed">
                        <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span className="line-clamp-2">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`md:col-span-5 ${i % 2 ? 'md:order-1' : ''}`}
              >
                <p className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-faint mb-6">
                  <span className="text-accent tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="h-px w-8 bg-line" aria-hidden />
                  <span className="tabular-nums">{String(sorted.length).padStart(2, '0')}</span>
                  {externalUrl(p.link) && (
                    <span className="ml-auto inline-flex items-center gap-2 normal-case tracking-normal text-muted">
                      <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-accent" /></span>
                      {host(externalUrl(p.link))}
                    </span>
                  )}
                  {p.featured && <span className="ml-2 rounded-full border border-accent/40 px-2 py-0.5 text-accent normal-case tracking-normal">Featured project</span>}
                </p>
                <h3 className="text-4xl md:text-5xl font-medium tracking-tight text-fg mb-5">{p.title || 'Untitled'}</h3>
                <p className="text-fg/80 text-lg leading-relaxed">{lead(p.description)}</p>
                {!!p.steps?.length && (
                  <ol aria-label="User journey" className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
                    {p.steps.filter((s) => s.title.trim()).map((s, k) => (
                      <li key={k} className="flex items-center gap-2">
                        {k > 0 && <span aria-hidden className="text-accent/60">→</span>}
                        <span className="rounded-full border border-line bg-bg/40 px-3 py-1 text-muted">{s.title}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {!!p.technologies?.length && (
                  <ul className="flex flex-wrap gap-2 mt-6">
                    {p.technologies.map((tech, t) => <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-muted">{tech}</li>)}
                  </ul>
                )}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Magnetic>
                    <button type="button" onClick={() => setSelectedProject(p)} aria-label={`Learn more about ${p.title}`} aria-haspopup="dialog" className="inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg hover:bg-accent transition-colors duration-200">
                      Read the case study <span aria-hidden>+</span>
                    </button>
                  </Magnetic>
                  {externalUrl(p.link) && (
                    <a href={externalUrl(p.link)} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.title} live site`} className="group inline-flex items-center gap-1 px-2 py-3 text-sm text-muted hover:text-accent transition-colors">
                      Visit live site <span aria-hidden className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
            </StackCard>
          ))}

          {!isLoading && projects?.length === 0 && (
            <p className="text-faint text-sm">{site.projectsEmpty}</p>
          )}
        </div>
      </div>
      {selectedProject && <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </section>
  )
}

export default Projects
