'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { animate, motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from 'framer-motion'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })
  return <motion.div aria-hidden style={{ scaleX }} className="fixed top-0 left-0 right-0 h-0.5 origin-left bg-accent z-[60]" />
}

// A ring that trails the pointer and swells over anything clickable. Fine pointers only.
export function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40 })
  const sy = useSpring(y, { stiffness: 500, damping: 40 })
  const [hover, setHover] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setHover(!!(e.target as Element).closest?.('a, button'))
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [reduce, x, y])

  if (!enabled) return null
  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed top-0 left-0 z-[80] mix-blend-difference"
    >
      <motion.div
        animate={{ width: hover ? 64 : 28, height: hover ? 64 : 28, backgroundColor: hover ? '#ffffff' : 'rgba(255,255,255,0)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-white"
      />
    </motion.div>
  )
}

export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 250, damping: 18 })
  const y = useSpring(0, { stiffness: 250, damping: 18 })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return
        const box = ref.current.getBoundingClientRect()
        x.set((e.clientX - box.left - box.width / 2) * strength)
        y.set((e.clientY - box.top - box.height / 2) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

// Words brighten one by one as the block scrolls through the viewport.
export function WordReveal({ parts, className }: { parts: { text: string; accent?: boolean }[]; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = parts.flatMap((p) => p.text.split(/(\s+)/).filter(Boolean).map((w) => ({ w, accent: p.accent })))
  const count = words.filter((t) => t.w.trim()).length
  let index = 0
  return (
    <span ref={ref} className={className}>
      {words.map((t, i) => {
        if (!t.w.trim()) return t.w
        const start = index++ / count
        return (
          <Word key={i} progress={scrollYProgress} range={[start, start + 1 / count]} still={!!reduce} accent={t.accent}>
            {t.w}
          </Word>
        )
      })}
    </span>
  )
}

function Word({ children, progress, range, still, accent }: { children: string; progress: MotionValue<number>; range: [number, number]; still: boolean; accent?: boolean }) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <motion.span style={{ opacity: still ? 1 : opacity }} className={accent ? 'font-serif italic font-normal text-accent' : undefined}>
      {children}
    </motion.span>
  )
}

// Tracks the pointer over an element and exposes it as --mx / --my for .spotlight
export function trackPointer(e: React.PointerEvent<HTMLElement>) {
  const box = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - box.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - box.top}px`)
}

export function Grain() {
  return <div aria-hidden className="grain" />
}

// Shared "intro finished" flag so the hero can hold its entrance until the preloader lifts.
let introDone = false
const introListeners = new Set<() => void>()
export function finishIntro() {
  introDone = true
  introListeners.forEach((l) => l())
}
export function useIntroDone() {
  return useSyncExternalStore(
    (l) => { introListeners.add(l); return () => introListeners.delete(l) },
    () => introDone,
    () => false,
  )
}

export function Preloader({ label }: { label: string }) {
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'counting' | 'leaving' | 'gone'>('counting')

  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem('intro-seen') === '1' } catch {}
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('gone')
      finishIntro()
      return
    }
    const controls = animate(0, 100, {
      duration: 1.6,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => {
        try { sessionStorage.setItem('intro-seen', '1') } catch {}
        setPhase('leaving')
        setTimeout(finishIntro, 250)
      },
    })
    return () => controls.stop()
  }, [])

  if (phase === 'gone') return null
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] flex flex-col justify-between bg-[#070708] p-6 md:p-10 text-fg"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={phase === 'leaving' ? { clipPath: 'inset(0% 0% 100% 0%)' } : undefined}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => phase === 'leaving' && setPhase('gone')}
    >
      <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-faint">
        <span>{label}</span>
        <span>Portfolio — {new Date().getFullYear()}</span>
      </div>
      <div className="flex items-end justify-between gap-6">
        <div className="h-px flex-1 bg-line mb-6 md:mb-10 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${count}%` }} />
        </div>
        <span className="font-serif italic text-[28vw] md:text-[16vw] leading-[0.8] text-accent tabular-nums">{count}</span>
      </div>
    </motion.div>
  )
}

// Whether the site-wide WebGL scene is running ('pending' until it knows).
type WebglState = 'pending' | 'on' | 'off'
let webgl: WebglState = 'pending'
const webglListeners = new Set<() => void>()
export function setWebgl(state: WebglState) {
  webgl = state
  webglListeners.forEach((l) => l())
}
export function useWebgl() {
  return useSyncExternalStore(
    (l) => { webglListeners.add(l); return () => webglListeners.delete(l) },
    () => webgl,
    () => 'pending' as WebglState,
  )
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#$%&*'

// Text that decodes from random glyphs when it scrolls into view.
export function Scramble({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [shown, setShown] = useState(text)

  useEffect(() => {
    if (!inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(text); return }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const done = Math.min(text.length, Math.floor((now - start) / 35))
      setShown(text.slice(0, done) + text.slice(done).replace(/\S/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      if (done < text.length) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, text])

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="font-mono">{shown}</span>
    </span>
  )
}

// Giant strip that drifts on its own and leans/speeds up with scroll velocity.
export function VelocityMarquee({ text }: { text: string }) {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 300 })
  const skew = useTransform(smooth, [-3000, 3000], [12, -12], { clamp: true })
  const x = useMotionValue(0)
  const reduce = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)

  useAnimationFrame((_, delta) => {
    if (reduce || !track.current) return
    const boost = 1 + Math.min(Math.abs(smooth.get()) / 600, 6)
    const width = track.current.scrollWidth / 2
    let next = x.get() - (delta / 1000) * 60 * boost
    if (next <= -width) next += width
    x.set(next)
  })

  return (
    <div aria-hidden className="overflow-hidden py-10 md:py-16 select-none">
      <motion.div ref={track} style={{ x, skewX: skew }} className="flex w-max whitespace-nowrap">
        {[0, 1].map((copy) => (
          <span key={copy} className="flex items-center text-[18vw] md:text-[12vw] font-medium leading-none tracking-[-0.05em]">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="flex items-center">
                <span className={i % 2 ? 'text-outline' : 'text-fg'}>{text}</span>
                <span className="mx-[0.15em] font-serif italic text-accent">✦</span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
