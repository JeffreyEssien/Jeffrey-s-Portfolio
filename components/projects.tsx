'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import useSWR from 'swr'
import { publicAssetUrl } from '../src/lib/public-content'
import { publishedSite, publishedProjects, getPublicProjects, getPublicSite } from '../src/lib/public-content'
import { externalUrl, sortProjects } from '../src/lib/project-utils'
import type { Project } from '../src/lib/content'
import ProjectDialog from './project-dialog'

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const { data: projects, isLoading } = useSWR('projects', getPublicProjects, { fallbackData: publishedProjects })
  const { data: siteData } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const site = siteData ?? publishedSite

  return (
    <section id="projects" className="py-32 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">{site.projectsEyebrow}</p>
          </div>
          <div className="md:col-span-9">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-tight text-neutral-900 max-w-3xl">
              {site.projectsHeadlinePrefix}
              <span className="font-serif italic font-normal">{site.projectsHeadlineAccent}</span>
              {site.projectsHeadlineSuffix}
            </h2>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {isLoading && projects?.length === 0 && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-neutral-200 rounded-2xl mb-6" />
              <div className="h-5 bg-neutral-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
            </div>
          ))}

          {sortProjects(projects ?? []).map((p, i) => (
            <motion.article
              key={p.$id ?? i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
              className="group flex flex-col"
            >
              <button type="button" onClick={() => setSelectedProject(p)} aria-label={`View details for ${p.title}`} aria-haspopup="dialog" className="block w-full aspect-[4/3] bg-neutral-100 rounded-2xl overflow-hidden mb-6 ring-1 ring-neutral-200/60 transition-all duration-300 group-hover:ring-neutral-300 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                {p.imageFileId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicAssetUrl(p.imageFileId)}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-serif italic text-neutral-300">
                    {p.title.charAt(0) || '·'}
                  </div>
                )}
              </button>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {p.featured && <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Featured project</p>}
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">{p.title || 'Untitled'}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">{p.description}</p>
                  {!!p.technologies?.length && <p className="text-xs text-neutral-500 mt-3">{p.technologies.join(' · ')}</p>}
                </div>
              </div>
              <div className="mt-auto pt-6 flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => setSelectedProject(p)} aria-label={`Learn more about ${p.title}`} aria-haspopup="dialog" className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-700 transition-colors">
                  Learn more <span aria-hidden>+</span>
                </button>
                {externalUrl(p.link) && <a href={externalUrl(p.link)} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.title} live site`} className="px-2 py-3 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Visit live site ↗</a>}
              </div>
            </motion.article>
          ))}

          {!isLoading && projects?.length === 0 && (
            <p className="col-span-full text-neutral-500 text-sm">{site.projectsEmpty}</p>
          )}
        </div>
      </div>
      {selectedProject && <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </section>
  )
}

export default Projects
