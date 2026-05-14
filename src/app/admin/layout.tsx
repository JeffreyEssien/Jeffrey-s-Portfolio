'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { currentUser, logout } from '../../lib/auth'
import { isAppwriteConfigured } from '../../lib/appwrite'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/site', label: 'Site' },
  { href: '/admin/hero', label: 'Hero' },
  { href: '/admin/about', label: 'About' },
  { href: '/admin/work', label: 'Experience' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/contact', label: 'Contact' },
  { href: '/admin/cv', label: 'CV / Resume' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const isLogin = pathname === '/admin/login'

  useEffect(() => {
    let mounted = true
    currentUser().then((u) => {
      if (!mounted) return
      setEmail(u?.email ?? null)
      setChecking(false)
      if (!u && !isLogin) router.replace('/admin/login')
      if (u && isLogin) router.replace('/admin')
    })
    return () => { mounted = false }
  }, [pathname, isLogin, router])

  if (!isAppwriteConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-neutral-50 text-neutral-900">
        <div className="max-w-lg bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h1 className="text-xl font-semibold mb-2">Appwrite not configured</h1>
          <p className="text-neutral-600 text-sm">Copy <code>.env.local.example</code> to <code>.env.local</code>, fill in your project ID, and follow <code>APPWRITE_SETUP.md</code>.</p>
        </div>
      </div>
    )
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500 bg-neutral-50">Loading…</div>
  }

  if (isLogin) return <div className="bg-neutral-50 text-neutral-900 min-h-screen">{children}</div>

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-6 border-b border-neutral-200">
          <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">Portfolio</p>
          <p className="text-base font-semibold">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                  active ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-200 space-y-1">
          <Link href="/" className="block px-3 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100 transition-colors duration-200">View site ↗</Link>
          <button onClick={async () => { await logout(); router.replace('/admin/login') }} className="block w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
            Sign out
          </button>
          {email && <p className="px-3 pt-2 text-xs text-neutral-400 truncate">{email}</p>}
        </div>
      </aside>
      <main className="flex-1 ml-64">
        <div className={`${pathname === '/admin/cv' ? 'max-w-[1400px]' : 'max-w-3xl'} mx-auto px-6 md:px-10 py-12 bg-white min-h-screen border-l border-neutral-200`}>{children}</div>
      </main>
    </div>
  )
}
