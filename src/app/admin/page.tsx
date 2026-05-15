'use client'

import Link from 'next/link'
import { PageHeader } from './_lib/forms'

const SECTIONS = [
  { href: '/admin/site', title: 'Site', desc: 'Brand name, navigation labels, page metadata, footer.' },
  { href: '/admin/hero', title: 'Hero', desc: 'Greeting, name, subheadline, taglines, call-to-action buttons.' },
  { href: '/admin/about', title: 'About', desc: 'Education, certifications, skills, stack — and section copy.' },
  { href: '/admin/work', title: 'Experience', desc: 'Add, edit, reorder, and delete work history entries.' },
  { href: '/admin/projects', title: 'Projects', desc: 'Add, edit, reorder, and delete projects with images.' },
  { href: '/admin/contact', title: 'Contact', desc: 'Email, CV upload, contact section copy.' },
  { href: '/admin/cv', title: 'CV / Resume', desc: 'Build, preview, and publish the downloadable CV. ATS-safe and creative templates.' },
  { href: '/admin/jobs', title: 'Jobs', desc: 'Auto-refreshed twice daily — find Nigerian + worldwide-remote roles matched to your CV.' },
]

export default function AdminOverview() {
  return (
    <div>
      <PageHeader title="Overview" description="Pick a section to edit." />
      <div className="grid sm:grid-cols-2 gap-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block p-5 border border-neutral-200 rounded-xl hover:border-neutral-900 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)] transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-medium text-neutral-900">{s.title}</h2>
              <span className="text-neutral-400 text-sm">→</span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
