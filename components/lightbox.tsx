'use client'

import { useEffect, useRef } from 'react'
import { SanityImage, type Photo } from './sanity-image'

/**
 * Full-screen image viewer. Arrow keys move through the images, Escape closes,
 * focus moves into the viewer and returns to the image that opened it.
 */
export function Lightbox({
  photos,
  index,
  title,
  onChange,
  onClose,
}: {
  photos: Photo[]
  index: number
  title: string
  onChange: (index: number) => void
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const n = photos.length
  const prev = () => onChange((index - 1 + n) % n)
  const next = () => onChange((index + 1) % n)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onChange((index - 1 + n) % n)
      if (e.key === 'ArrowRight') onChange((index + 1) % n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, n, onChange, onClose])

  const photo = photos[index]
  const pad = (x: number) => String(x).padStart(2, '0')

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={`${title}, image viewer`}>
      <div className="viewer-bar">
        <span className="label num" aria-live="polite">
          {title} · {pad(index + 1)} / {pad(n)}
        </span>
        <button ref={closeRef} className="arrow" type="button" onClick={onClose}>
          <span>Close</span>
        </button>
      </div>
      <div className="viewer-stage">
        <SanityImage key={photo?.asset?._id} value={photo} sizes="100vw" fill />
      </div>
      <div className="viewer-bar">
        <button className="arrow back" type="button" onClick={prev} disabled={n < 2}>
          <b aria-hidden="true">←</b>
          <span>Previous</span>
        </button>
        <span className="caption hide-m" style={{ textAlign: 'center' }}>
          {photo?.caption ?? photo?.alt}
        </span>
        <button className="arrow" type="button" onClick={next} disabled={n < 2}>
          <span>Next</span>
          <b aria-hidden="true">→</b>
        </button>
      </div>
    </div>
  )
}
