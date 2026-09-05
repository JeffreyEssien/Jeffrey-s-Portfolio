'use client'

import { motion } from 'framer-motion'
import useSWR from 'swr'
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
  const year = new Date().getFullYear()
  const copyright = (site.footerCopyright || '').replace('{year}', String(year))

  return (
    <section id="contact" className="py-32 px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">{c.eyebrow}</p>
          </div>
          <div className="md:col-span-9">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h2 className="text-4xl md:text-6xl font-medium tracking-tight leading-[1.05] text-neutral-900 mb-12">
                {c.headlinePrefix}
                <span className="font-serif italic font-normal">{c.headlineAccent}</span>
                {c.headlineSuffix}
              </h2>

              {c.body && (
                <p className="text-lg text-neutral-600 leading-relaxed max-w-xl mb-12">{c.body}</p>
              )}

              <div className="flex gap-3 flex-wrap mb-16">
                {c.ctaEmailLabel && (
                  <a href={mailto} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors duration-200">
                    {c.ctaEmailLabel}
                    <span aria-hidden>→</span>
                  </a>
                )}
                {c.ctaCvLabel && (
                  <a
                    href={cvHref}
                    onClick={handleCvDownload}
                    rel="noopener noreferrer"
                    download={cvFilename}
                    className="inline-flex items-center px-6 py-3 rounded-full border border-neutral-300 text-sm font-medium text-neutral-900 hover:bg-neutral-100 transition-colors duration-200"
                  >
                    {c.ctaCvLabel}
                  </a>
                )}
              </div>

              <a href={mailto} className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200 font-serif italic text-lg">
                {c.emailLinkLabel || c.email}
              </a>
            </motion.div>
          </div>
        </div>

        <footer className="mt-32 pt-8 border-t border-neutral-200 flex justify-between text-xs text-neutral-500">
          <span>{copyright}</span>
          <span>{site.footerTagline}</span>
        </footer>
      </div>
    </section>
  )
}

export default Contact
