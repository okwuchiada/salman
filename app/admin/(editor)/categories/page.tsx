import type { Metadata } from 'next'
import { CategoriesEditor } from '@/components/admin/categories-editor'
import { listCategories } from '@/lib/admin/content'
import { requireEditor } from '@/lib/auth/dal'

export const metadata: Metadata = { title: 'Categories' }

export default async function AdminCategoriesPage() {
  await requireEditor()
  const categories = await listCategories()
  return <CategoriesEditor categories={categories.map((c) => ({ _id: c._id, title: c.title, projects: c.projects }))} />
}
