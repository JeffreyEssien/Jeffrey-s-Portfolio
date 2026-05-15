import nodemailer from 'nodemailer'

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const flagLabel = (f) => f === 'direct' ? '🇳🇬 Nigeria' : f === 'worldwide' ? '🌍 Worldwide' : 'Unclear'
const flagColor = (f) => f === 'direct' ? '#047857' : f === 'worldwide' ? '#1d4ed8' : '#6b7280'

function buildDigestHtml(jobs, siteUrl) {
  const date = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })
  const rows = jobs.map((j) => `
    <tr><td style="padding:16px;border-top:1px solid #eee;">
      <div style="font-size:12px;color:${flagColor(j.scoreBreakdown.ngFlag)};font-weight:600;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:4px;">
        ${flagLabel(j.scoreBreakdown.ngFlag)} · score ${j.score} · ${esc(j.source)}
      </div>
      <div style="font-size:17px;font-weight:600;color:#111;margin-bottom:2px;">
        <a href="${esc(j.url)}" style="color:#111;text-decoration:none;">${esc(j.title)}</a>
      </div>
      <div style="font-size:14px;color:#444;margin-bottom:6px;">${esc(j.company || '—')}${j.location ? ' · ' + esc(j.location) : ''}</div>
      ${j.scoreBreakdown.titleHits.length ? `<div style="font-size:12px;color:#6b7280;">Matched: ${esc(j.scoreBreakdown.titleHits.concat(j.scoreBreakdown.bodyHits).slice(0, 8).join(', '))}</div>` : ''}
      <div style="margin-top:10px;">
        <a href="${esc(j.url)}" style="display:inline-block;padding:8px 14px;background:#111;color:#fff;text-decoration:none;font-size:13px;border-radius:8px;">View role</a>
        <a href="${esc(siteUrl)}/admin/jobs" style="display:inline-block;margin-left:8px;padding:8px 14px;background:#fff;color:#111;text-decoration:none;font-size:13px;border-radius:8px;border:1px solid #d1d5db;">Open inbox</a>
      </div>
    </td></tr>`).join('')

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#111;">
    <table style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;border-collapse:separate;width:100%;">
      <tr><td style="padding:24px 24px 8px 24px;">
        <p style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px 0;">Daily digest · ${esc(date)} WAT</p>
        <h1 style="font-size:22px;margin:0;color:#111;">${jobs.length} new matches</h1>
      </td></tr>
      ${jobs.length ? rows : `<tr><td style="padding:24px;color:#6b7280;">No new matches this run.</td></tr>`}
      <tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:12px;color:#6b7280;">
        Manage at <a href="${esc(siteUrl)}/admin/jobs" style="color:#111;">${esc(siteUrl)}/admin/jobs</a>
      </td></tr>
    </table>
  </body></html>`
}

export default async ({ req, res, log, error }) => {
  const SITE_URL = process.env.SITE_URL
  const CRON_SECRET = process.env.JOBS_CRON_SECRET
  const SMTP_HOST = process.env.SMTP_HOST
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
  const SMTP_USER = process.env.SMTP_USER
  const SMTP_PASS = process.env.SMTP_PASS
  const TO = process.env.JOBS_DIGEST_TO

  if (!SITE_URL || !CRON_SECRET) {
    error('SITE_URL or JOBS_CRON_SECRET missing'); return res.json({ ok: false, error: 'config missing' }, 500)
  }

  let refresh
  try {
    const r = await fetch(`${SITE_URL}/api/jobs/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    if (!r.ok) throw new Error(`refresh status ${r.status}`)
    refresh = await r.json()
  } catch (e) {
    error(`refresh failed: ${e.message}`); return res.json({ ok: false, error: e.message }, 500)
  }

  log(`refresh: ${refresh.totalNew} new / ${refresh.totalUpserted} upserted; top=${refresh.topMatches?.length ?? 0}`)

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !TO) {
    return res.json({ ok: true, emailed: false, summary: refresh })
  }

  const top = (refresh.topMatches || []).slice(0, 5)
  if (top.length === 0) {
    return res.json({ ok: true, emailed: false, reason: 'no new matches', summary: refresh })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    await transporter.sendMail({
      from: SMTP_USER,
      to: TO,
      subject: `${top.length} new role match${top.length === 1 ? '' : 'es'} — ${new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })}`,
      html: buildDigestHtml(top, SITE_URL),
    })
    return res.json({ ok: true, emailed: true, summary: refresh })
  } catch (e) {
    error(`smtp failed: ${e.message}`)
    return res.json({ ok: true, emailed: false, error: e.message, summary: refresh })
  }
}
