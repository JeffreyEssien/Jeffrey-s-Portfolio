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
  const url = `/projects/${project.$id}`
  return {
    title: `${project.title} — ${site.brand}`,
    description: project.description,
    alternates: { canonical: url },
    openGraph: { title: project.title, description: project.description, type: 'article', url },
    twitter: { card: 'summary', title: project.title, description: project.description },
  }
}

export default async function ProjectPage({ params }: Props) {
  const project = await findProject((await params).id)
  if (!project) notFound()
  return <main className="site min-h-screen">
    <nav aria-label="Project navigation" className="max-w-5xl mx-auto px-6 pt-8">
      <Link href="/#projects" className="text-sm text-muted hover:text-fg">← Back to all projects</Link>
    </nav>
    <ProjectDetails project={project} />
  </main>
}
