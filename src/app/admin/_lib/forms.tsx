'use client'

import { useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export const inputCls =
  'w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors'

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500 mt-1">{hint}</span>}
    </label>
  )
}

export function FieldGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-neutral-200 pt-8 first:border-t-0 first:pt-0">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-10 pb-6 border-b border-neutral-200">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
    </div>
  )
}

export function SaveBar({ state, onSave }: { state: SaveState; onSave: () => void }) {
  const label =
    state === 'saving' ? 'Saving…' :
    state === 'saved' ? 'Saved' :
    state === 'error' ? 'Error — retry' : 'Save changes'
  return (
    <div className="sticky bottom-0 -mx-6 md:-mx-10 mt-12 px-6 md:px-10 py-4 border-t border-neutral-200 bg-white/90 backdrop-blur-sm flex justify-end">
      <button
        onClick={onSave}
        disabled={state === 'saving'}
        className={`px-5 py-2.5 rounded-lg font-medium text-white text-sm disabled:opacity-50 transition-colors duration-200 ${
          state === 'error' ? 'bg-red-600 hover:bg-red-700' : state === 'saved' ? 'bg-emerald-600' : 'bg-neutral-900 hover:bg-neutral-700'
        }`}
      >
        {label}
      </button>
    </div>
  )
}

export function useSaveState() {
  const [state, setState] = useState<SaveState>('idle')
  const wrap = async (fn: () => Promise<void>) => {
    setState('saving')
    try {
      await fn()
      setState('saved')
      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }
  return [state, wrap] as const
}
