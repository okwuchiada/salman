import type { Metadata } from 'next'
import { HomeEditor, type HomeValues } from '@/components/admin/page-editors'
import { getEditable, listPublishedProjects } from '@/lib/admin/content'
import { requireEditor } from '@/lib/auth/dal'

export const metadata: Metadata = { title: 'Home page' }

const FIELDS = ['photographerName', 'role', 'heroHeadline', 'heroStatement', 'heroProject', 'selectedWork', 'seoDescription'] as const

export default async function AdminHomePage() {
  await requireEditor()
  const [editable, projects] = await Promise.all([getEditable<HomeValues>('siteSettings', 'siteSettings'), listPublishedProjects()])
  const doc = (editable?.doc ?? {}) as Record<string, unknown>
  const initial = Object.fromEntries(FIELDS.filter((f) => f in doc).map((f) => [f, doc[f]])) as HomeValues

  return (
    <HomeEditor
      initial={initial}
      status={editable?.status ?? 'draft'}
      projects={projects.map((p) => ({ id: p._id, title: p.title, category: p.category, cover: p.cover?.asset?._ref }))}
    />
  )
}
