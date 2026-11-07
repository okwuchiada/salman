import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectEditor, type ProjectValues } from '@/components/admin/project-editor'
import { getEditable, listCategories } from '@/lib/admin/content'
import { EDITABLE_FIELDS } from '@/lib/admin/types'
import { requireEditor } from '@/lib/auth/dal'
import { siteUrl } from '@/lib/site'

export const metadata: Metadata = { title: 'Project' }

export default async function AdminProjectPage({ params }: PageProps<'/admin/projects/[id]'>) {
  await requireEditor()
  const { id } = await params
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) notFound()

  const [editable, categories] = await Promise.all([getEditable<ProjectValues>(id, 'project'), listCategories()])
  if (!editable?.doc) notFound()

  // Only pass the fields the form edits.
  const initial = Object.fromEntries(
    EDITABLE_FIELDS.project.filter((f) => f in editable.doc!).map((f) => [f, (editable.doc as Record<string, unknown>)[f]]),
  ) as ProjectValues

  return (
    <ProjectEditor
      key={editable.updatedAt ?? id}
      id={id}
      initial={initial}
      status={editable.status}
      categories={categories.map((c) => ({ value: c._id, label: c.title }))}
      siteHost={siteUrl.replace(/^https?:\/\//, '')}
    />
  )
}
