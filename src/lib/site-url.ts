// Absolute base URL for metadata, sitemap and robots.
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return new URL(explicit || (vercel ? `https://${vercel}` : 'http://localhost:3000'))
}
