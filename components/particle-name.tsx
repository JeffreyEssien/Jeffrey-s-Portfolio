'use client'

import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; size: number; white: boolean }

const REPEL = 110

// Font size that makes `text` span `width`, and the line height it needs. Shared with the WebGL scene.
export function fitName(text: string, width: number, family: string) {
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `italic 400 100px ${family}`
  const fontSize = Math.min((width * 0.94 / ctx.measureText(text).width) * 100, 360)
  return { fontSize, height: Math.ceil(fontSize * 1.15) }
}

// Draws `text` as a few thousand particles that fly in to form the word and scatter away from the pointer.
export default function ParticleName({ text, play }: { text: string; play: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const playRef = useRef(play)
  playRef.current = play

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const styles = getComputedStyle(el)
    const accent = styles.getPropertyValue('--accent').trim() || '#c8f560'
    const family = getComputedStyle(document.body).getPropertyValue('--font-serif').trim() || 'Georgia, serif'
    const pointer = { x: -9999, y: -9999 }
    let particles: Particle[] = []
    let w = 0, h = 0, frame = 0, cancelled = false

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = el.clientWidth
      const fit = fitName(text, w, family)
      const fontSize = fit.fontSize
      h = fit.height
      el.style.height = `${h}px`
      el.width = w * dpr
      el.height = h * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      // Rasterise the word at device resolution and sample its filled pixels.
      ctx.clearRect(0, 0, el.width, el.height)
      ctx.font = `italic 400 ${fontSize * dpr}px ${family}`
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.fillText(text, 2 * dpr, (h / 2) * dpr)
      const data = ctx.getImageData(0, 0, el.width, el.height).data
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const step = Math.max(3, Math.round(w / 260)) * dpr
      const previous = particles
      particles = []
      for (let y = 0; y < el.height; y += step) {
        for (let x = 0; x < el.width; x += step) {
          if (data[(y * el.width + x) * 4 + 3] < 128) continue
          const old = previous[particles.length]
          const tx = x / dpr, ty = y / dpr
          particles.push({
            x: old?.x ?? (still ? tx : Math.random() * w),
            y: old?.y ?? (still ? ty : h * (Math.random() * 3 - 1)),
            vx: 0, vy: 0, tx, ty,
            size: (step / dpr) * (0.45 + Math.random() * 0.35),
            white: Math.random() < 0.12,
          })
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const forming = playRef.current
      for (const p of particles) {
        if (forming) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const dist = Math.hypot(dx, dy)
          if (dist < REPEL && dist > 0) {
            const force = (1 - dist / REPEL) * 6
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
          p.vx += (p.tx - p.x) * 0.045
          p.vy += (p.ty - p.y) * 0.045
        }
        p.vx *= 0.82
        p.vy *= 0.82
        p.x += p.vx
        p.y += p.vy
        ctx.fillStyle = p.white ? '#f4f4f1' : accent
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }
    }

    const loop = () => { draw(); frame = requestAnimationFrame(loop) }
    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect()
      pointer.x = e.clientX - box.left
      pointer.y = e.clientY - box.top
    }
    const leave = () => { pointer.x = pointer.y = -9999 }
    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => { build(); if (still) draw() }, 150)
    }

    document.fonts.ready.then(() => {
      if (cancelled) return
      build()
      if (still) draw()
      else frame = requestAnimationFrame(loop)
    })
    window.addEventListener('resize', onResize)
    if (!still) {
      window.addEventListener('pointermove', move, { passive: true })
      document.addEventListener('pointerleave', leave)
    }
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [text])

  return <canvas ref={canvas} aria-hidden className="block w-full touch-pan-y" />
}
