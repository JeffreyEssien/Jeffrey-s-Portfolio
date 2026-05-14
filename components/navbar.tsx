'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { DEFAULT_SITE, getSite } from '../src/lib/content'

const Navbar = () => {
  const { data } = useSWR('site', getSite, { fallbackData: DEFAULT_SITE })
  const site = data ?? DEFAULT_SITE
  const sections = useMemo(() => [
    { id: 'hero', label: site.navHome },
    { id: 'about', label: site.navAbout },
    { id: 'work', label: site.navWork },
    { id: 'projects', label: site.navProjects },
    { id: 'contact', label: site.navContact },
  ], [site.navHome, site.navAbout, site.navWork, site.navProjects, site.navContact])
  const [active, setActive] = useState('hero')
  const [scrolled, setScrolled] = useState(false)

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
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#fafaf9]/80 backdrop-blur-md border-b border-neutral-200/60' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-5 flex justify-between items-center">
        <a href="#hero" className="text-sm font-semibold tracking-tight">{site.brand}</a>
        <ul className="flex items-center gap-8 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`transition-colors duration-200 ${
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
