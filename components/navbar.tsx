'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { publishedSite, getPublicSite } from '../src/lib/public-content'

const Navbar = () => {
  const { data } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const site = data ?? publishedSite
  const sections = useMemo(() => [
    { id: 'hero', label: site.navHome },
    { id: 'about', label: site.navAbout },
    { id: 'work', label: site.navWork },
    { id: 'projects', label: site.navProjects },
    { id: 'ops', label: 'Live' },
    { id: 'contact', label: site.navContact },
  ], [site.navHome, site.navAbout, site.navWork, site.navProjects, site.navContact])
  const [active, setActive] = useState('hero')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus() }
    }
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize) }
  }, [open])

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(y > 16)
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && y >= el.offsetTop - 120) setActive(s.id)
      }
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || open ? 'bg-bg/70 backdrop-blur-xl border-b border-line' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
        <a href="#hero" onClick={() => setOpen(false)} className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-fg">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent transition-transform duration-300 group-hover:scale-150" />
          {site.brand}
        </a>
        <button ref={menuButton} type="button" aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)} className="md:hidden min-h-10 px-4 rounded-full border border-line text-sm text-fg hover:bg-white/5">
          {open ? 'Close menu' : 'Menu'}
        </button>
        <ul id="public-navigation" className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col items-stretch gap-1 border-b border-line bg-bg/95 backdrop-blur-xl px-6 pb-6 text-sm md:static md:flex md:flex-row md:items-center md:gap-1 md:rounded-full md:border md:border-line md:bg-surface/60 md:p-1`}>
          {sections.map((s) => (
            <li key={s.id} className="relative">
              {active === s.id && (
                <motion.span layoutId="nav-active" aria-hidden className="absolute inset-0 hidden md:block rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
              )}
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? 'location' : undefined}
                onClick={() => setOpen(false)}
                className={`relative block py-3 md:py-2 md:px-4 transition-colors duration-200 ${
                  active === s.id ? 'text-fg' : 'text-faint hover:text-fg'
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
