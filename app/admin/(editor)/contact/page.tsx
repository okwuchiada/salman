import type { Metadata } from 'next'
import { ContactEditor, type ContactValues } from '@/components/admin/page-editors'
import { getEditable } from '@/lib/admin/content'
import { requireEditor } from '@/lib/auth/dal'

export const metadata: Metadata = { title: 'Contact details' }

const FIELDS = ['contactHeadline', 'contactIntro', 'email', 'instagramUrl', 'instagramHandle', 'location'] as const

export default async function AdminContactPage() {
  await requireEditor()
  const editable = await getEditable<ContactValues>('siteSettings', 'siteSettings')
  const doc = (editable?.doc ?? {}) as Record<string, unknown>
  const initial = Object.fromEntries(FIELDS.filter((f) => f in doc).map((f) => [f, doc[f]])) as ContactValues
  return <ContactEditor initial={initial} status={editable?.status ?? 'draft'} />
}
