import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProjectDetails from '../../../../components/project-details'
import { getPublicProjects, getPublicSite } from '../../../lib/public-content'

export const dynamic = 'force-dynamic'

const findProject = cache(async (id: string) => (await getPublicProjects()).find((project) => project.$id === id))
type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await findProject((await params).id)
  if (!project) return { title: 'Project not found', robots: { index: false } }
  const site = await getPublicSite()
  return {
    title: `${project.title} — ${site.brand}`,
    description: project.description,
    openGraph: { title: project.title, description: project.description, type: 'article' },
    twitter: { card: 'summary', title: project.title, description: project.description },
  }
}

export default async function ProjectPage({ params }: Props) {
  const project = await findProject((await params).id)
  if (!project) notFound()
  return <main>
    <nav aria-label="Project navigation" className="max-w-5xl mx-auto px-6 pt-8">
      <Link href="/#projects" className="text-sm text-neutral-600 hover:text-neutral-900">← Back to all projects</Link>
    </nav>
    <ProjectDetails project={project} />
  </main>
}
