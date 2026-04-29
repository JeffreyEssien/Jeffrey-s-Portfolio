'use client'

import { motion } from 'framer-motion'
import useSWR from 'swr'
import { DEFAULT_ABOUT, getAbout } from '../src/lib/content'

export default function About() {
  const { data } = useSWR('about', getAbout, { fallbackData: DEFAULT_ABOUT })
  const a = data ?? DEFAULT_ABOUT

  return (
    <section id="about" className="py-32 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">{a.eyebrow}</p>
          </div>
          <div className="md:col-span-9">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-tight text-neutral-900 max-w-3xl">
              {a.headlinePrefix}
              <span className="font-serif italic font-normal">{a.headlineAccent}</span>
              {a.headlineSuffix}
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-6 space-y-12"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-4">{a.educationLabel}</p>
              <p className="font-medium text-neutral-900">{a.educationDegree}</p>
              <p className="text-neutral-600 mt-1">{a.educationSchool}</p>
              <p className="text-sm text-neutral-500 mt-1">{a.educationPeriod}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-4">{a.certificationsLabel}</p>
              <ul className="space-y-3">
                {a.certifications.map((cert, i) => (
                  <li key={i} className="text-neutral-700 leading-relaxed">{cert}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-6 space-y-12"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-6">{a.skillsLabel}</p>
              <div className="space-y-5">
                {a.skills.map((skill, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-neutral-900">{skill.name}</span>
                      <span className="text-neutral-400 font-serif italic">{skill.level}</span>
                    </div>
                    <div className="w-full h-px bg-neutral-200 relative overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-px bg-neutral-900"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-4">{a.stackLabel}</p>
              <div className="flex flex-wrap gap-2">
                {a.technologies.map((tech, i) => (
                  <span key={i} className="px-3 py-1.5 text-sm border border-neutral-200 rounded-full text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors duration-200">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
