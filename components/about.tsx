'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import useSWR from 'swr'
import { publishedAbout, getPublicAbout } from '../src/lib/public-content'
import { Scramble, WordReveal, trackPointer } from './effects'

function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const controls = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { el.textContent = String(Math.round(v)) } })
    return () => controls.stop()
  }, [inView, to])
  return <span ref={ref}>0</span>
}

export default function About() {
  const { data } = useSWR('about', getPublicAbout, { fallbackData: publishedAbout })
  const a = data ?? publishedAbout
  const half = Math.ceil(a.technologies.length / 2)
  const rows = [a.technologies.slice(0, half), a.technologies.slice(half)].filter((r) => r.length)

  return (
    <section id="about" className="py-32 md:py-40">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-12 gap-8 mb-24">
          <div className="md:col-span-3">
            <Scramble text={a.eyebrow} className="text-xs uppercase tracking-[0.2em] text-accent" />
          </div>
          <div className="md:col-span-9">
            <h2 className="text-3xl md:text-6xl font-medium tracking-tight leading-[1.08] text-fg max-w-4xl">
              <WordReveal parts={[{ text: a.headlinePrefix }, { text: a.headlineAccent, accent: true }, { text: a.headlineSuffix }]} />
            </h2>
          </div>
        </div>

        {a.extraParagraph?.trim() && (
          <div className="grid md:grid-cols-12 gap-8 mb-32">
            <div className="md:col-span-3">
              {a.extraHeading?.trim() && (
                <p className="text-xs uppercase tracking-[0.2em] text-faint">{a.extraHeading}</p>
              )}
            </div>
            <div className="md:col-span-9 relative">
              <span aria-hidden className="absolute -top-10 -left-2 md:-left-10 font-serif italic text-8xl md:text-9xl leading-none text-accent/30 select-none">“</span>
              <p className="relative font-serif italic text-2xl md:text-4xl leading-[1.3] text-fg max-w-3xl">
                <WordReveal parts={[{ text: a.extraParagraph }]} />
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-5 space-y-6"
          >
            <div onPointerMove={trackPointer} className="spotlight rounded-3xl border border-line bg-surface/50 p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-faint mb-6">{a.educationLabel}</p>
              <p className="text-xl font-medium text-fg">{a.educationDegree}</p>
              <p className="text-muted mt-2">{a.educationSchool}</p>
              <p className="text-sm text-faint mt-1 font-serif italic">{a.educationPeriod}</p>
            </div>

            <div onPointerMove={trackPointer} className="spotlight rounded-3xl border border-line bg-surface/50 p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-faint mb-6">{a.certificationsLabel}</p>
              <ul className="space-y-4">
                {a.certifications.map((cert, i) => (
                  <li key={i} className="flex gap-4 text-muted leading-relaxed">
                    <span className="text-xs text-accent tabular-nums pt-1">{String(i + 1).padStart(2, '0')}</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onPointerMove={trackPointer}
            className="spotlight md:col-span-7 rounded-3xl border border-line bg-surface/50 p-8"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-faint mb-8">{a.skillsLabel}</p>
            <div className="space-y-6">
              {a.skills.map((skill, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-fg">{skill.name}</span>
                    <span className="text-sm text-faint tabular-nums"><Count to={skill.level} />%</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/5 relative overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent/40 to-accent shadow-[0_0_12px_var(--accent)]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-24">
          <p className="max-w-6xl mx-auto px-6 md:px-8 text-xs uppercase tracking-[0.2em] text-faint mb-8">{a.stackLabel}</p>
          <div className="marquee overflow-hidden border-y border-line py-6 space-y-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            {rows.map((row, r) => (
              <div key={r} className="marquee-track" data-reverse={r % 2 ? '' : undefined} style={{ '--marquee-duration': `${30 + r * 8}s` } as React.CSSProperties}>
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
                    {row.map((tech, i) => (
                      <li key={i} className="flex items-center text-3xl md:text-5xl font-medium tracking-tight text-fg/80 hover:text-accent transition-colors duration-200 whitespace-nowrap">
                        <span className={r % 2 ? 'font-serif italic font-normal' : ''}>{tech}</span>
                        <span aria-hidden className="mx-8 text-accent text-2xl">✦</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
