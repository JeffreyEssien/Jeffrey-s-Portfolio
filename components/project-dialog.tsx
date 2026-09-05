'use client'

import { useEffect, useId, useRef } from 'react'
import Link from 'next/link'
import type { Project } from '../src/lib/content'
import ProjectDetails from './project-details'

export default function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const element = dialog.current
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      trigger?.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={(event) => { if (!event.currentTarget.open) onClose() }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const box = event.currentTarget.getBoundingClientRect()
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) event.currentTarget.close()
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-[#fafaf9] p-0 text-neutral-900 shadow-2xl backdrop:bg-neutral-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-200 bg-[#fafaf9]/95 px-6 py-4 backdrop-blur-sm">
        <span className="text-xs uppercase tracking-widest text-neutral-500">About this project</span>
        <button autoFocus onClick={() => dialog.current?.close()} aria-label="Close project details" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm hover:bg-neutral-100">
          Close <span aria-hidden>×</span>
        </button>
      </div>
      <ProjectDetails project={project} titleId={titleId} embedded />
      {project.$id && <div className="border-t border-neutral-200 px-6 py-6">
        <Link href={`/projects/${encodeURIComponent(project.$id)}`} className="text-sm font-medium underline underline-offset-4">Open full project page →</Link>
      </div>}
    </dialog>
  )
}
