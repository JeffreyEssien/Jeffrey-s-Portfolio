'use client'

import { motion } from 'framer-motion'
import useSWR from 'swr'
import { DEFAULT_SITE, getSite, getWorkEntries } from '../src/lib/content'

export default function Work() {
  const { data: siteData } = useSWR('site', getSite, { fallbackData: DEFAULT_SITE })
  const { data: entries, isLoading } = useSWR('work', getWorkEntries, { fallbackData: [] })
  const site = siteData ?? DEFAULT_SITE
  const items = entries ?? []

  return (
    <section id="work" className="py-32 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">{site.workEyebrow}</p>
          </div>
          <div className="md:col-span-9">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-tight text-neutral-900 max-w-3xl">
              {site.workHeadlinePrefix}
              <span className="font-serif italic font-normal">{site.workHeadlineAccent}</span>
              {site.workHeadlineSuffix}
            </h2>
          </div>
        </div>

        <div className="divide-y divide-neutral-200">
          {isLoading && items.length === 0 && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="grid md:grid-cols-12 gap-8 py-10 animate-pulse">
              <div className="md:col-span-3 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
              <div className="md:col-span-9 space-y-3">
                <div className="h-5 bg-neutral-200 rounded w-1/3" />
                <div className="h-4 bg-neutral-200 rounded w-1/4" />
                <div className="h-4 bg-neutral-200 rounded w-full" />
                <div className="h-4 bg-neutral-200 rounded w-5/6" />
              </div>
            </div>
          ))}

          {items.map((entry, i) => (
            <motion.div
              key={entry.$id ?? i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="grid md:grid-cols-12 gap-8 py-10"
            >
              <div className="md:col-span-3">
                <p className="text-sm text-neutral-500 leading-relaxed">{entry.period}</p>
                {entry.location && (
                  <p className="text-xs text-neutral-500 mt-1">{entry.location}</p>
                )}
              </div>
              <div className="md:col-span-9">
                <h3 className="text-lg font-medium text-neutral-900">{entry.role}</h3>
                <p className="text-neutral-600 mt-1">{entry.company}</p>
                {entry.description && (
                  <p className="text-sm text-neutral-600 leading-relaxed mt-4 whitespace-pre-line">
                    {entry.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}

          {!isLoading && items.length === 0 && (
            <p className="py-10 text-sm text-neutral-500">{site.workEmpty}</p>
          )}
        </div>
      </div>
    </section>
  )
}
