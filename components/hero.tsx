'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useSWR from 'swr'
import { publishedHero, getPublicHero } from '../src/lib/public-content'
import ParticleName, { fitName } from './particle-name'
import { Magnetic, useIntroDone, useWebgl } from './effects'

const EASE = [0.22, 1, 0.36, 1] as const

function lagosTime() {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date())
}

const Hero = () => {
  const { data } = useSWR('hero', getPublicHero, { fallbackData: publishedHero })
  const hero = data ?? publishedHero
  const [tagline, setTagline] = useState(0)
  const [time, setTime] = useState('')
  const ready = useIntroDone()
  const webgl = useWebgl()
  const anchor = useRef<HTMLSpanElement>(null)
  const [nameHeight, setNameHeight] = useState<number>()

  // Reserve exactly the space the particle name will occupy (WebGL draws it from behind).
  useEffect(() => {
    const el = anchor.current
    if (!el) return
    const measure = () => {
      const family = getComputedStyle(document.body).getPropertyValue('--font-serif').trim() || 'Georgia, serif'
      setNameHeight(fitName(`${hero.name}.`, el.clientWidth, family).height)
    }
    document.fonts.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [hero.name])

  useEffect(() => {
    if (hero.taglines.length < 2) return
    const id = setInterval(() => setTagline((i) => (i + 1) % hero.taglines.length), 2400)
    return () => clearInterval(id)
  }, [hero.taglines.length])

  useEffect(() => {
    setTime(lagosTime())
    const id = setInterval(() => setTime(lagosTime()), 30000)
    return () => clearInterval(id)
  }, [])

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.8, delay, ease: EASE },
  })

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-8 pt-28 pb-24 min-h-[100svh] flex flex-col justify-center">
        <motion.div {...enter(0)} className="flex flex-wrap items-center justify-between gap-4 mb-8 md:mb-10">
          {hero.availabilityLabel && (
            <p className="inline-flex items-center gap-3 rounded-full border border-line bg-surface/60 backdrop-blur px-4 py-2 text-sm text-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              {hero.availabilityLabel}
            </p>
          )}
          {time && <p className="text-xs uppercase tracking-[0.2em] text-faint tabular-nums">Lagos, NG · {time} WAT</p>}
        </motion.div>

        <h1 className="text-fg">
          <span className="block overflow-hidden">
            <motion.span
              className="block text-[clamp(2rem,6vw,4.5rem)] font-medium tracking-[-0.04em] leading-none"
              initial={{ y: '110%' }}
              animate={ready ? { y: 0 } : undefined}
              transition={{ duration: 1, ease: EASE }}
            >
              {hero.greeting}
            </motion.span>
          </span>
          <span className="sr-only">{hero.name}.</span>
          <span ref={anchor} data-name-anchor className="block -mt-[2vw] -ml-1" style={{ height: webgl === 'off' ? undefined : nameHeight ?? '22vw' }}>
            {webgl === 'off' && <ParticleName text={`${hero.name}.`} play={ready} />}
          </span>
        </h1>

        <div className="mt-4 grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7">
            {hero.subheadline && (
              <motion.p {...enter(0.35)} className="text-xl md:text-2xl font-medium tracking-tight leading-snug text-muted max-w-2xl">
                {hero.subheadline}
              </motion.p>
            )}

            {hero.taglines.length > 0 && (
              <motion.div {...enter(0.5)} className="mt-6 flex items-center gap-3 text-base md:text-lg text-fg">
                <span className="h-px w-10 bg-accent" aria-hidden />
                <span className="relative h-7 overflow-hidden flex-1" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={tagline}
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '-100%', opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="absolute inset-0 whitespace-nowrap font-mono text-sm md:text-base uppercase tracking-wider"
                    >
                      {hero.taglines[tagline]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.div>
            )}
          </div>

          <motion.div {...enter(0.65)} className="md:col-span-5 flex gap-3 flex-wrap md:justify-end">
            {hero.ctaPrimary && (
              <Magnetic>
                <a href="#projects" className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-accent text-accent-fg text-sm font-semibold hover:shadow-[0_0_40px_-4px_var(--accent)] transition-shadow duration-300">
                  {hero.ctaPrimary}
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </Magnetic>
            )}
            {hero.ctaSecondary && (
              <Magnetic>
                <a href="#contact" className="inline-flex items-center px-7 py-4 rounded-full border border-line text-sm font-medium text-fg hover:border-fg/40 hover:bg-white/5 transition-colors duration-200">
                  {hero.ctaSecondary}
                </a>
              </Magnetic>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-console', { detail: 'terminal' }))}
              className="inline-flex items-center gap-2 px-5 py-4 rounded-full font-mono text-xs text-muted hover:text-accent transition-colors"
            >
              <span aria-hidden className="text-accent">&gt;_</span> open terminal
            </button>
          </motion.div>
        </div>

        <motion.a
          href="#about"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-8 left-6 md:left-8 hidden sm:flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-faint hover:text-fg transition-colors"
        >
          <span className="relative h-10 w-px overflow-hidden bg-line">
            <motion.span
              className="absolute left-0 top-0 h-1/2 w-px bg-accent"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
          Scroll
        </motion.a>
      </div>
    </div>
  )
}

export default Hero
