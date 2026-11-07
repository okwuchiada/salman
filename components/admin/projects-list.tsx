'use client'

/* eslint-disable @next/next/no-img-element -- editor previews come straight from Sanity's image CDN */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createProject, reorderProjects } from '@/app/admin/actions'
import type { DocStatus } from '@/lib/admin/types'
import { Spinner, useActivity } from './activity'
import { StatusBadge } from './editor-bar'
import { move } from './fields'
import { thumb } from './upload'

export type Row = {
  id: string
  title: string
  category: string | null
  year: number | null
  photos: number
  cover: string | undefined
  status: DocStatus
}

const TABS: { id: 'all' | DocStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'changed', label: 'Unpublished changes' },
  { id: 'draft', label: 'Drafts' },
]

const Grip = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    {[4, 8, 12].flatMap((y) => [5, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" />))}
  </svg>
)

export function ProjectsList({ rows: initial }: { rows: Row[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [tab, setTab] = useState<'all' | DocStatus>('all')
  const [query, setQuery] = useState('')
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, start] = useTransition()
  const track = useActivity()
  const [creating, setCreating] = useState(false)

  const filtering = tab !== 'all' || query.trim() !== ''
  const q = query.trim().toLowerCase()
  const shown = rows.filter((r) => (tab === 'all' || r.status === tab) && (!q || `${r.title} ${r.category ?? ''}`.toLowerCase().includes(q)))

  function reorder(from: number, to: number) {
    const next = move(rows, from, to)
    if (next === rows) return
    setRows(next)
    start(async () => {
      const r = await track(reorderProjects(next.map((x) => x.id)))
      setMessage(r.ok ? { kind: 'ok', text: 'Order saved. The Work page uses it straight away.' } : { kind: 'error', text: r.error })
      if (!r.ok) setRows(rows)
    })
  }

  return (
    <>
      <div className="top">
        <nav className="crumbs" aria-label="Breadcrumb">
          <b>Projects</b>
        </nav>
        <div className="actions">
          <button
            className="b b-primary"
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setCreating(true)
                const r = await track(createProject())
                if (r.ok && r.data) router.push(`/admin/projects/${r.data.id}`)
                else {
                  setCreating(false)
                  if (!r.ok) setMessage({ kind: 'error', text: r.error })
                }
              })
            }
          >
            {creating ? (
              <>
                <Spinner /> Creating…
              </>
            ) : (
              '+ New project'
            )}
          </button>
        </div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="title">Projects</h1>
          <p className="sub">
            Drag projects, or use the arrows, to change their order on the Work page. Edits save as drafts and go live when you publish.
          </p>
        </div>

        {message && (
          <div className={`notice ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
            <p>{message.text}</p>
          </div>
        )}

        <div className="toolbar">
          <div className="tabs" role="group" aria-label="Filter by status">
            {TABS.map((t) => (
              <button key={t.id} className="tab" type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label} <span className="n">{t.id === 'all' ? rows.length : rows.filter((r) => r.status === t.id).length}</span>
              </button>
            ))}
          </div>
          <label className="search">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" fill="none" />
              <path d="M10.5 10.5 14 14" stroke="currentColor" />
            </svg>
            <input type="search" className="outline-0 focus:outline-0" placeholder="Search projects" aria-label="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {filtering && <p className="hint">Clear the filter and search to change the order.</p>}

        {shown.length === 0 ? (
          <div className="empty">
            <p>{rows.length === 0 ? 'No projects yet.' : 'No projects match.'}</p>
          </div>
        ) : (
          <div>
            <div className="phead">
              <span />
              <span />
              <span className="label">Title</span>
              <span className="label">Category · Year</span>
              <span className="label">Photos</span>
              <span className="label">Status</span>
              <span />
            </div>
            <ul className="plist">
              {shown.map((r) => {
                const i = rows.indexOf(r)
                return (
                  <li
                    key={r.id}
                    className="prow-wrap"
                    draggable={!filtering}
                    data-dragging={dragFrom === i || undefined}
                    data-over={dragOver === i && dragFrom !== i ? true : undefined}
                    onDragStart={(e) => {
                      setDragFrom(i)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      if (dragFrom === null) return
                      e.preventDefault()
                      setDragOver(i)
                    }}
                    onDrop={(e) => {
                      if (dragFrom === null) return
                      e.preventDefault()
                      reorder(dragFrom, i)
                      setDragFrom(null)
                      setDragOver(null)
                    }}
                    onDragEnd={() => {
                      setDragFrom(null)
                      setDragOver(null)
                    }}
                  >
                    <Link className="prow" href={`/admin/projects/${r.id}`}>
                      <span className="grip" aria-hidden="true">
                        <Grip />
                      </span>
                      {r.cover ? <img src={thumb(r.cover, 128)} alt="" /> : <span className="thumb-empty" aria-hidden="true" />}
                      <span className="t">{r.title}</span>
                      <span className="m hide-sm">{[r.category ?? 'No category', r.year].filter(Boolean).join(' · ')}</span>
                      <span className="m hide-sm">{r.photos === 1 ? '1 photo' : `${r.photos} photos`}</span>
                      <span>
                        <StatusBadge status={r.status} />
                      </span>
                      <span className="m hide-sm" aria-hidden="true">
                        ›
                      </span>
                    </Link>
                    {!filtering && (
                      <span className="reorder">
                        <button className="icon-btn" type="button" aria-label={`Move ${r.title} up`} disabled={i === 0 || pending} onClick={() => reorder(i, i - 1)}>
                          ↑
                        </button>
                        <button
                          className="icon-btn"
                          type="button"
                          aria-label={`Move ${r.title} down`}
                          disabled={i === rows.length - 1 || pending}
                          onClick={() => reorder(i, i + 1)}
                        >
                          ↓
                        </button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
