'use client'

import Link from 'next/link'
import type { DocStatus } from '@/lib/admin/types'
import { Spinner } from './activity'
import type { Notice, SaveState } from './use-draft'

const STATUS = {
  published: { cls: 'st st-pub', label: 'Published' },
  changed: { cls: 'st st-chg', label: 'Unpublished changes' },
  draft: { cls: 'st st-dft', label: 'Draft, not on site' },
} as const

const SAVE: Record<SaveState, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved as draft',
  error: 'Not saved',
}

export function StatusBadge({ status }: { status: DocStatus }) {
  return <span className={STATUS[status].cls}>{STATUS[status].label}</span>
}

/** Sticky bar with breadcrumbs, save state and the Publish / Discard buttons. */
export function EditorBar({
  crumbs,
  status,
  saveState,
  busy,
  previewHref,
  onPublish,
  onDiscard,
}: {
  crumbs: { label: string; href?: string }[]
  status: DocStatus
  saveState: SaveState
  busy: boolean
  previewHref?: string | null
  onPublish: () => void
  onDiscard: () => void
}) {
  return (
    <div className="top">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.label} style={{ display: 'contents' }}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <b>{c.label}</b>}
          </span>
        ))}
      </nav>
      <div className="actions">
        <StatusBadge status={status} />
        <span className="saving" aria-live="polite">
          {saveState === 'saving' && <Spinner />}
          {SAVE[saveState]}
        </span>
        {previewHref && status !== 'draft' && (
          <a className="b b-ghost" href={previewHref} target="_blank" rel="noopener noreferrer">
            View on site ↗
          </a>
        )}
        {status === 'changed' && (
          <button className="b" type="button" onClick={onDiscard} disabled={busy}>
            Discard changes
          </button>
        )}
        <button className="b b-primary" type="button" onClick={onPublish} disabled={busy || status === 'published'}>
          {busy ? (
            <>
              <Spinner /> Working…
            </>
          ) : status === 'published' ? (
            'Published'
          ) : (
            'Publish'
          )}
        </button>
      </div>
    </div>
  )
}

export function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null
  return (
    <div className={`notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      <p>{notice.text}</p>
      {notice.problems && notice.problems.length > 0 && (
        <ul>
          {notice.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
