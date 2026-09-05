'use client'

import Navbar from '../../components/navbar'
import Hero from '../../components/hero'
import About from '../../components/about'
import Work from '../../components/work'
import Projects from '../../components/projects'
import Contact from '../../components/contacts'

export default function Home() {
  return (
    <>
      <Navbar />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-white focus:p-4">Skip to content</a>
      <main id="main-content" className="scroll-smooth" tabIndex={-1}>
        <section id="hero">
          <Hero />
        </section>
        <About />
        <Work />
        <Projects />
        <Contact />
      </main>
    </>
  )
}
