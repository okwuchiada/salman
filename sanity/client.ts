import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Next.js caches every result ('use cache' in sanity/fetch.ts), so Sanity is only
  // asked again after a publish or the hourly refresh. Skipping Sanity's CDN means
  // that fetch always gets the content that was just published.
  useCdn: false,
})
