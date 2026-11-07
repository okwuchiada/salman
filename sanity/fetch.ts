import { cacheLife, cacheTag } from 'next/cache'
import { client } from './client'
import {
  ABOUT_QUERY,
  CATEGORIES_QUERY,
  PROJECT_QUERY,
  PROJECT_SLUGS_QUERY,
  PROJECTS_QUERY,
  SETTINGS_QUERY,
} from './queries'

// Cached data functions (Cache Components). Tags match Sanity document types so a
// webhook can call revalidateTag('<type>') when content changes.

export async function getSettings() {
  'use cache'
  cacheLife('hours')
  cacheTag('siteSettings', 'project', 'category')
  return client.fetch(SETTINGS_QUERY)
}

export async function getAbout() {
  'use cache'
  cacheLife('hours')
  cacheTag('aboutPage')
  return client.fetch(ABOUT_QUERY)
}

export async function getCategories() {
  'use cache'
  cacheLife('hours')
  cacheTag('category')
  return client.fetch(CATEGORIES_QUERY)
}

export async function getProjects() {
  'use cache'
  cacheLife('hours')
  cacheTag('project', 'category')
  return client.fetch(PROJECTS_QUERY)
}

export async function getProject(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('project', `project:${slug}`, 'category')
  return client.fetch(PROJECT_QUERY, { slug })
}

export async function getProjectSlugs() {
  'use cache'
  cacheLife('hours')
  cacheTag('project')
  return client.withConfig({ useCdn: false }).fetch(PROJECT_SLUGS_QUERY)
}
