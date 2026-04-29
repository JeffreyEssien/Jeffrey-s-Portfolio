'use client'

import { motion } from 'framer-motion'
import { Typewriter } from 'react-simple-typewriter'
import useSWR from 'swr'
import { DEFAULT_HERO, getHero } from '../src/lib/content'

const Hero = () => {
  const { data } = useSWR('hero', getHero, { fallbackData: DEFAULT_HERO })
  const hero = data ?? DEFAULT_HERO

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-8 max-w-6xl mx-auto pt-32 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-3xl"
      >
        {hero.availabilityLabel && (
          <p className="text-sm text-neutral-500 mb-8 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            {hero.availabilityLabel}
          </p>
        )}

        <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.05] text-neutral-900 mb-8">
          {hero.greeting}{' '}
          <span className="font-serif italic font-normal">{hero.name}</span>.
          {hero.subheadline && (
            <>
              <br />
              <span className="text-neutral-400">{hero.subheadline}</span>
            </>
          )}
        </h1>

        {hero.taglines.length > 0 && (
          <p className="text-lg text-neutral-600 mb-12 max-w-xl leading-relaxed h-7">
            <Typewriter
              words={hero.taglines}
              loop
              cursor
              cursorStyle="|"
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1800}
            />
          </p>
        )}

        <div className="flex gap-3 flex-wrap">
          {hero.ctaPrimary && (
            <a href="#projects" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors duration-200">
              {hero.ctaPrimary}
              <span aria-hidden>→</span>
            </a>
          )}
          {hero.ctaSecondary && (
            <a href="#contact" className="inline-flex items-center px-6 py-3 rounded-full border border-neutral-300 text-sm font-medium text-neutral-900 hover:bg-neutral-100 transition-colors duration-200">
              {hero.ctaSecondary}
            </a>
          )}
        </div>
      </motion.div>
    </section>
  )
}

export default Hero
