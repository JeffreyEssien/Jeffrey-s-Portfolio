'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { Magnetic, Scramble, WordReveal } from './effects'
import { publicAssetUrl } from '../src/lib/public-content'
import { publishedContact, publishedSite, getPublicContact, getPublicSite } from '../src/lib/public-content'

const Contact = () => {
  const { data } = useSWR('contact', getPublicContact, { fallbackData: publishedContact })
  const { data: siteData } = useSWR('site', getPublicSite, { fallbackData: publishedSite })
  const c = data ?? publishedContact
  const site = siteData ?? publishedSite

  const mailto = `mailto:${c.email}?subject=${encodeURIComponent(c.ctaSubject)}`
  const cvHref = c.cvFileId ? publicAssetUrl(c.cvFileId) : '/Jeffrey_Essien_CV.pdf'
  const cvFilename = "Jeffrey's CV.pdf"
  const handleCvDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cvHref) return
    e.preventDefault()
    try {
      const res = await fetch(cvHref)
      if (!res.ok) throw new Error('CV download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = cvFilename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      window.open(cvHref, '_blank', 'noopener,noreferrer')
    }
  }
  const [copied, setCopied] = useState(false)
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(c.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = mailto
    }
  }
  const year = new Date().getFullYear()
  const copyright = (site.footerCopyright || '').replace('{year}', String(year))

  return (
    <section id="contact" className="relative pt-32 md:pt-40 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[820px] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]" />
      <div className="relative max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <Scramble text={c.eyebrow} className="text-xs uppercase tracking-[0.2em] text-accent" />
          </div>
          <div className="md:col-span-9">
            <h2 className="text-5xl md:text-8xl font-medium tracking-[-0.04em] leading-[0.98] text-fg mb-12">
              <WordReveal parts={[{ text: c.headlinePrefix }, { text: c.headlineAccent, accent: true }, { text: c.headlineSuffix }]} />
            </h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {c.body && (
                <p className="text-lg text-muted leading-relaxed max-w-xl mb-12">{c.body}</p>
              )}

              <div className="flex gap-3 flex-wrap mb-12">
                {c.ctaEmailLabel && (
                  <Magnetic>
                    <a href={mailto} className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-accent text-accent-fg text-sm font-semibold hover:shadow-[0_0_48px_-4px_var(--accent)] transition-shadow duration-300">
                      {c.ctaEmailLabel}
                      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </a>
                  </Magnetic>
                )}
                {c.ctaCvLabel && (
                  <Magnetic>
                    <a
                      href={cvHref}
                      onClick={handleCvDownload}
                      rel="noopener noreferrer"
                      download={cvFilename}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-line text-sm font-medium text-fg hover:border-fg/40 hover:bg-white/5 transition-colors duration-200"
                    >
                      {c.ctaCvLabel} <span aria-hidden>↓</span>
                    </a>
                  </Magnetic>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <a href={mailto} className="text-muted hover:text-fg transition-colors duration-200 font-serif italic text-xl md:text-2xl break-all">
                  {c.emailLinkLabel || c.email}
                </a>
                <button type="button" onClick={copyEmail} className="rounded-full border border-line px-4 py-2 text-xs text-muted hover:border-accent hover:text-accent transition-colors duration-200" aria-live="polite">
                  {copied ? 'Copied ✓' : 'Copy email'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        <footer className="mt-32 pt-8 border-t border-line flex flex-wrap gap-4 justify-between text-xs text-faint">
          <span>{copyright}</span>
          <span>{site.footerTagline}</span>
          <a href="#hero" className="hover:text-accent transition-colors">Back to top ↑</a>
        </footer>
      </div>
      <motion.p
        aria-hidden
        initial={{ y: '40%', opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-outline mt-8 pb-4 text-center text-[14.5vw] font-medium tracking-[-0.05em] leading-none whitespace-nowrap select-none"
      >
        {site.brand}
      </motion.p>
    </section>
  )
}

export default Contact
