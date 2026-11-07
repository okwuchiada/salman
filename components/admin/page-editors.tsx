'use client'

/* eslint-disable @next/next/no-img-element -- editor previews come straight from Sanity's image CDN */

import { useState } from 'react'
import type { DocStatus, PhotoValue, Ref } from '@/lib/admin/types'
import { EditorBar, NoticeBox } from './editor-bar'
import { Dropdown } from './dropdown'
import { ObjectList, TextArea, TextField, move } from './fields'
import { PhotoField } from './photo-manager'
import { thumb } from './upload'
import { newKey, useDraft } from './use-draft'

type ProjectOption = { id: string; title: string; category: string | null; cover: string | undefined }

/* ---------- Home page ---------- */

export type HomeValues = {
  photographerName?: string
  role?: string
  heroHeadline?: string
  heroStatement?: string
  heroProject?: Ref
  selectedWork?: Ref[]
  seoDescription?: string
}

export function HomeEditor({
  initial,
  status,
  projects,
}: {
  initial: HomeValues
  status: DocStatus
  projects: ProjectOption[]
}) {
  const d = useDraft<HomeValues>('siteSettings', 'siteSettings', initial, status)
  const v = d.values
  const [toAdd, setToAdd] = useState('')
  const selected = (v.selectedWork ?? []).filter((r) => projects.some((p) => p.id === r._ref))
  const byId = new Map(projects.map((p) => [p.id, p]))
  const words = (v.heroHeadline ?? '').trim().split(/\s+/)
  const hero = v.heroProject ? byId.get(v.heroProject._ref) : undefined
  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.title,
    description: p.category ?? undefined,
    thumb: p.cover ? thumb(p.cover, 64) : undefined,
  }))

  return (
    <>
      <EditorBar
        crumbs={[{ label: 'Home page' }]}
        status={d.status}
        saveState={d.saveState}
        busy={d.busy}
        previewHref="/"
        onPublish={d.publish}
        onDiscard={d.discard}
      />
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="title">Home page</h1>
          <p className="sub">The opening of the site. The last word of the headline is set in italic automatically.</p>
        </div>
        <NoticeBox notice={d.notice} />
        <div className="editor">
          <div className="form">
            <div className="row2">
              <TextField label="Photographer’s name" value={v.photographerName} onChange={(photographerName) => d.set({ photographerName })} />
              <TextField label="Role" placeholder="Photographer" value={v.role} onChange={(role) => d.set({ role })} />
            </div>
            <TextField label="Headline" big value={v.heroHeadline} onChange={(heroHeadline) => d.set({ heroHeadline })} max={90} />
            <TextArea label="Introduction" rows={4} max={280} value={v.heroStatement} onChange={(heroStatement) => d.set({ heroStatement })} />
            <Dropdown
              label="Opening photograph"
              hint="Uses the cover of the project you choose, and links to it."
              placeholder="Choose a project…"
              clearLabel="No opening photograph"
              value={v.heroProject?._ref}
              options={projectOptions}
              onChange={(ref) => d.set({ heroProject: ref ? { _type: 'reference', _ref: ref } : undefined })}
            />

            <div className="card">
              <div className="card-h">
                <h2>Selected work</h2>
                <span className="hint">{selected.length} of 8 · shown in this order</span>
              </div>
              {selected.length > 0 && (
                <ul className="pick">
                  {selected.map((r, i) => {
                    const p = byId.get(r._ref)
                    return (
                      <li key={r._key ?? r._ref}>
                        <span className="label" style={{ textAlign: 'center' }}>
                          {i + 1}
                        </span>
                        {p?.cover ? <img src={thumb(p.cover, 80)} alt="" /> : <span className="thumb-empty" style={{ width: 40, height: 40 }} />}
                        <span>
                          {p?.title} <span className="hint">· {p?.category}</span>
                        </span>
                        <span className="list-tools">
                          <button className="icon-btn" type="button" aria-label={`Move ${p?.title} up`} disabled={i === 0} onClick={() => d.set({ selectedWork: move(selected, i, i - 1) })}>
                            ↑
                          </button>
                          <button
                            className="icon-btn"
                            type="button"
                            aria-label={`Move ${p?.title} down`}
                            disabled={i === selected.length - 1}
                            onClick={() => d.set({ selectedWork: move(selected, i, i + 1) })}
                          >
                            ↓
                          </button>
                          <button className="icon-btn" type="button" aria-label={`Remove ${p?.title} from Selected work`} onClick={() => d.set({ selectedWork: selected.filter((_, j) => j !== i) })}>
                            ×
                          </button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    label="Add a project"
                    placeholder="Choose a published project…"
                    emptyText="Every published project is already in Selected work."
                    value={toAdd || undefined}
                    options={projectOptions.filter((o) => !selected.some((r) => r._ref === o.value))}
                    onChange={setToAdd}
                  />
                </div>
                <button
                  className="b"
                  type="button"
                  disabled={!toAdd || selected.length >= 8}
                  onClick={() => {
                    d.set({ selectedWork: [...selected, { _type: 'reference', _ref: toAdd, _key: newKey() }] })
                    setToAdd('')
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <TextArea
              label="Search engine description"
              rows={2}
              max={160}
              value={v.seoDescription}
              onChange={(seoDescription) => d.set({ seoDescription })}
              hint="Shown under the site’s name in search results."
            />
          </div>

          <div style={{ position: 'sticky', top: 80 }}>
            <div className="preview" aria-label="Preview of the headline">
              <span className="label">Preview</span>
              <p className="h">
                {words.slice(0, -1).join(' ')} <i>{words.slice(-1).join(' ')}</i>
              </p>
              {hero?.cover && <img src={thumb(hero.cover, 480)} alt="" style={{ width: '55%', alignSelf: 'flex-end' }} />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ---------- Contact details ---------- */

export type ContactValues = {
  contactHeadline?: string
  contactIntro?: string
  email?: string
  instagramUrl?: string
  instagramHandle?: string
  location?: string
}

export function ContactEditor({ initial, status }: { initial: ContactValues; status: DocStatus }) {
  const d = useDraft<ContactValues>('siteSettings', 'siteSettings', initial, status)
  const v = d.values
  return (
    <>
      <EditorBar crumbs={[{ label: 'Contact details' }]} status={d.status} saveState={d.saveState} busy={d.busy} previewHref="/contact" onPublish={d.publish} onDiscard={d.discard} />
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="title">Contact details</h1>
          <p className="sub">Shown in the footer, on the Contact page and in the contact band on the Home page.</p>
        </div>
        <NoticeBox notice={d.notice} />
        <div className="form" style={{ maxWidth: 720 }}>
          <TextField label="Contact headline (Home page)" value={v.contactHeadline} onChange={(contactHeadline) => d.set({ contactHeadline })} />
          <TextArea label="Invitation (Contact page)" rows={3} value={v.contactIntro} onChange={(contactIntro) => d.set({ contactIntro })} />
          <div className="row2">
            <TextField label="Email" type="email" value={v.email} onChange={(email) => d.set({ email })} />
            <TextField label="Studio location" value={v.location} onChange={(location) => d.set({ location })} />
          </div>
          <div className="row2">
            <TextField label="Instagram link" type="url" placeholder="https://www.instagram.com/…" value={v.instagramUrl} onChange={(instagramUrl) => d.set({ instagramUrl })} />
            <TextField label="Instagram name" placeholder="@studio" value={v.instagramHandle} onChange={(instagramHandle) => d.set({ instagramHandle })} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ---------- About page ---------- */

type Block = { _type: 'block'; _key: string; style: 'normal'; markDefs: []; children: { _type: 'span'; _key: string; text: string; marks: [] }[] }

export type AboutValues = {
  portrait?: PhotoValue
  introduction?: string
  biography?: { children?: { text?: string }[] }[]
  philosophy?: string
  approach?: { _key: string; _type?: string; title?: string; description?: string }[]
  specialisations?: { _key: string; _type?: string; title?: string; description?: string }[]
  experience?: string
}

const blocksToText = (blocks: AboutValues['biography']) =>
  (blocks ?? []).map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join('\n\n')

const textToBlocks = (text: string): Block[] =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ _type: 'block', _key: newKey(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: newKey(), text: p, marks: [] }] }))

export function AboutEditor({ initial, status }: { initial: AboutValues; status: DocStatus }) {
  const d = useDraft<AboutValues>('aboutPage', 'aboutPage', initial, status)
  const v = d.values
  const [bio, setBio] = useState(() => blocksToText(initial.biography))
  return (
    <>
      <EditorBar crumbs={[{ label: 'About page' }]} status={d.status} saveState={d.saveState} busy={d.busy} previewHref="/about" onPublish={d.publish} onDiscard={d.discard} />
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="title">About page</h1>
          <p className="sub">Your portrait, story and way of working.</p>
        </div>
        <NoticeBox notice={d.notice} />
        <div className="editor">
          <div className="form">
            <TextArea label="Introduction" rows={3} value={v.introduction} onChange={(introduction) => d.set({ introduction })} hint="The short line beside your portrait, also used on the Home page." />
            <TextArea
              label="Biography"
              rows={8}
              value={bio}
              onChange={(text) => {
                setBio(text)
                d.set({ biography: textToBlocks(text) })
              }}
              hint="Plain paragraphs. Leave a blank line between paragraphs."
            />
            <TextArea label="Philosophy" rows={3} value={v.philosophy} onChange={(philosophy) => d.set({ philosophy })} hint="Set large. Everything after the first sentence is italic." />
            <ObjectList
              label="How I work"
              hint="Steps, in order"
              items={v.approach as never}
              itemType="approachStep"
              addLabel="Add step"
              max={4}
              fields={[
                { name: 'title', label: 'Step' },
                { name: 'description', label: 'Description', multiline: true },
              ]}
              onChange={(approach) => d.set({ approach: approach as AboutValues['approach'] })}
            />
            <ObjectList
              label="Specialisations"
              items={v.specialisations as never}
              itemType="specialisation"
              addLabel="Add specialisation"
              fields={[
                { name: 'title', label: 'Name' },
                { name: 'description', label: 'Short description' },
              ]}
              onChange={(specialisations) => d.set({ specialisations: specialisations as AboutValues['specialisations'] })}
            />
            <TextArea label="Experience" rows={4} value={v.experience} onChange={(experience) => d.set({ experience })} />
          </div>
          <PhotoField label="Portrait" value={v.portrait} onChange={(portrait) => d.set({ portrait })} />
        </div>
      </div>
    </>
  )
}
