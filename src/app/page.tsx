'use client'

import Navbar from '../../components/navbar'
import Hero from '../../components/hero'
import About from '../../components/about'
import Projects from '../../components/projects'
import Contact from '../../components/contacts'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="scroll-smooth">
        <section id="hero">
          <Hero />
        </section>
        <section id="about">
          <About />
        </section>
        <section id="projects">
          <Projects />
        </section>
        <section id="contact">
          <Contact />
        </section>
      </main>
    </>
  )
}
