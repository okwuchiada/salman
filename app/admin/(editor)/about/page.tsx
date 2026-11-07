import type { Metadata } from 'next'
import { AboutEditor, type AboutValues } from '@/components/admin/page-editors'
import { getEditable } from '@/lib/admin/content'
import { EDITABLE_FIELDS } from '@/lib/admin/types'
import { requireEditor } from '@/lib/auth/dal'

export const metadata: Metadata = { title: 'About page' }

export default async function AdminAboutPage() {
  await requireEditor()
  const editable = await getEditable<AboutValues>('aboutPage', 'aboutPage')
  const doc = (editable?.doc ?? {}) as Record<string, unknown>
  const initial = Object.fromEntries(EDITABLE_FIELDS.aboutPage.filter((f) => f in doc).map((f) => [f, doc[f]])) as AboutValues
  return <AboutEditor initial={initial} status={editable?.status ?? 'draft'} />
}
