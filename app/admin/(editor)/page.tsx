import type { Metadata } from 'next'
import { ProjectsList } from '@/components/admin/projects-list'
import { listProjects } from '@/lib/admin/content'
import { requireEditor } from '@/lib/auth/dal'

export const metadata: Metadata = { title: 'Projects' }

export default async function AdminProjectsPage() {
  await requireEditor()
  const rows = await listProjects()
  return (
    <ProjectsList
      rows={rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        year: r.year,
        photos: r.photos,
        cover: r.cover?.asset?._ref,
        status: r.status,
      }))}
    />
  )
}
