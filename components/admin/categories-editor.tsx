'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteCategory, saveCategory } from '@/app/admin/actions'
import { Spinner, useActivity } from './activity'
import { useConfirm } from './confirm'

type Category = { _id: string; title: string; projects: number }

export function CategoriesEditor({ categories }: { categories: Category[] }) {
  const router = useRouter()
  // Only unsaved edits live here; otherwise each box shows the category's current name.
  // (Copying all names once on load left new categories blank after adding one.)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, start] = useTransition()
  const confirm = useConfirm()
  const track = useActivity()
  const [busyId, setBusyId] = useState<string | null>(null)

  const nameOf = (c: Category) => edits[c._id] ?? c.title
  const clearEdit = (id: string) =>
    setEdits((e) => {
      const next = { ...e }
      delete next[id]
      return next
    })

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, onSuccess?: () => void, busy = 'new') =>
    start(async () => {
      setBusyId(busy)
      const r = await track(fn())
      setBusyId(null)
      setMessage(r.ok ? { kind: 'ok', text: ok } : { kind: 'error', text: r.error ?? 'Something went wrong.' })
      if (r.ok) {
        onSuccess?.()
        router.refresh()
      }
    })

  return (
    <>
      <div className="top">
        <nav className="crumbs" aria-label="Breadcrumb">
          <b>Categories</b>
        </nav>
      </div>
      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="title">Categories</h1>
          <p className="sub">The filters on the Work page. A category only shows on the site once it has at least one published project. Changes here go live straight away.</p>
        </div>
        {message && (
          <div className={`notice ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
            <p>{message.text}</p>
          </div>
        )}
        <div style={{ maxWidth: 720 }}>
          {categories.map((c) => (
            <div className="cat-row" key={c._id}>
              <input
                className="in"
                aria-label={`Name of ${c.title}`}
                value={nameOf(c)}
                onChange={(e) => setEdits((n) => ({ ...n, [c._id]: e.target.value }))}
              />
              <span className="hint">{c.projects === 1 ? '1 project' : `${c.projects} projects`}</span>
              <span className="list-tools">
                <button
                  className="b b-sm"
                  type="button"
                  disabled={pending || !nameOf(c).trim() || nameOf(c).trim() === c.title}
                  onClick={() => run(() => saveCategory(c._id, nameOf(c)), 'Renamed.', () => clearEdit(c._id), c._id)}
                >
                  {busyId === c._id && pending && <Spinner />} Save
                </button>
                <button
                  className="b b-sm b-danger"
                  type="button"
                  disabled={pending}
                  onClick={async () => {
                    if (c.projects > 0) {
                      // Can't be deleted: say why, with a single OK button.
                      await confirm({
                        title: `“${c.title}” can’t be deleted yet`,
                        message: `${c.projects} project${c.projects > 1 ? 's use' : ' uses'} this category. Move ${
                          c.projects > 1 ? 'them' : 'it'
                        } to another category first, then delete it.`,
                        acknowledgeOnly: true,
                      })
                      return
                    }
                    const ok = await confirm({
                      title: `Delete the category “${c.title}”?`,
                      message: 'It’s removed from the Work page filters straight away.',
                      confirmLabel: 'Delete category',
                      danger: true,
                    })
                    if (ok) run(() => deleteCategory(c._id), 'Deleted.', undefined, `del-${c._id}`)
                  }}
                >
                  {busyId === `del-${c._id}` && pending && <Spinner />} Delete
                </button>
              </span>
            </div>
          ))}
          <form
            className="cat-row"
            onSubmit={(e) => {
              e.preventDefault()
              // Clear the box only once the category exists, so a rejected name can be corrected.
              run(() => saveCategory(null, newName), 'Category added.', () => setNewName(''))
            }}
          >
            <input className="in" aria-label="New category name" placeholder="New category, for example Interiors" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <span />
            <button className="b b-sm" type="submit" disabled={pending || !newName.trim()}>
              {busyId === 'new' && pending && <Spinner />} Add
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
