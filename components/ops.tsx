'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import type { Telemetry } from '../src/lib/live/status'
import { Scramble, trackPointer } from './effects'

const POLL_MS = 20000
const HISTORY = 24

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

function Sparkline({ values }: { values: (number | null)[] }) {
  const pts = values.map((v, i) => ({ i, v })).filter((p): p is { i: number; v: number } => p.v !== null)
  if (pts.length < 2) return <div className="h-10" />
  const max = Math.max(...pts.map((p) => p.v)) * 1.15
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${(p.i / (HISTORY - 1)) * 100},${40 - (p.v / max) * 36}`).join(' ')
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full overflow-visible" aria-hidden>
      <path d={`${d} L${(pts[pts.length - 1].i / (HISTORY - 1)) * 100},40 L${(pts[0].i / (HISTORY - 1)) * 100},40 Z`} fill="var(--accent)" opacity="0.08" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Heatmap({ days }: { days: { date: string; level: number; count: number }[] }) {
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null)
  const weeks: typeof days[] = []
  days.forEach((d, i) => { if (i % 7 === 0) weeks.push([]); weeks[weeks.length - 1].push(d) })
  const shade = ['bg-white/[0.04]', 'bg-accent/25', 'bg-accent/45', 'bg-accent/70', 'bg-accent']
  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-2 [scrollbar-width:none]" onPointerLeave={() => setHover(null)}>
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {w.map((d) => (
              <span
                key={d.date}
                onPointerEnter={() => setHover(d)}
                className={`h-[10px] w-[10px] shrink-0 rounded-[2px] ${shade[d.level] ?? shade[0]} transition-transform duration-150 hover:scale-150`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 h-4 font-mono text-xs text-faint" aria-live="polite">
        {hover ? `${hover.count} contribution${hover.count === 1 ? '' : 's'} on ${new Date(hover.date).toDateString()}` : 'Hover a square'}
      </p>
    </div>
  )
}

export default function Ops() {
  const ref = useRef<HTMLElement>(null)
  const visible = useInView(ref, { margin: '200px' })
  const [data, setData] = useState<Telemetry | null>(null)
  const [history, setHistory] = useState<Record<string, (number | null)[]>>({})
  const [rtt, setRtt] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!visible) return
    let stop = false
    const poll = async () => {
      try {
        const t0 = performance.now()
        await fetch('/api/status', { method: 'HEAD', cache: 'no-store' })
        const rttMs = Math.round(performance.now() - t0)
        const res = await fetch('/api/status', { cache: 'no-store' })
        if (!res.ok) throw new Error()
        const next: Telemetry = await res.json()
        if (stop) return
        setRtt(rttMs)
        setData(next)
        setFailed(false)
        setHistory((h) => {
          const out = { ...h }
          for (const s of next.services) out[s.host] = [...(out[s.host] ?? []), s.latencyMs].slice(-HISTORY)
          return out
        })
      } catch { if (!stop) setFailed(true) }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { stop = true; clearInterval(id) }
  }, [visible])

  const up = data?.services.filter((s) => s.ok).length ?? 0
  const card = 'spotlight rounded-3xl border border-line bg-surface/50 p-6 md:p-8'

  return (
    <section id="ops" ref={ref} className="py-32 md:py-40 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-3">
            <Scramble text="Live telemetry" className="text-xs uppercase tracking-[0.2em] text-accent" />
          </div>
          <div className="md:col-span-9">
            <h2 className="text-4xl md:text-7xl font-medium tracking-tight leading-[1.02] text-fg max-w-3xl">
              Production, <span className="font-serif italic font-normal text-accent">right now</span>.
            </h2>
            <p className="mt-6 max-w-xl text-muted leading-relaxed">
              Not screenshots. This server probes the things I ship, reads this site&apos;s CI pipeline and my GitHub activity, live, every {POLL_MS / 1000} seconds.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-faint">
          <span className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${failed ? 'bg-red-400' : data ? 'bg-accent animate-pulse' : 'bg-faint'}`} />
            {failed ? 'telemetry unreachable' : data ? `${up}/${data.services.length} services healthy` : 'connecting…'}
          </span>
          {data && <span>probe region: {data.region}</span>}
          {rtt !== null && <span>your round trip to this server: {rtt}ms</span>}
          {data && <span>updated {timeAgo(data.generatedAt)}</span>}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(data?.services ?? [null, null, null]).map((s, i) => (
            <motion.div
              key={s?.host ?? i}
              onPointerMove={trackPointer}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={card}
            >
              {s ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-fg truncate">{s.name}</p>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-faint hover:text-accent truncate block">{s.host}</a>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] ${s.ok ? 'bg-accent/15 text-accent' : 'bg-amber-400/15 text-amber-300'}`}>
                      {s.ok ? 'OPERATIONAL' : s.status ? `HTTP ${s.status}` : 'TIMEOUT'}
                    </span>
                  </div>
                  <p className="mt-6 font-mono text-4xl tabular-nums text-fg">
                    {s.latencyMs ?? '—'}<span className="text-base text-faint">ms</span>
                  </p>
                  <Sparkline values={history[s.host] ?? []} />
                </>
              ) : (
                <div className="h-36 animate-pulse rounded-xl bg-white/5" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-12">
          <div onPointerMove={trackPointer} className={`${card} md:col-span-7`}>
            <p className="text-xs uppercase tracking-[0.2em] text-faint mb-6">CI/CD · this website</p>
            <ul className="space-y-3 font-mono text-xs md:text-sm">
              {(data?.ci ?? []).slice(0, 5).map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 hover:text-fg text-muted">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${r.conclusion === 'success' ? 'bg-accent' : r.conclusion === 'failure' ? 'bg-red-400' : r.status !== 'completed' ? 'bg-amber-300 animate-pulse' : 'bg-faint'}`} />
                    <span className="text-faint">{r.sha}</span>
                    <span className="truncate flex-1 group-hover:text-accent">{r.title}</span>
                    {r.durationS !== null && <span className="hidden sm:inline text-faint">{Math.floor(r.durationS / 60)}m{r.durationS % 60}s</span>}
                    <span className="text-faint">{timeAgo(r.startedAt)}</span>
                  </a>
                </li>
              ))}
              {data && !data.ci.length && <li className="text-faint">CI history unavailable right now.</li>}
            </ul>
          </div>
          <div onPointerMove={trackPointer} className={`${card} md:col-span-5`}>
            <p className="text-xs uppercase tracking-[0.2em] text-faint mb-6">git log --oneline</p>
            <ul className="space-y-3 font-mono text-xs md:text-sm">
              {(data?.commits ?? []).slice(0, 5).map((c) => (
                <li key={c.sha}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 text-muted hover:text-fg">
                    <span className="text-accent">{c.sha}</span>
                    <span className="truncate">{c.message}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {data?.contributions && data.contributions.days.length > 0 && (
          <div onPointerMove={trackPointer} className={`${card} mt-4`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-faint">GitHub activity</p>
              <p className="font-mono text-sm text-fg"><span className="text-accent">{data.contributions.total.toLocaleString()}</span> contributions in the last year</p>
            </div>
            <Heatmap days={data.contributions.days} />
          </div>
        )}
      </div>
    </section>
  )
}
