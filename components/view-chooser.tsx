'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Asks first-time visitors (once per session) whether they want the full site or the simple one.
export default function ViewChooser({ name }: { name: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let chosen = false
    try { chosen = sessionStorage.getItem('view-chosen') === '1' } catch {}
    setOpen(!chosen)
  }, [])

  const choose = () => {
    try { sessionStorage.setItem('view-chosen', '1') } catch {}
    setOpen(false)
  }

  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="view-chooser-title" className="fixed inset-0 z-[95] flex items-center justify-center bg-[#070708] px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">{name}</p>
        <h1 id="view-chooser-title" className="text-3xl md:text-4xl font-medium tracking-tight text-fg mb-3">How would you like to view this?</h1>
        <p className="text-muted mb-10">Same content, two ways to see it.</p>
        <div className="grid gap-4">
          <button type="button" onClick={choose} autoFocus className="rounded-xl bg-accent px-6 py-4 text-left text-accent-fg transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span className="block font-medium">Full experience</span>
            <span className="block text-sm opacity-80">Animated and interactive. Best on a laptop.</span>
          </button>
          <Link href="/simple" onClick={choose} className="rounded-xl border border-line px-6 py-4 text-left text-fg transition-colors duration-200 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span className="block font-medium">Simple version</span>
            <span className="block text-sm text-muted">Quick, plain and fast. Straight to the point.</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
