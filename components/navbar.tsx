'use client'

import { useState, useEffect } from 'react'

const sections = ['hero', 'about', 'projects', 'contact']

const Navbar = () => {
  const [active, setActive] = useState<string>('hero')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      for (let id of sections) {
        const el = document.getElementById(id)
        if (el && scrollY >= el.offsetTop - 100) {
          setActive(id)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/50 backdrop-blur z-50 px-6 py-4 shadow-lg">
      <ul className="flex justify-center gap-8 text-sm md:text-base text-white font-semibold">
        {sections.map((section) => (
          <li key={section}>
            <a
              href={`#${section}`}
              className={`relative px-2 py-1 transition-all duration-300 ${
                active === section ? 'text-indigo-400' : 'text-white hover:text-indigo-300'
              }`}
            >
              <span className="capitalize">{section}</span>
              {active === section && (
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-indigo-400 animate-pulse" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
