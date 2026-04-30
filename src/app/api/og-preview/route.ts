import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const UA =
  'Mozilla/5.0 (compatible; PortfolioPreviewBot/1.0; +https://example.com)'

function absolutize(src: string, base: string): string {
  try {
    return new URL(src, base).toString()
  } catch {
    return src
  }
}

function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

async function tryFetchImage(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.startsWith('image/')) return null
    return res
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url')
  if (!target) return new Response('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return new Response('Only http(s) allowed', { status: 400 })
  }

  // 1. Try og:image / twitter:image from the page.
  try {
    const pageRes = await fetch(parsed.toString(), {
      headers: { 'user-agent': UA, accept: 'text/html' },
      redirect: 'follow',
    })
    if (pageRes.ok) {
      const html = await pageRes.text()
      const og = extractOgImage(html)
      if (og) {
        const abs = absolutize(og, parsed.toString())
        const img = await tryFetchImage(abs)
        if (img) {
          const buf = await img.arrayBuffer()
          return new Response(buf, {
            headers: {
              'content-type': img.headers.get('content-type') || 'image/jpeg',
              'cache-control': 'public, max-age=86400',
              'x-source': 'og',
            },
          })
        }
      }
    }
  } catch {
    // fall through to screenshot
  }

  // 2. Fallback: mShots screenshot.
  const shot = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(
    parsed.toString(),
  )}?w=1200&h=900`
  const img = await tryFetchImage(shot)
  if (img) {
    const buf = await img.arrayBuffer()
    return new Response(buf, {
      headers: {
        'content-type': img.headers.get('content-type') || 'image/jpeg',
        'cache-control': 'public, max-age=86400',
        'x-source': 'mshots',
      },
    })
  }

  return new Response('No preview available', { status: 502 })
}
