import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getPublicAbout, getPublicContact, getPublicHero, getPublicProjects, getPublicSite, getPublicWork, publicAssetUrl,
} from '../../lib/public-content'
import { externalUrl, sortProjects } from '../../lib/project-utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSite()
  return { title: `${site.metaTitle} (simple)`, description: site.metaDescription }
}

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties

export default async function SimplePage() {
  const [site, hero, about, contact, projects, work] = await Promise.all([
    getPublicSite(), getPublicHero(), getPublicAbout(), getPublicContact(), getPublicProjects(), getPublicWork(),
  ])
  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(contact.ctaSubject)}`
  const cvHref = contact.cvFileId ? publicAssetUrl(contact.cvFileId) : '/Jeffrey_Essien_CV.pdf'
  const copyright = (site.footerCopyright || '').replace('{year}', String(new Date().getFullYear()))
  const [first, ...rest] = site.brand.split(' ')
  const eyebrow = 'text-xs uppercase tracking-[0.25em] text-accent mb-8'

  return (
    <main className="site relative min-h-screen overflow-hidden">
      <div aria-hidden className="grain" />
      <div aria-hidden className="aurora -top-40 -left-32 h-[480px] w-[480px] bg-accent/20" />
      <div aria-hidden className="aurora top-40 -right-40 h-[420px] w-[420px] bg-violet-500/20 [animation-delay:-6s]" />

      <div className="relative max-w-3xl mx-auto px-6">
        <header className="min-h-[92svh] flex flex-col justify-center py-24">
          <p className="rise inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface/60 px-4 py-2 text-sm text-muted backdrop-blur" style={delay(0)}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {hero.availabilityLabel}
          </p>
          <h1 className="mt-8 text-[18vw] sm:text-8xl md:text-9xl font-medium tracking-[-0.05em] leading-[0.9]">
            <span className="rise block" style={delay(120)}><span className="text-shine">{first}</span></span>
            <span className="rise block font-serif italic font-normal text-accent" style={delay(240)}>{rest.join(' ')}.</span>
          </h1>
          <p className="rise mt-8 max-w-xl text-lg md:text-xl text-muted leading-relaxed" style={delay(380)}>{hero.subheadline}</p>
          <div className="rise mt-10 flex flex-wrap gap-3" style={delay(500)}>
            <a href={mailto} className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 font-medium text-accent-fg shadow-[0_0_40px_-8px_var(--accent)] transition-transform duration-200 hover:-translate-y-0.5">
              Email me <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </a>
            <a href={cvHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-6 py-3.5 text-fg backdrop-blur transition-colors duration-200 hover:bg-surface">{contact.ctaCvLabel || 'Download CV'}</a>
          </div>
        </header>
      </div>

      {hero.taglines.length > 0 && (
        <div aria-hidden className="marquee relative border-y border-line py-5 overflow-hidden">
          <div className="marquee-track" style={{ '--marquee-duration': '30s' } as React.CSSProperties}>
            {[...hero.taglines, ...hero.taglines].map((tag, i) => (
              <span key={i} className="flex items-center whitespace-nowrap text-2xl md:text-3xl text-fg/80">
                {tag}<span className="mx-6 font-serif italic text-accent">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-6">
        <section aria-labelledby="simple-projects" className="py-24">
          <h2 id="simple-projects" className={eyebrow}>{site.navProjects}</h2>
          <ul className="grid gap-16">
            {sortProjects(projects).map((project, i) => {
              const live = externalUrl(project.link)
              return (
                <li key={project.$id} className="reveal group">
                  <Link href={`/projects/${project.$id}`} className="block overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
                    {project.imageFileId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicAssetUrl(project.imageFileId)} alt={project.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="aspect-[16/10] flex items-center justify-center font-serif italic text-8xl text-accent/40">{project.title.charAt(0)}</div>
                    )}
                  </Link>
                  <div className="mt-6 flex items-baseline gap-4">
                    <span className="font-serif italic text-accent text-xl">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-fg">{project.title}</h3>
                  </div>
                  <p className="mt-3 text-muted leading-relaxed line-clamp-4">{project.description}</p>
                  <p className="mt-4 flex gap-6 text-sm">
                    {live && <a href={live} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline underline-offset-4">Visit site ↗</a>}
                    <Link href={`/projects/${project.$id}`} className="text-fg hover:underline underline-offset-4">Case study →</Link>
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="simple-work" className="py-24 border-t border-line">
          <h2 id="simple-work" className={eyebrow}>{site.navWork}</h2>
          <ol className="relative border-l border-line ml-1.5 grid gap-12">
            {[...work].sort((a, b) => a.order - b.order).map((entry) => {
              const current = /present/i.test(entry.period)
              return (
                <li key={entry.$id} className="reveal relative pl-8">
                  <span aria-hidden className={`absolute -left-[7px] top-2 h-3 w-3 rounded-full ${current ? 'bg-accent shadow-[0_0_16px_var(--accent)]' : 'bg-line border border-faint'}`} />
                  <p className="text-sm text-faint">{entry.period}{entry.location ? ` · ${entry.location}` : ''}</p>
                  <h3 className="mt-1 text-xl font-medium text-fg">{entry.role} <span className="font-serif italic font-normal text-accent">at</span> {entry.company}</h3>
                  <p className="mt-2 text-muted leading-relaxed line-clamp-3">{entry.description}</p>
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-labelledby="simple-about" className="py-24 border-t border-line">
          <h2 id="simple-about" className={eyebrow}>{about.eyebrow}</h2>
          <p className="reveal text-3xl md:text-4xl font-medium tracking-tight leading-tight text-fg">
            {about.headlinePrefix}<span className="font-serif italic font-normal text-accent">{about.headlineAccent}</span>{about.headlineSuffix}
          </p>
          <div className="reveal mt-12 rounded-2xl border border-line bg-surface/60 p-6 backdrop-blur">
            <p className="text-fg font-medium">{about.educationDegree}</p>
            <p className="text-muted">{about.educationSchool} · {about.educationPeriod}</p>
          </div>
          {about.technologies.length > 0 && (
            <ul className="reveal mt-8 flex flex-wrap gap-2">
              {about.technologies.map((tech) => (
                <li key={tech} className="rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors duration-200 hover:border-accent hover:text-accent">{tech}</li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="simple-contact" className="py-24 border-t border-line text-center">
          <h2 id="simple-contact" className="reveal text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-fg">
            {contact.headlinePrefix}<span className="font-serif italic font-normal text-accent">{contact.headlineAccent}</span>{contact.headlineSuffix}
          </h2>
          <a href={mailto} className="reveal mt-10 inline-block font-serif italic text-2xl md:text-3xl text-accent underline decoration-accent/30 underline-offset-8 transition-colors duration-200 hover:decoration-accent break-all">{contact.email}</a>
        </section>

        <footer className="border-t border-line py-8 text-sm text-faint flex flex-wrap justify-between gap-4">
          <span>{copyright}</span>
          <Link href="/" className="text-fg hover:text-accent transition-colors duration-200">View the full experience →</Link>
        </footer>
      </div>
    </main>
  )
}
