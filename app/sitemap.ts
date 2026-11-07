import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'
import { getProjectSlugs } from '@/sanity/fetch'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = (await getProjectSlugs()).filter((s): s is string => Boolean(s))
  return [
    { url: `${siteUrl}/`, priority: 1 },
    { url: `${siteUrl}/work`, priority: 0.9 },
    ...slugs.map((slug) => ({ url: `${siteUrl}/work/${slug}`, priority: 0.8 })),
    { url: `${siteUrl}/about`, priority: 0.6 },
    { url: `${siteUrl}/contact`, priority: 0.6 },
  ]
}
