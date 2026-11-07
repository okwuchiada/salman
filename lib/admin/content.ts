import 'server-only'
import { writeClient } from '@/sanity/write-client'
import type { DocStatus, EditableType } from './types'

const strip = (id: string) => id.replace(/^drafts\./, '')

export function statusOf(hasDraft: boolean, hasPublished: boolean): DocStatus {
  if (!hasPublished) return 'draft'
  return hasDraft ? 'changed' : 'published'
}

export type ProjectRow = {
  id: string
  title: string
  slug: string | null
  category: string | null
  categoryId: string | null
  year: number | null
  photos: number
  cover: { asset?: { _ref: string } } | null
  status: DocStatus
  orderRank: number | null
}

/** Every project, merging each draft over its published version. Not cached: editors need live data. */
export async function listProjects(): Promise<ProjectRow[]> {
  const docs = await writeClient().fetch<
    {
      _id: string
      title?: string
      slug?: string
      category?: string
      categoryId?: string
      year?: number
      photos: number
      cover?: { asset?: { _ref: string } }
      orderRank?: number
    }[]
  >(`*[_type == "project"]{
    _id, title, "slug": slug.current, "category": category->title, "categoryId": category._ref, year,
    "photos": count(gallery[defined(asset)]) + select(defined(coverImage.asset) => 1, 0),
    "cover": coverImage, orderRank
  }`)

  const byId = new Map<string, { draft?: (typeof docs)[number]; published?: (typeof docs)[number] }>()
  for (const doc of docs) {
    const id = strip(doc._id)
    const entry = byId.get(id) ?? {}
    if (doc._id.startsWith('drafts.')) entry.draft = doc
    else if (!doc._id.includes('.')) entry.published = doc
    byId.set(id, entry)
  }

  const rows: ProjectRow[] = []
  for (const [id, { draft, published }] of byId) {
    const d = draft ?? published
    if (!d) continue
    rows.push({
      id,
      title: d.title || 'Untitled project',
      slug: d.slug ?? null,
      category: d.category ?? null,
      categoryId: d.categoryId ?? null,
      year: d.year ?? null,
      photos: d.photos ?? 0,
      cover: d.cover ?? null,
      status: statusOf(Boolean(draft), Boolean(published)),
      orderRank: published?.orderRank ?? d.orderRank ?? null,
    })
  }
  return rows.sort((a, b) => (a.orderRank ?? 1e9) - (b.orderRank ?? 1e9) || a.title.localeCompare(b.title))
}

/** One editable document: the draft if there is one, else the published version. */
export async function getEditable<T extends Record<string, unknown>>(id: string, type: EditableType) {
  const [draft, published] = await writeClient().getDocuments([`drafts.${id}`, id])
  const doc = (draft ?? published) as (T & { _type: string; _id: string }) | null
  if (doc && doc._type !== type) return null
  return {
    id,
    doc,
    status: statusOf(Boolean(draft), Boolean(published)),
    updatedAt: (draft ?? published)?._updatedAt ?? null,
  }
}

export async function listCategories() {
  return writeClient().fetch<{ _id: string; title: string; slug: string | null; orderRank: number | null; projects: number }[]>(
    `*[_type == "category" && !(_id in path("drafts.**"))] | order(orderRank asc, title asc){
      _id, title, "slug": slug.current, orderRank,
      "projects": count(*[_type == "project" && !(_id in path("drafts.**")) && references(^._id)])
    }`,
  )
}

/** Published projects that can be chosen on the Home page. */
export async function listPublishedProjects() {
  return writeClient().fetch<{ _id: string; title: string; category: string | null; cover: { asset?: { _ref: string } } | null }[]>(
    `*[_type == "project" && !(_id in path("drafts.**")) && defined(slug.current)] | order(orderRank asc){
      _id, title, "category": category->title, "cover": coverImage
    }`,
  )
}
