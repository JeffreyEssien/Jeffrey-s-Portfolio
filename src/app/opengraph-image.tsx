import { ImageResponse } from 'next/og'
import { getPublicHero, getPublicSite } from '../lib/public-content'

export const runtime = 'nodejs'
export const alt = 'Jeffrey Essien — portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Link-preview card for LinkedIn, Slack, WhatsApp and X, built from the published hero content.
export default async function OpengraphImage() {
  const [hero, site] = await Promise.all([getPublicHero(), getPublicSite()])
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#fafaf9', color: '#171717' }}>
        <div style={{ display: 'flex', fontSize: 28, color: '#737373' }}>{site.brand}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>{hero.name}</div>
          <div style={{ display: 'flex', fontSize: 36, color: '#404040', marginTop: 24, lineHeight: 1.3 }}>{hero.subheadline}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {hero.taglines.slice(0, 3).map((t) => (
            <div key={t} style={{ display: 'flex', fontSize: 24, padding: '10px 22px', borderRadius: 999, border: '2px solid #d4d4d4' }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
