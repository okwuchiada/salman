/** Shapes shared by the editor's server code and client components. */

export type DocStatus = 'published' | 'changed' | 'draft'

export type Ref = { _type: 'reference'; _ref: string; _key?: string }

export type PhotoValue = {
  _type: 'photo'
  _key?: string
  asset?: { _type: 'reference'; _ref: string }
  alt?: string
  caption?: string
}

export type EditableType = 'project' | 'siteSettings' | 'aboutPage'

/** Fields the editor may write, per document type. Anything else is rejected. */
export const EDITABLE_FIELDS: Record<EditableType, readonly string[]> = {
  project: [
    'title', 'slug', 'category', 'summary', 'statement', 'year', 'client', 'location',
    'credits', 'coverImage', 'gallery', 'seoDescription',
  ],
  siteSettings: [
    'photographerName', 'role', 'heroHeadline', 'heroStatement', 'heroProject', 'selectedWork',
    'contactHeadline', 'contactIntro', 'email', 'instagramUrl', 'instagramHandle', 'location', 'seoDescription',
  ],
  aboutPage: ['portrait', 'introduction', 'biography', 'philosophy', 'approach', 'specialisations', 'experience'],
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; problems?: string[] }
