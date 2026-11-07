'use server'

import { randomUUID } from 'node:crypto'
import { updateTag } from 'next/cache'
import { assertEditor } from '@/lib/auth/dal'
import { EDITABLE_FIELDS, type ActionResult, type EditableType } from '@/lib/admin/types'
import { writeClient } from '@/sanity/write-client'

/*
 * Server actions behind the /admin editor. Every action:
 *  1. checks the signed-in editor (assertEditor), never trusting the page that called it,
 *  2. only writes fields listed in EDITABLE_FIELDS,
 *  3. returns a small result object, never raw documents.
 * Edits go to the draft (drafts.<id>); publishing uses Sanity's document actions.
 */

const SINGLETONS: Partial<Record<EditableType, string>> = { siteSettings: 'siteSettings', aboutPage: 'aboutPage' }
const SYSTEM_FIELDS = ['_rev', '_createdAt', '_updatedAt']
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

function fail(error: string, problems?: string[]): ActionResult<never> {
  return { ok: false, error, problems }
}

function checkId(id: string, type: EditableType) {
  const singleton = SINGLETONS[type]
  if (singleton) return id === singleton
  return ID.test(id) && !id.startsWith('drafts.')
}

/** Adds a _key to array items that lack one, so Sanity accepts them. */
function withKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? { _key: key(), ...(withKeys(item) as object), ...('_key' in item && item._key ? { _key: item._key } : {}) }
        : item,
    )
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withKeys(v)]))
  }
  return value
}

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
}

function tagsFor(type: EditableType, slugs: (string | undefined | null)[] = []) {
  const tags: string[] = [type]
  if (type === 'project') {
    for (const s of slugs) if (s) tags.push(`project:${s}`)
  }
  return tags
}

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/reference/i.test(msg) && /delete|remove/i.test(msg)) {
    return 'This project is still used on the Home page. Remove it from Selected work or the opening photograph first.'
  }
  console.error('[admin]', err)
  return 'Something went wrong while talking to Sanity. Please try again.'
}

/* ---------- Drafts ---------- */

/**
 * Saves editor changes to the draft. `values` holds every editable field the form
 * manages; empty values are removed from the document.
 */
export async function saveDraft(type: EditableType, id: string, values: Record<string, unknown>): Promise<ActionResult> {
  await assertEditor()
  if (!EDITABLE_FIELDS[type] || !checkId(id, type)) return fail('Unknown document.')

  const allowed = EDITABLE_FIELDS[type]
  const set: Record<string, unknown> = {}
  const unset: string[] = []
  for (const [field, value] of Object.entries(values)) {
    if (!allowed.includes(field)) return fail(`The field "${field}" can't be edited here.`)
    if (isEmpty(value)) unset.push(field)
    else set[field] = withKeys(value)
  }
  if (typeof set.year === 'string') set.year = Number(set.year) || undefined

  try {
    const client = writeClient()
    const draftId = `drafts.${id}`
    const [draft, published] = await client.getDocuments([draftId, id])
    const existing = draft ?? published
    if (existing && existing._type !== type) return fail('Unknown document.')
    if (!existing && !SINGLETONS[type]) return fail('This document no longer exists.')

    const base = Object.fromEntries(
      Object.entries(existing ?? { _type: type }).filter(([k]) => !SYSTEM_FIELDS.includes(k)),
    )
    await client
      .transaction()
      .createIfNotExists({ ...base, _id: draftId, _type: type })
      .patch(draftId, (p) => {
        let patch = p
        if (Object.keys(set).length) patch = patch.set(set)
        if (unset.length) patch = patch.unset(unset)
        return patch
      })
      .commit({ visibility: 'sync' })
    return { ok: true }
  } catch (err) {
    return fail(friendly(err))
  }
}

/** Throws away unpublished changes and returns to the published version. */
export async function discardDraft(type: EditableType, id: string): Promise<ActionResult> {
  await assertEditor()
  if (!checkId(id, type)) return fail('Unknown document.')
  try {
    const client = writeClient()
    const published = await client.getDocument(id)
    if (!published) return fail('This has never been published, so there is nothing to go back to. Delete it instead.')
    await client.action({ actionType: 'sanity.action.document.discard', draftId: `drafts.${id}` })
    return { ok: true }
  } catch (err) {
    return fail(friendly(err))
  }
}

/* ---------- Publishing ---------- */

async function problemsFor(type: EditableType, id: string, doc: Record<string, unknown>) {
  const problems: string[] = []
  const photos = (list: unknown) => (Array.isArray(list) ? list : []) as { asset?: unknown; alt?: string }[]

  if (type === 'project') {
    if (!doc.title) problems.push('Add a title.')
    const slug = (doc.slug as { current?: string } | undefined)?.current
    if (!slug) problems.push('Add a web address.')
    else if (!SLUG.test(slug)) problems.push('The web address can only use lowercase letters, numbers and hyphens.')
    else {
      const taken = await writeClient().fetch<number>(
        'count(*[_type == "project" && slug.current == $slug && !(_id in [$id, $draftId])])',
        { slug, id, draftId: `drafts.${id}` },
      )
      if (taken > 0) problems.push(`Another project already uses the web address "${slug}".`)
    }
    if (!doc.category) problems.push('Choose a category.')
    const cover = doc.coverImage as { asset?: unknown; alt?: string } | undefined
    if (!cover?.asset) problems.push('Add at least one photo. The first one is the cover.')
    const all = [cover, ...photos(doc.gallery)].filter((p) => p?.asset)
    const missing = all.filter((p) => !p?.alt?.trim()).length
    if (missing) problems.push(`${missing} photo${missing > 1 ? 's need' : ' needs'} a description (alt text).`)
  }
  if (type === 'siteSettings') {
    if (!doc.photographerName) problems.push('Add the photographer’s name.')
    if (!doc.heroHeadline) problems.push('Add a headline.')
    if (doc.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(doc.email))) problems.push('The email address looks incomplete.')
    if (doc.instagramUrl && !/^https:\/\//.test(String(doc.instagramUrl))) problems.push('The Instagram link must start with https://')
  }
  if (type === 'aboutPage') {
    const portrait = doc.portrait as { asset?: unknown; alt?: string } | undefined
    if (portrait?.asset && !portrait.alt?.trim()) problems.push('The portrait needs a description (alt text).')
  }
  return problems
}

/** Checks the draft and publishes it, then refreshes the public site's cached data. */
export async function publishDoc(type: EditableType, id: string): Promise<ActionResult> {
  await assertEditor()
  if (!checkId(id, type)) return fail('Unknown document.')
  try {
    const client = writeClient()
    const [draft, published] = await client.getDocuments([`drafts.${id}`, id])
    if (!draft) return { ok: true, message: 'Already up to date.' }
    if (draft._type !== type) return fail('Unknown document.')

    const problems = await problemsFor(type, id, draft)
    if (problems.length) return fail('Fix these before publishing:', problems)

    await client.action({ actionType: 'sanity.action.document.publish', draftId: `drafts.${id}`, publishedId: id })

    const slugOf = (d: Record<string, unknown> | null | undefined) => (d?.slug as { current?: string } | undefined)?.current
    for (const tag of tagsFor(type, [slugOf(draft), slugOf(published)])) updateTag(tag)
    return { ok: true, message: 'Published. The site shows the change on the next page load.' }
  } catch (err) {
    return fail(friendly(err))
  }
}

/** Takes a project off the site but keeps it as a draft. */
export async function unpublishProject(id: string): Promise<ActionResult> {
  await assertEditor()
  if (!checkId(id, 'project')) return fail('Unknown document.')
  try {
    const client = writeClient()
    const published = await client.getDocument(id)
    if (!published) return { ok: true, message: 'Not published.' }
    await client.action({ actionType: 'sanity.action.document.unpublish', draftId: `drafts.${id}`, publishedId: id })
    for (const tag of tagsFor('project', [(published.slug as { current?: string } | undefined)?.current])) updateTag(tag)
    return { ok: true, message: 'Taken off the site. It is kept as a draft.' }
  } catch (err) {
    return fail(friendly(err))
  }
}

/* ---------- Projects ---------- */

/** Creates an empty draft project and returns its id. */
export async function createProject(): Promise<ActionResult<{ id: string }>> {
  await assertEditor()
  try {
    const client = writeClient()
    const last = await client.fetch<number | null>('*[_type == "project" && defined(orderRank)] | order(orderRank desc)[0].orderRank')
    // An _id ending in "." lets Sanity generate the rest of the id.
    const doc = await client.create({ _id: 'drafts.', _type: 'project', title: 'Untitled project', orderRank: (last ?? 0) + 1 })
    return { ok: true, data: { id: doc._id.replace(/^drafts\./, '') } }
  } catch (err) {
    return fail(friendly(err))
  }
}

/** Deletes a project and its draft. */
export async function deleteProject(id: string): Promise<ActionResult> {
  await assertEditor()
  if (!checkId(id, 'project')) return fail('Unknown document.')
  try {
    const client = writeClient()
    const published = await client.getDocument(id)
    if (published) {
      await client.action({ actionType: 'sanity.action.document.delete', publishedId: id, includeDrafts: [`drafts.${id}`] })
      for (const tag of tagsFor('project', [(published.slug as { current?: string } | undefined)?.current])) updateTag(tag)
    } else {
      await client.action({ actionType: 'sanity.action.document.discard', draftId: `drafts.${id}` })
    }
    return { ok: true }
  } catch (err) {
    return fail(friendly(err))
  }
}

/** Saves the order of projects on the Work page. Applies to the live site straight away. */
export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  await assertEditor()
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every((id) => checkId(id, 'project'))) return fail('Unknown projects.')
  try {
    const client = writeClient()
    const existing = new Set(
      await client.fetch<string[]>('*[_type == "project" && _id in $all]._id', {
        all: ids.flatMap((id) => [id, `drafts.${id}`]),
      }),
    )
    const tx = client.transaction()
    ids.forEach((id, i) => {
      if (existing.has(id)) tx.patch(id, (p) => p.set({ orderRank: i }))
      if (existing.has(`drafts.${id}`)) tx.patch(`drafts.${id}`, (p) => p.set({ orderRank: i }))
    })
    await tx.commit({ visibility: 'sync' })
    updateTag('project')
    return { ok: true }
  } catch (err) {
    return fail(friendly(err))
  }
}

/* ---------- Categories (published directly; they are short labels) ---------- */

export async function saveCategory(id: string | null, title: string): Promise<ActionResult> {
  await assertEditor()
  const clean = title.trim().slice(0, 60)
  if (!clean) return fail('Add a name.')
  const slug = clean.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  try {
    const client = writeClient()
    if (id) {
      if (!ID.test(id)) return fail('Unknown category.')
      await client.patch(id).set({ title: clean }).commit()
    } else {
      const taken = await client.fetch<number>('count(*[_type == "category" && slug.current == $slug])', { slug })
      if (taken) return fail(`A category called "${clean}" already exists.`)
      const last = await client.fetch<number | null>('*[_type == "category"] | order(orderRank desc)[0].orderRank')
      await client.create({ _type: 'category', title: clean, slug: { _type: 'slug', current: slug }, orderRank: (last ?? 0) + 1 })
    }
    updateTag('category')
    return { ok: true }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await assertEditor()
  if (!ID.test(id)) return fail('Unknown category.')
  try {
    const client = writeClient()
    const used = await client.fetch<number>('count(*[_type == "project" && references($id)])', { id })
    if (used) return fail(`${used} project${used > 1 ? 's use' : ' uses'} this category. Move them to another category first.`)
    await client.delete(id)
    updateTag('category')
    return { ok: true }
  } catch (err) {
    return fail(friendly(err))
  }
}
