'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { deleteProject, unpublishProject } from '@/app/admin/actions'
import type { DocStatus, PhotoValue, Ref } from '@/lib/admin/types'
import { useActivity } from './activity'
import { useConfirm } from './confirm'
import { EditorBar, NoticeBox } from './editor-bar'
import { NumberField, ObjectList, SelectField, SlugField, TextArea, TextField } from './fields'
import { PhotoManager, type Photo } from './photo-manager'
import { useDraft } from './use-draft'

export type ProjectValues = {
  title?: string
  slug?: { _type: 'slug'; current?: string }
  category?: Ref
  summary?: string
  statement?: string
  year?: number
  client?: string
  location?: string
  credits?: { _key: string; _type?: string; role?: string; name?: string }[]
  coverImage?: PhotoValue
  gallery?: PhotoValue[]
  seoDescription?: string
}

export function ProjectEditor({
  id,
  initial,
  status: initialStatus,
  categories,
  siteHost,
}: {
  id: string
  initial: ProjectValues
  status: DocStatus
  categories: { value: string; label: string }[]
  siteHost: string
}) {
  const router = useRouter()
  const d = useDraft<ProjectValues>('project', id, initial, initialStatus)
  const v = d.values
  const [pending, start] = useTransition()
  const confirm = useConfirm()
  const track = useActivity()

  // The editor shows cover + gallery as one ordered list.
  const photos: Photo[] = [v.coverImage, ...(v.gallery ?? [])]
    .filter((p): p is PhotoValue => Boolean(p?.asset))
    // coverImage is a single field with no _key, so give it a stable one for the list.
    .map((p, i) => ({ ...p, _key: p._key ?? (i === 0 ? 'cover' : `photo-${i}`) }))
  const setPhotos = (list: Photo[]) => {
    const [cover, ...rest] = list
    d.set({
      coverImage: cover ? { _type: 'photo', asset: cover.asset, alt: cover.alt, caption: cover.caption } : undefined,
      gallery: rest,
    })
  }

  const slug = v.slug?.current
  return (
    <>
      <EditorBar
        crumbs={[{ label: 'Projects', href: '/admin' }, { label: v.title || 'Untitled project' }]}
        status={d.status}
        saveState={d.saveState}
        busy={d.busy || pending}
        previewHref={slug ? `/work/${slug}` : null}
        onPublish={d.publish}
        onDiscard={d.discard}
      />
      <div className="content">
        <NoticeBox notice={d.notice} />
        <div className="editor">
          <div className="form">
            <TextField label="Title" big value={v.title} onChange={(title) => d.set({ title })} max={120} />
            <SlugField
              prefix={`${siteHost}/work/`}
              value={slug}
              source={v.title}
              onChange={(current) => d.set({ slug: { _type: 'slug', current } })}
            />
            <div className="row2">
              <SelectField
                label="Category"
                placeholder="Choose a category…"
                value={v.category?._ref}
                options={categories}
                onChange={(ref) => d.set({ category: ref ? { _type: 'reference', _ref: ref } : undefined })}
              />
              <NumberField label="Year" value={v.year} onChange={(year) => d.set({ year })} />
            </div>
            <TextArea
              label="Summary"
              value={v.summary}
              onChange={(summary) => d.set({ summary })}
              max={280}
              hint="One or two sentences under the title. Also used by search engines."
            />
            <TextArea
              label="Statement"
              rows={2}
              value={v.statement}
              onChange={(statement) => d.set({ statement })}
              hint="Optional. Set large between the photographs; everything after the first sentence is italic."
            />
            <div className="row2">
              <TextField label="Client" placeholder="Optional" value={v.client} onChange={(client) => d.set({ client })} />
              <TextField label="Location" placeholder="Optional" value={v.location} onChange={(location) => d.set({ location })} />
            </div>
            <ObjectList
              label="Credits"
              items={v.credits as never}
              itemType="credit"
              addLabel="Add credit"
              fields={[
                { name: 'role', label: 'Role, for example Styling' },
                { name: 'name', label: 'Name' },
              ]}
              onChange={(credits) => d.set({ credits: credits as ProjectValues['credits'] })}
            />
            <TextArea
              label="Search engine description"
              rows={2}
              max={160}
              value={v.seoDescription}
              onChange={(seoDescription) => d.set({ seoDescription })}
              hint="Optional. Falls back to the summary."
            />
            <div className="split-line">
              <button
                className="b b-danger"
                type="button"
                disabled={pending}
                onClick={async () => {
                  const ok = await confirm({
                    title: `Delete “${v.title || 'this project'}”?`,
                    message: 'The project, its unpublished changes and its place on the site are removed. This can’t be undone.',
                    confirmLabel: 'Delete project',
                    danger: true,
                  })
                  if (!ok) return
                  start(async () => {
                    const r = await track(deleteProject(id))
                    if (r.ok) router.push('/admin')
                    else d.setNotice({ kind: 'error', text: r.error })
                  })
                }}
              >
                Delete project
              </button>
              {d.status !== 'draft' && (
                <button
                  className="b b-ghost"
                  type="button"
                  disabled={pending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Take this project off the site?',
                      message: 'Visitors won’t see it any more. It stays here as a draft, and you can publish it again at any time.',
                      confirmLabel: 'Unpublish',
                    })
                    if (!ok) return
                    start(async () => {
                      const r = await track(unpublishProject(id))
                      if (r.ok) {
                        d.setStatus('draft')
                        d.setNotice({ kind: 'ok', text: r.message ?? 'Unpublished.' })
                      } else d.setNotice({ kind: 'error', text: r.error })
                    })
                  }}
                >
                  Unpublish
                </button>
              )}
            </div>
          </div>

          <PhotoManager photos={photos} onChange={setPhotos} />
        </div>
      </div>
    </>
  )
}
