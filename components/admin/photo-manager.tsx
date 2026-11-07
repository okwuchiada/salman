'use client'

/* eslint-disable @next/next/no-img-element -- editor previews come straight from Sanity's image CDN at fixed sizes */

import { useId, useRef, useState } from 'react'
import type { PhotoValue } from '@/lib/admin/types'
import { useActivity } from './activity'
import { useConfirm } from './confirm'
import { move } from './fields'
import { dimensionsOf, preview, thumb, uploadPhoto } from './upload'
import { newKey } from './use-draft'

export type Photo = PhotoValue & { _key: string }
type Pending = { _key: string; name: string; url: string }

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The photographs of a project as one ordered list; the first is the cover.
 * Upload by dropping or choosing files, reorder by dragging or with the arrow
 * buttons, and edit each photo's description and caption.
 */
export function PhotoManager({ photos, onChange }: { photos: Photo[]; onChange: (photos: Photo[]) => void }) {
  const [selected, setSelected] = useState(0)
  const [pending, setPending] = useState<Pending[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [dropActive, setDropActive] = useState(false)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const latest = useRef(photos)
  latest.current = photos
  const altId = useId()
  const captionId = useId()
  const confirm = useConfirm()
  const track = useActivity()

  const current = photos[Math.min(selected, photos.length - 1)]
  const currentIndex = Math.min(selected, photos.length - 1)

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setErrors([])
    const queued = list.map((f) => ({ _key: newKey(), name: f.name, url: URL.createObjectURL(f) }))
    setPending((p) => [...p, ...queued])
    for (const [i, file] of list.entries()) {
      try {
        const up = await track(uploadPhoto(file))
        const photo: Photo = { _key: queued[i]._key, _type: 'photo', asset: { _type: 'reference', _ref: up.assetId }, alt: '' }
        onChange([...latest.current, photo])
      } catch (err) {
        setErrors((e) => [...e, err instanceof Error ? err.message : `Could not upload ${file.name}.`])
      } finally {
        URL.revokeObjectURL(queued[i].url)
        setPending((p) => p.filter((x) => x._key !== queued[i]._key))
      }
    }
  }

  const update = (i: number, patch: Partial<Photo>) => onChange(photos.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const reorder = (from: number, to: number) => {
    onChange(move(photos, from, to))
    if (selected === from) setSelected(to)
  }
  const remove = async (i: number) => {
    const ok = await confirm({
      title: 'Remove this photo?',
      message:
        i === 0
          ? 'It’s the cover, so the next photo becomes the cover. The change goes live when you publish.'
          : 'It’s taken out of this project. The change goes live when you publish.',
      confirmLabel: 'Remove photo',
      danger: true,
    })
    if (!ok) return
    onChange(photos.filter((_, j) => j !== i))
    setSelected((s) => Math.max(0, s >= i ? s - 1 : s))
  }

  const missing = photos.filter((p) => !p.alt?.trim()).length

  return (
    <div className="card" style={{ gap: 20 }}>
      <div className="card-h">
        <h2>
          Photographs <span className="n">· {photos.length}</span>
        </h2>
        <span className="hint">Drag to reorder. The first photo is the cover.</span>
      </div>

      <div
        className="drop"
        data-active={dropActive || undefined}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setDropActive(true)
          }
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return
          e.preventDefault()
          setDropActive(false)
          void addFiles(e.dataTransfer.files)
        }}
      >
        <p>Drop photos here, or</p>
        <button className="b" type="button" onClick={() => inputRef.current?.click()}>
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="notice error" role="alert">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      {missing > 0 && (
        <p className="hint warn">
          {missing} photo{missing > 1 ? 's need' : ' needs'} a description before publishing.
        </p>
      )}

      {photos.length + pending.length > 0 ? (
        <div className="photos">
          {photos.map((p, i) => (
            <button
              key={p._key}
              type="button"
              className="photo"
              aria-pressed={i === currentIndex}
              aria-label={`Photo ${i + 1}${i === 0 ? ', cover' : ''}${p.alt ? `: ${p.alt}` : ', needs a description'}`}
              onClick={() => setSelected(i)}
              draggable
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
              <span className="frame">
                <img src={thumb(p.asset?._ref)} alt="" loading="lazy" />
                {i === 0 && <span className="badge">Cover</span>}
              </span>
              <span className="n">
                <span>{pad(i + 1)}</span>
                {!p.alt?.trim() && <span className="warn">Needs description</span>}
              </span>
            </button>
          ))}
          {pending.map((p) => (
            <div key={p._key} className="photo" aria-busy="true">
              <span className="frame uploading">
                <img src={p.url} alt="" style={{ opacity: 0.4 }} />
              </span>
              <span className="n">Uploading…</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">No photos yet.</p>
      )}

      {current && (
        <div className="detail">
          <img src={preview(current.asset?._ref, 480)} alt="" />
          <div className="form" style={{ gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span className="label">
                Photo {currentIndex + 1} of {photos.length}
              </span>
              <span className="hint">{dimensionsOf(current.asset?._ref)}</span>
            </div>
            <div className="f">
              <label htmlFor={altId}>Description for screen readers (alt text)</label>
              <textarea
                id={altId}
                className="in"
                rows={2}
                placeholder="Describe what is in the photograph"
                value={current.alt ?? ''}
                onChange={(e) => update(currentIndex, { alt: e.target.value })}
              />
            </div>
            <div className="f">
              <label htmlFor={captionId}>Caption</label>
              <input
                id={captionId}
                className="in"
                placeholder="Optional, shown beside the photo"
                value={current.caption ?? ''}
                onChange={(e) => update(currentIndex, { caption: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="b" type="button" disabled={currentIndex === 0} onClick={() => reorder(currentIndex, 0)}>
                Make cover
              </button>
              <button className="b" type="button" aria-label="Move earlier" disabled={currentIndex === 0} onClick={() => reorder(currentIndex, currentIndex - 1)}>
                ← Earlier
              </button>
              <button
                className="b"
                type="button"
                aria-label="Move later"
                disabled={currentIndex === photos.length - 1}
                onClick={() => reorder(currentIndex, currentIndex + 1)}
              >
                Later →
              </button>
              <button className="b b-danger" type="button" onClick={() => remove(currentIndex)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** One photo with upload, description and remove (the About portrait). */
export function PhotoField({
  label,
  value,
  onChange,
}: {
  label: string
  value: PhotoValue | undefined
  onChange: (v: PhotoValue | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const altId = useId()
  const track = useActivity()

  async function choose(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const up = await track(uploadPhoto(file))
      onChange({ _type: 'photo', asset: { _type: 'reference', _ref: up.assetId }, alt: value?.alt ?? '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-h">
        <h2>{label}</h2>
      </div>
      <div className="single-photo">
        <div className="frame">
          {value?.asset?._ref ? <img src={preview(value.asset._ref, 400)} alt="" /> : uploading ? 'Uploading…' : 'No photo yet'}
        </div>
        <div className="form" style={{ gap: 14 }}>
          {value?.asset && (
            <div className="f">
              <label htmlFor={altId}>Description for screen readers (alt text)</label>
              <textarea id={altId} className="in" rows={2} value={value.alt ?? ''} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
            </div>
          )}
          {error && (
            <p className="hint error-text" role="alert">
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="b" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {value?.asset ? 'Replace photo' : 'Choose photo'}
            </button>
            {value?.asset && (
              <button className="b b-danger" type="button" onClick={() => onChange(undefined)}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void choose(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
