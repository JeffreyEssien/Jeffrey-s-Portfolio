import type { Project } from '../src/lib/content'
import { publicAssetUrl } from '../src/lib/public-content'
import { externalUrl } from '../src/lib/project-utils'

const label = 'font-mono text-xs uppercase tracking-[0.2em] text-faint'

export default function ProjectDetails({ project, imageUrl, titleId, embedded = false }: { project: Project; imageUrl?: string; titleId?: string; embedded?: boolean }) {
  const Heading = embedded ? 'h2' : 'h1'
  const SectionHeading = embedded ? 'h3' : 'h2'
  const live = externalUrl(project.link)
  const source = externalUrl(project.sourceUrl)
  const features = (project.features ?? []).filter((f) => f.trim())
  const steps = (project.steps ?? []).filter((s) => s.title.trim() || s.body.trim())
  const notes = [
    ['My approach', project.solution],
    ['Results & lessons', project.results],
  ].filter(([, body]) => body?.trim())

  return (
    <article className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-fg">
      <p className={`${label} mb-6`}>Project case study</p>
      <Heading id={titleId} className="text-4xl md:text-6xl tracking-tight font-medium break-words">{project.title || 'Untitled project'}</Heading>
      <p className="text-lg md:text-xl text-muted leading-relaxed max-w-3xl mt-8 whitespace-pre-line">{project.description}</p>
      {(project.role || !!project.technologies?.length) && (
        <dl className="grid sm:grid-cols-2 gap-8 mt-12 border-y border-line py-8">
          {project.role && <div><dt className={`${label} mb-3`}>My role</dt><dd className="whitespace-pre-line">{project.role}</dd></div>}
          {!!project.technologies?.length && <div><dt className={`${label} mb-3`}>Built with</dt><dd className="flex flex-wrap gap-2">{project.technologies.map((tech, i) => <span key={i} className="text-sm px-3 py-1 border border-line rounded-full">{tech}</span>)}</dd></div>}
        </dl>
      )}
      {(live || source) && <div className="flex flex-wrap gap-4 mt-8">
        {live && <a href={live} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-accent text-accent-fg rounded-full text-sm font-medium hover:opacity-85">Visit live site ↗</a>}
        {source && <a href={source} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-line rounded-full text-sm hover:bg-fg/5">View source code ↗</a>}
      </div>}
      {(imageUrl || project.imageFileId) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl || publicAssetUrl(project.imageFileId)} alt={`${project.title} screenshot`} className="w-full h-auto rounded-2xl border border-line mt-12" />
      )}

      {project.problem?.trim() && (
        <section className="mt-20 md:mt-28">
          <SectionHeading className={`${label} mb-6`}>The problem</SectionHeading>
          <p className="text-2xl md:text-4xl font-medium tracking-tight leading-snug max-w-4xl whitespace-pre-line break-words">{project.problem}</p>
        </section>
      )}

      {features.length > 0 && (
        <section className="mt-20 md:mt-28">
          <SectionHeading className={`${label} mb-8`}>What I built</SectionHeading>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {features.map((feature, i) => (
              <li key={i} className="flex gap-4 bg-bg p-6 md:p-8">
                <span className="font-mono text-xs text-accent tabular-nums pt-1">{String(i + 1).padStart(2, '0')}</span>
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className="mt-20 md:mt-28">
          <SectionHeading className={`${label} mb-10`}>How it works</SectionHeading>
          <ol className="relative grid gap-10 md:gap-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${steps.length > 4 ? 150 : 190}px, 1fr))` }}>
            <span aria-hidden className="absolute left-5 top-5 bottom-5 w-px bg-line md:left-5 md:right-5 md:top-5 md:bottom-auto md:h-px md:w-auto" />
            {steps.map((step, i) => (
              <li key={i} className="relative pl-16 md:pl-0">
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-bg font-mono text-sm text-accent md:relative md:mb-6">{i + 1}</span>
                {step.title && <p className="font-mono text-xs uppercase tracking-[0.2em] text-fg mb-2">{step.title}</p>}
                {step.body && <p className="text-sm text-muted leading-relaxed">{step.body}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {notes.length > 0 && (
        <div className="mt-20 md:mt-28 space-y-16">
          {notes.map(([heading, body]) => (
            <section key={heading} className="grid md:grid-cols-[200px_1fr] gap-8">
              <SectionHeading className="text-xl font-medium">{heading}</SectionHeading>
              <p className="text-muted leading-relaxed whitespace-pre-line break-words">{body}</p>
            </section>
          ))}
        </div>
      )}
    </article>
  )
}
