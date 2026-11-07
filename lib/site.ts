/** Public site URL, used for canonical links, the sitemap and Open Graph. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const FALLBACK_NAME = 'Photographer'
