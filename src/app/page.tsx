'use client'

import Navbar from '../../components/navbar'
import Hero from '../../components/hero'
import About from '../../components/about'
import Work from '../../components/work'
import Projects from '../../components/projects'
import Contact from '../../components/contacts'
import { Cursor, Grain, Preloader, ScrollProgress } from '../../components/effects'
import dynamic from 'next/dynamic'
import Ops from '../../components/ops'
import Console from '../../components/console'
import ViewChooser from '../../components/view-chooser'
import { publishedHero, publishedSite } from '../lib/public-content'

const Scene = dynamic(() => import('../../components/scene'), { ssr: false })

export default function Home() {
  return (
    <div className="site">
      <ViewChooser name={publishedSite.brand} />
      <Preloader label={publishedSite.brand} />
      <Scene name={`${publishedHero.name}.`} />
      <ScrollProgress />
      <Navbar />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-surface focus:p-4">Skip to content</a>
      <main id="main-content" className="relative z-10 scroll-smooth" tabIndex={-1}>
        <section id="hero">
          <Hero />
        </section>
        <About />
        <Work />
        <Projects />
        <Ops />
        <Contact />
      </main>
      <Console />
      <Grain />
      <Cursor />
    </div>
  )
}
