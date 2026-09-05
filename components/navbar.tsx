'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'
import { publishedSite, getPublicSite } from '../src/lib/public-content'

const Navbar = () => {
  const { data } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const site = data ?? publishedSite
  const sections = useMemo(() => [
    { id: 'hero', label: site.navHome },
    { id: 'about', label: site.navAbout },
    { id: 'work', label: site.navWork },
    { id: 'projects', label: site.navProjects },
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
        scrolled || open ? 'bg-[#fafaf9]/95 backdrop-blur-md border-b border-neutral-200/60' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-5 flex justify-between items-center">
        <a href="#hero" onClick={() => setOpen(false)} className="text-sm font-semibold tracking-tight">{site.brand}</a>
        <button ref={menuButton} type="button" aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)} className="md:hidden min-h-10 px-4 rounded-lg border border-neutral-300 text-sm">
          {open ? 'Close menu' : 'Menu'}
        </button>
        <ul id="public-navigation" className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col items-stretch gap-2 border-b border-neutral-200 bg-[#fafaf9] px-6 pb-6 text-sm md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0`}>
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? 'location' : undefined}
                onClick={() => setOpen(false)}
                className={`block py-3 md:py-0 transition-colors duration-200 ${
                  active === s.id ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
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
