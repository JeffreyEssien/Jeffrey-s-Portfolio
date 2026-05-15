import { AdapterResult, RawJob } from '../types'

const decode = (s: string) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&nbsp;/g, ' ')

const stripCdata = (s: string) => s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function field(item: string, tag: string): string {
  const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  if (!m) return ''
  return decode(stripCdata(m[1]).trim())
}

function inferCompany(title: string): string {
  const at = title.split(/\s+at\s+/i)
  if (at.length > 1) return at[at.length - 1].split(/[(–—-]/)[0].trim()
  return ''
}

export async function fetchHotNigerianJobs(): Promise<AdapterResult> {
  try {
    const res = await fetch('https://www.hotnigerianjobs.com/feed/rss.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 portfolio-jobs/1.0', Accept: 'application/rss+xml, application/xml, text/xml' },
    })
    if (!res.ok) throw new Error(`HNJ ${res.status}`)
    const xml = await res.text()
    const items = xml.split(/<item>/).slice(1).map((s) => s.split('</item>')[0])
    const jobs: RawJob[] = items.map((it) => {
      const title = stripHtml(field(it, 'title'))
      const link = field(it, 'link').trim()
      const guid = field(it, 'guid').trim() || link
      const pubDate = field(it, 'pubDate').trim()
      const description = stripHtml(field(it, 'description')).slice(0, 4000)
      return {
        sourceId: guid,
        title,
        company: inferCompany(title),
        location: 'Nigeria',
        remote: /remote/i.test(title) || /remote/i.test(description),
        url: link,
        postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        descriptionText: description,
      }
    }).filter((j) => j.title && j.url)
    return { source: 'hot-nigerian-jobs', jobs, errors: [] }
  } catch (e) {
    return { source: 'hot-nigerian-jobs', jobs: [], errors: [(e as Error).message] }
  }
}
