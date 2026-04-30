'use client'

import { motion } from 'framer-motion'
import useSWR from 'swr'
import { fileUrl } from '../src/lib/appwrite'
import { DEFAULT_SITE, getProjects, getSite } from '../src/lib/content'

const normalizeUrl = (u: string) => {
  const v = (u || '').trim()
  if (!v) return '#'
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('//')) return 'https:' + v
  return 'https://' + v
}

const Projects = () => {
  const { data: projects, isLoading } = useSWR('projects', getProjects, { fallbackData: [] })
  const { data: siteData } = useSWR('site', getSite, { fallbackData: DEFAULT_SITE })
  const site = siteData ?? DEFAULT_SITE

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

          {projects?.map((p, i) => (
            <motion.a
              key={p.$id ?? i}
              href={normalizeUrl(p.link)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
              className="group block"
            >
              <div className="aspect-[4/3] bg-neutral-100 rounded-2xl overflow-hidden mb-6 ring-1 ring-neutral-200/60 transition-all duration-300 group-hover:ring-neutral-300 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                {p.imageFileId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(p.imageFileId)}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-serif italic text-neutral-300">
                    {p.title.charAt(0) || '·'}
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">{p.title || 'Untitled'}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">{p.description}</p>
                </div>
                <span className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all duration-200 mt-1" aria-hidden>↗</span>
              </div>
            </motion.a>
          ))}

          {!isLoading && projects?.length === 0 && (
            <p className="col-span-full text-neutral-500 text-sm">{site.projectsEmpty}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default Projects
