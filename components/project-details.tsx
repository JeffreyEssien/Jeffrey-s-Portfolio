import type { Project } from '../src/lib/content'
import { publicAssetUrl } from '../src/lib/public-content'
import { externalUrl } from '../src/lib/project-utils'

export default function ProjectDetails({ project, imageUrl, titleId, embedded = false }: { project: Project; imageUrl?: string; titleId?: string; embedded?: boolean }) {
  const Heading = embedded ? 'h2' : 'h1'
  const SectionHeading = embedded ? 'h3' : 'h2'
  const live = externalUrl(project.link)
  const source = externalUrl(project.sourceUrl)
  const sections = [
    ['The challenge', project.problem],
    ['My approach', project.solution],
    ['Results & lessons', project.results],
  ]
  return (
    <article className="max-w-5xl mx-auto px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-6">Project case study</p>
      <Heading id={titleId} className="text-4xl md:text-6xl tracking-tight font-medium break-words">{project.title || 'Untitled project'}</Heading>
      <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-3xl mt-8 whitespace-pre-line">{project.description}</p>
      {(project.role || !!project.technologies?.length) && (
        <dl className="grid sm:grid-cols-2 gap-8 mt-12 border-y border-neutral-200 py-8">
          {project.role && <div><dt className="text-xs uppercase tracking-widest text-neutral-500 mb-3">My role</dt><dd className="whitespace-pre-line">{project.role}</dd></div>}
          {!!project.technologies?.length && <div><dt className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Built with</dt><dd className="flex flex-wrap gap-2">{project.technologies.map((tech, i) => <span key={i} className="text-sm px-3 py-1 border border-neutral-200 rounded-full">{tech}</span>)}</dd></div>}
        </dl>
      )}
      {(live || source) && <div className="flex flex-wrap gap-4 mt-8">
        {live && <a href={live} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-neutral-900 text-white rounded-full text-sm hover:bg-neutral-700">Visit live site ↗</a>}
        {source && <a href={source} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-neutral-300 rounded-full text-sm hover:bg-neutral-100">View source code ↗</a>}
      </div>}
      {(imageUrl || project.imageFileId) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl || publicAssetUrl(project.imageFileId)} alt={`${project.title} screenshot`} className="w-full h-auto rounded-2xl border border-neutral-200 mt-12" />
      )}
      <div className="mt-16 space-y-16">
        {sections.filter(([, body]) => body?.trim()).map(([heading, body]) => (
          <section key={heading} className="grid md:grid-cols-[200px_1fr] gap-8">
            <SectionHeading className="text-xl font-medium">{heading}</SectionHeading>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line break-words">{body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
